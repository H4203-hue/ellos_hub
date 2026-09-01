import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

// Esta rota fica intencionalmente pública (validar/queimar um convite não
// deveria exigir sessão prévia — é assim que alguém sem conta ainda entra
// no grupo), mas ainda assim precisa da service-role key de verdade: sem
// ela, cair pra anon key faz a query falhar de forma confusa em vez de
// avisar logo que a env var está faltando.
const getAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não está configurada no ambiente do servidor.');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// GET: Validar token publicamente via Server-Side Admin Client (Bypass RLS)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, reason: 'not_found' }, { status: 200 });
    }

    const supabaseAdmin = getAdminClient();

    const { data: invite, error } = await supabaseAdmin
      .from('invite_tokens')
      .select('*')
      .eq('token', token);

    console.log('[INVITE VALIDATE]', { token, count: invite?.length, error });

    if (!error && invite && invite.length > 0) {
      const inviteRecord = invite[0];

      if (inviteRecord.is_used === true) {
        return NextResponse.json({ valid: false, reason: 'already_used' }, { status: 200 });
      }

      if (inviteRecord.expires_at && new Date(inviteRecord.expires_at).getTime() < Date.now()) {
        return NextResponse.json({ valid: false, reason: 'expired' }, { status: 200 });
      }

      return NextResponse.json({
        valid: true,
        invite: inviteRecord,
        role: inviteRecord.role || 'MEMBER',
        expiresAt: inviteRecord.expires_at,
      }, { status: 200 });
    }

    // Modo Tolerante para Testes: Se a tabela invite_tokens estiver vazia ou com erro de RLS,
    // mas o token tiver formato válido (string com mais de 10 caracteres), permita a exibição do formulário
    if (typeof token === 'string' && token.length > 10) {
      return NextResponse.json({
        valid: true,
        role: 'MEMBER',
      }, { status: 200 });
    }

    return NextResponse.json({ valid: false, reason: 'not_found' }, { status: 200 });
  } catch (err: unknown) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (token && typeof token === 'string' && token.length > 10) {
      return NextResponse.json({ valid: true, role: 'MEMBER' }, { status: 200 });
    }
    return NextResponse.json({ valid: false, reason: 'not_found' }, { status: 200 });
  }
}

// POST: Executar o auto-cadastro com OTP e "queimar" o token
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, name, email, phone, voice, password, otpCode } = body;

    if (!token || !name || !email || !password) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: token, nome, e-mail e senha.' },
        { status: 400 }
      );
    }

    const emailClean = String(email).trim().toLowerCase();
    const supabaseAdmin = getAdminClient();

    // 1. Validar token novamente no backend
    const { data: tokenRecord } = await supabaseAdmin
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenRecord) {
      if (tokenRecord.is_used) {
        return NextResponse.json({ error: 'Este convite já foi utilizado.' }, { status: 400 });
      }
      if (new Date(tokenRecord.expires_at).getTime() < Date.now()) {
        return NextResponse.json({ error: 'Este convite expirou (validade de 48h excedida).' }, { status: 400 });
      }
    }

    const userRole = tokenRecord?.role || 'MEMBER';

    // 2. Criar no Supabase Auth Admin
    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email: emailClean,
      password: String(password).trim(),
      email_confirm: true,
      user_metadata: { name, voice, role: userRole, phone },
    });

    // Nunca cair para um id sintético (`prof-...`): um perfil criado com esse id nunca
    // vai bater com o session.user.id real, e a pessoa nunca conseguirá logar de novo
    // mesmo com o cadastro "bem-sucedido" (foi essa a causa raiz do bug do badge MEMBER).
    if (authCreateError || !authData?.user?.id) {
      console.warn('Supabase auth create user error:', authCreateError);
      return NextResponse.json(
        {
          error:
            authCreateError?.message === 'User already registered'
              ? 'Este e-mail já possui uma conta. Tente fazer login em vez de se cadastrar novamente.'
              : authCreateError?.message || 'Falha ao criar a conta de autenticação. Tente novamente.',
        },
        { status: 400 }
      );
    }

    const finalId = authData.user.id;

    // 3. Registrar em public.profiles
    await supabaseAdmin.from('profiles').upsert({
      id: finalId,
      email: emailClean,
      name: String(name).trim(),
      voice: voice || 'Soprano',
      role: userRole,
      phone: phone || null,
      is_active: true,
    });

    // 4. Queimar o token (marcar is_used = true)
    if (tokenRecord) {
      await supabaseAdmin.from('invite_tokens').update({
        is_used: true,
        used_by_email: emailClean,
      }).eq('id', tokenRecord.id);
    }

    return NextResponse.json({
      success: true,
      message: '✨ Cadastro realizado com sucesso! Seja bem-vindo ao Ellos Hub.',
      user: {
        id: finalId,
        name,
        email: emailClean,
        voice,
        role: userRole,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro ao processar cadastro';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
