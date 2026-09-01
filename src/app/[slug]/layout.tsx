import React from 'react';
import { TenantProvider } from '@/context/TenantContext';

interface SlugLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function SlugLayout({ children, params }: SlugLayoutProps) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || 'ellos';

  return (
    <TenantProvider slug={slug}>
      {children}
    </TenantProvider>
  );
}
