import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/common/ThemeProvider';
import { TenantProvider } from '@/context/TenantContext';
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Hub de Gestão & Repertório Musical',
  description: 'Plataforma para organização e gestão de compromissos, repertório e tarefas.',
  icons: {
    icon: '/icon-512.svg',
    shortcut: '/icon-512.svg',
    apple: '/icon-512.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-[#0F223D] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <TenantProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </TenantProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
