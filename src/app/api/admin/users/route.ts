import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const getAdminClient = () => {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// GET: Listar todos os usuários/perfis
export async function GET() {
  try {
    const supabaseAdmin = getAdminClient();
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ users: profiles || [] });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro interno do servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST: Criar novo usuário no Auth + public.profiles
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, voice, role, password } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando: e-mail e nome.' },
        { status: 400 }
      )
    }

    const emailClean = String(email).trim().toLowerCase();
    const userPassword = password || 'Ellos@2026';
    const supabaseAdmin = getAdminClient();

    // 1. Criar no Supabase Auth Admin
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: emailClean,
      password: userPassword,
      email_confirm: true,
      user_metadata: { name, voice, role },
    });

    const newUserId = authData?.user?.id || `prof-${Date.now()}`;

    // 2. Inserir em public.profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUserId,
        email: emailClean,
        name: String(name).trim(),
        voice: voice || 'Soprano',
        role: role || 'MEMBER',
      })
      .select()
      .single();

    if (profileError) {
      console.warn('Erro ao inserir perfil public.profiles:', profileError);
    }

    return NextResponse.json({
      success: true,
      user: profile || { id: newUserId, email: emailClean, name, voice, role },
      tempPassword: userPassword,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro interno ao criar usuário';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE: Apagar usuário no Auth e em public.profiles
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Especifique o ID ou e-mail do usuário para exclusão.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getAdminClient();

    if (userId) {
      // Deletar no Supabase Auth
      await supabaseAdmin.auth.admin.deleteUser(userId).catch((e) => console.warn('Auth delete warning:', e));
      // Deletar em public.profiles
      await supabaseAdmin.from('profiles').delete().eq('id', userId);
    } else if (email) {
      await supabaseAdmin.from('profiles').delete().eq('email', email);
    }

    return NextResponse.json({ success: true, message: 'Usuário excluído com sucesso.' });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro interno ao excluir usuário';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
