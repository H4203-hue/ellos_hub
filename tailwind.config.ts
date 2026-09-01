import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/contexts/**/*.{js,ts,jsx,tsx,mdx}',
    './src/context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'theme-primary': 'var(--theme-primary, #D4AF37)',
        'theme-primary-light': 'var(--theme-primary-light, #F3E5AB)',
        'theme-primary-dark': 'var(--theme-primary-dark, #AA8822)',
        'ellos-gold': 'var(--theme-primary, #D4AF37)',
        'ellos-gold-light': 'var(--theme-primary-light, #F3E5AB)',
        'ellos-gold-dark': 'var(--theme-primary-dark, #AA8822)',
        'ellos-navy': '#111827',
        'ellos-navy-surface': '#1F2937',
        'ellos-navy-sidebar': '#0F172A',
      },
    },
  },
  plugins: [],
};

export default config;
