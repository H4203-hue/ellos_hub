import { NextResponse } from 'next/server';
import type { RepertoireTag } from '@/types';
import { requireWorkspaceRole, AuthError } from '@/lib/auth/requireWorkspaceRole';
import { assertTrustedOrigin, UntrustedOriginError } from '@/lib/security/app-url';
import { sanitizeShortText } from '@/lib/security/input-validation';

// Armazenamento temporário até as tags serem persistidas no Supabase.
// A chave por workspace evita que dados de organizações diferentes se misturem.
const tagsByWorkspace = new Map<string, RepertoireTag[]>();
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

function getWorkspaceTags(workspaceId: string): RepertoireTag[] {
  return tagsByWorkspace.get(workspaceId) ?? [];
}

function normalizeName(value: unknown): string {
  const name = sanitizeShortText(value, 60).replace(/^#+/, '');
  return name ? `#${name}` : '';
}

function normalizeColor(value: unknown, fallback = '#D4AF37'): string {
  const color = sanitizeShortText(value, 7);
  return COLOR_PATTERN.test(color) ? color.toUpperCase() : fallback;
}

function authErrorResponse(error: unknown) {
  if (error instanceof UntrustedOriginError) {
    return NextResponse.json({ error: 'Origem da requisição não autorizada.' }, { status: 403 });
  }

  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json({ error: 'Não foi possível concluir a operação.' }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const { workspaceId } = await requireWorkspaceRole(request, ['OWNER', 'ADMIN']);
    return NextResponse.json({ tags: getWorkspaceTags(workspaceId) });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const { workspaceId } = await requireWorkspaceRole(request, ['OWNER', 'ADMIN']);
    const body = await request.json();
    const name = normalizeName(body.name);

    if (!name) {
      return NextResponse.json({ error: 'Nome da tag é obrigatório.' }, { status: 400 });
    }

    const currentTags = getWorkspaceTags(workspaceId);
    if (currentTags.some((tag) => tag.name.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'))) {
      return NextResponse.json({ error: 'Já existe uma tag com esse nome.' }, { status: 409 });
    }

    const newTag: RepertoireTag = {
      id: crypto.randomUUID(),
      name,
      colorHex: normalizeColor(body.colorHex),
      description: sanitizeShortText(body.description, 240),
    };
    const tags = [newTag, ...currentTags];
    tagsByWorkspace.set(workspaceId, tags);

    return NextResponse.json({ success: true, tag: newTag, tags }, { status: 201 });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    assertTrustedOrigin(request);
    const { workspaceId } = await requireWorkspaceRole(request, ['OWNER', 'ADMIN']);
    const body = await request.json();
    const id = sanitizeShortText(body.id, 100);
    const currentTags = getWorkspaceTags(workspaceId);
    const existingTag = currentTags.find((tag) => tag.id === id);

    if (!id || !existingTag) {
      return NextResponse.json({ error: 'Tag não encontrada.' }, { status: 404 });
    }

    const name = body.name === undefined ? existingTag.name : normalizeName(body.name);
    if (!name) {
      return NextResponse.json({ error: 'Nome da tag é obrigatório.' }, { status: 400 });
    }

    if (
      currentTags.some(
        (tag) => tag.id !== id && tag.name.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR')
      )
    ) {
      return NextResponse.json({ error: 'Já existe uma tag com esse nome.' }, { status: 409 });
    }

    const tags = currentTags.map((tag) =>
      tag.id === id
        ? {
            ...tag,
            name,
            colorHex: body.colorHex === undefined ? tag.colorHex : normalizeColor(body.colorHex, tag.colorHex),
            description:
              body.description === undefined ? tag.description : sanitizeShortText(body.description, 240),
          }
        : tag
    );
    tagsByWorkspace.set(workspaceId, tags);

    return NextResponse.json({ success: true, tags });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertTrustedOrigin(request);
    const { workspaceId } = await requireWorkspaceRole(request, ['OWNER', 'ADMIN']);
    const id = sanitizeShortText(new URL(request.url).searchParams.get('id'), 100);
    const currentTags = getWorkspaceTags(workspaceId);

    if (!id || !currentTags.some((tag) => tag.id === id)) {
      return NextResponse.json({ error: 'Tag não encontrada.' }, { status: 404 });
    }

    const tags = currentTags.filter((tag) => tag.id !== id);
    tagsByWorkspace.set(workspaceId, tags);
    return NextResponse.json({ success: true, tags });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
