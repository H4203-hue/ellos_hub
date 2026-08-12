import { NextResponse } from 'next/server';
import { RepertoireTag } from '@/types';

// In-memory / Mock fallback store para Tags do Repertório
let initialTags: RepertoireTag[] = [
  { id: 'tag-1', name: '#EllosAutoral', colorHex: '#D4AF37', description: 'Músicas de composição própria do Ellos' },
  { id: 'tag-2', name: '#EspecialCTJ', colorHex: '#3B82F6', description: 'Músicas preparadas para eventos do CTJ' },
  { id: 'tag-3', name: '#MaisVocal', colorHex: '#10B981', description: 'Arranjos do grupo Mais Vocal' },
  { id: 'tag-4', name: '#Acapella', colorHex: '#8B5CF6', description: 'Execução sem acompanhamento instrumental' },
];

export async function GET() {
  return NextResponse.json({ tags: initialTags });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, colorHex, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome da tag é obrigatório.' }, { status: 400 });
    }

    const newTag: RepertoireTag = {
      id: `tag-${Date.now()}`,
      name: name.startsWith('#') ? name : `#${name}`,
      colorHex: colorHex || '#D4AF37',
      description: description || '',
    };

    initialTags = [newTag, ...initialTags];
    return NextResponse.json({ success: true, tag: newTag, tags: initialTags });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro ao criar tag';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, colorHex, description } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da tag é obrigatório.' }, { status: 400 });
    }

    initialTags = initialTags.map((t) =>
      t.id === id
        ? {
            ...t,
            name: name ? (name.startsWith('#') ? name : `#${name}`) : t.name,
            colorHex: colorHex || t.colorHex,
            description: description !== undefined ? description : t.description,
          }
        : t
    );

    return NextResponse.json({ success: true, tags: initialTags });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar tag';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da tag é obrigatório para exclusão.' }, { status: 400 });
    }

    initialTags = initialTags.filter((t) => t.id !== id);
    return NextResponse.json({ success: true, tags: initialTags });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir tag';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
