import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#FFFFFF',
        bgSoft: '#F9FAFB',
        textPrimary: '#000000',
        textMuted: '#6B7280',
        accentPrimary: 'var(--brand-primary, #E7F78F)',
        accentSecondary: 'var(--brand-secondary, #D6F6E5)',
        borderLight: '#E5E7EB',
      },
    },
  },
  plugins: [],
}

export default config
