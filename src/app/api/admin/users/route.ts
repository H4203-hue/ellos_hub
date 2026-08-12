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
    const { email, name, voice, role, password, phone } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando: e-mail e nome.' },
        { status: 400 }
      );
    }

    const emailClean = String(email).trim().toLowerCase();
    const userPassword = password || 'Ellos@2026';
    const supabaseAdmin = getAdminClient();

    // 1. Criar no Supabase Auth Admin
    const { data: authData } = await supabaseAdmin.auth.admin.createUser({
      email: emailClean,
      password: userPassword,
      email_confirm: true,
      user_metadata: { name, voice, role, phone },
    }).catch(() => ({ data: null }));

    const newUserId = authData?.user?.id || `prof-${Date.now()}`;

    // 2. Inserir em public.profiles
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUserId,
        email: emailClean,
        name: String(name).trim(),
        voice: voice || 'Soprano',
        role: role || 'MEMBER',
        phone: phone || null,
        is_active: true,
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      user: profile || { id: newUserId, email: emailClean, name, voice, role, phone, isActive: true },
      tempPassword: userPassword,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro interno ao criar usuário';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT: Editar dados do integrante (Perfil & Supabase Auth)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, email, name, voice, role, phone, isActive, password } = body;

    if (!id && !email) {
      return NextResponse.json(
        { error: 'ID ou e-mail do integrante é obrigatório para edição.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getAdminClient();

    let targetId = id;
    const emailClean = email ? String(email).trim().toLowerCase() : undefined;

    if (!targetId && emailClean) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', emailClean)
        .single();
      if (profile) targetId = profile.id;
    }

    // 1. Atualizar em public.profiles
    const updatePayload: Record<string, unknown> = {};
    if (name !== undefined) updatePayload.name = String(name).trim();
    if (emailClean !== undefined) updatePayload.email = emailClean;
    if (voice !== undefined) updatePayload.voice = voice;
    if (role !== undefined) updatePayload.role = role;
    if (phone !== undefined) updatePayload.phone = phone;
    if (isActive !== undefined) updatePayload.is_active = Boolean(isActive);

    if (targetId) {
      await supabaseAdmin
        .from('profiles')
        .update(updatePayload)
        .eq('id', targetId);

      // 2. Atualizar Metadata e Senha no Supabase Auth se fornecida
      const authUpdatePayload: Record<string, unknown> = {
        email: emailClean,
        user_metadata: { name, voice, role, phone },
      };
      if (password && String(password).trim()) {
        authUpdatePayload.password = String(password).trim();
      }

      await supabaseAdmin.auth.admin.updateUserById(targetId, authUpdatePayload)
        .catch((e) => console.warn('Auth update metadata warning:', e));
    } else if (emailClean) {
      await supabaseAdmin
        .from('profiles')
        .update(updatePayload)
        .eq('email', emailClean);
    }

    return NextResponse.json({
      success: true,
      message: '✨ Dados do integrante atualizados com sucesso!',
      updated: { id: targetId, email: emailClean, name, voice, role, phone, isActive },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar dados do integrante';
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
      await supabaseAdmin.auth.admin.deleteUser(userId).catch((e) => console.warn('Auth delete warning:', e));
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
