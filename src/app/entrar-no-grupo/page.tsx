import { redirect } from 'next/navigation';

export default async function EntrarNoGrupoRootRedirect({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const token = resolvedParams?.token;
  if (token && typeof token === 'string') {
    redirect(`/ellos/entrar-no-grupo?token=${encodeURIComponent(token)}`);
  }
  redirect('/ellos/entrar-no-grupo');
}
