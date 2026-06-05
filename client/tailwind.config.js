/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // VT323 = ekte CRT-terminalfont. IBM Plex Mono = lesbar brødtekst.
        display: ['VT323', 'monospace'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        sans: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Semantiske tema-tokens (CRT-fosfor ↔ papirutskrift).
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
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        flicker: {
          '0%, 19%, 21%, 55%, 57%, 100%': { opacity: '1' },
          '20%, 56%': { opacity: '0.82' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'type-in': {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
        'boot-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        blink: 'blink 1.1s step-end infinite',
        flicker: 'flicker 4s linear infinite',
        scan: 'scan 7s linear infinite',
        'boot-up': 'boot-up 0.35s steps(6, end) both',
      },
    },
  },
  plugins: [],
};
