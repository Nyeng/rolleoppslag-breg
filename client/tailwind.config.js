/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Semantiske tema-tokens (bytter med lyst/mørkt tema via CSS-variabler).
        bg: 'var(--bg)',
        surface: 'var(--surface-solid)',
        fg: 'var(--text)',
        'fg-muted': 'var(--text-muted)',
        'fg-faint': 'var(--text-faint)',
        line: 'var(--border)',
        'line-strong': 'var(--border-strong)',
        // Dypt, premium mørkt fundament (Linear/Vercel-aktig).
        ink: {
          950: '#06070a',
          900: '#0a0c12',
          850: '#0d0f17',
          800: '#11141d',
          700: '#171b27',
          600: '#1f2433',
          500: '#2a3042',
        },
        // Aksenter brukt for glød/gradienter.
        violet: { DEFAULT: '#8b5cf6', soft: '#a78bfa' },
        cyan: { DEFAULT: '#22d3ee', soft: '#67e8f9' },
        emerald: { DEFAULT: '#34d399', soft: '#6ee7b7' },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px -20px rgba(0,0,0,0.7)',
        'glow-violet': '0 0 40px -8px rgba(139,92,246,0.45)',
        'glow-emerald': '0 0 40px -8px rgba(52,211,153,0.40)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'dash-flow': {
          to: { strokeDashoffset: '-24' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.55s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.6s ease both',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        shimmer: 'shimmer 1.8s infinite',
        'dash-flow': 'dash-flow 1s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'spin-slow': 'spin-slow 18s linear infinite',
      },
    },
  },
  plugins: [],
};
