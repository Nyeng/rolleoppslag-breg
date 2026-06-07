/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Share Tech Mono"', 'monospace'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        sans: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        fg: 'var(--text)',
        'fg-dim': 'var(--text-dim)',
        'fg-faint': 'var(--text-faint)',
        accent: 'var(--accent)',
        'accent-2': 'var(--accent-2)',
        line: 'var(--border)',
        'line-strong': 'var(--border-strong)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease both',
      },
    },
  },
  plugins: [],
};
