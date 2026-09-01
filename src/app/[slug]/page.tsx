import { redirect } from 'next/navigation';

interface SlugPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SlugRootPage({ params }: SlugPageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || 'ellos';
  redirect(`/${slug}/agenda`);
}
