import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ellos Hub — Gestão & Repertório Musical',
    short_name: 'Ellos Hub',
    description: 'Plataforma oficial de organização, agenda, repertório e tarefas do Grupo Vocal Ellos.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F223D',
    theme_color: '#D4AF37',
    icons: [
      {
        src: '/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
