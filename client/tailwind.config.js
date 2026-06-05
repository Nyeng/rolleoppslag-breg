/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Inter er typografien i Digdir Designsystemet.
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Fargeskala inspirert av Designsystemet sin accent (blå) og nøytrale toner.
        accent: {
          50: '#eef6ff',
          100: '#d9ecff',
          200: '#bcddff',
          300: '#8ec8ff',
          400: '#59a8ff',
          500: '#3385ff',
          600: '#1d63d6',
          700: '#0a4ea3',
          800: '#0b3f80',
          900: '#0d3666',
        },
        neutral: {
          50: '#f7f8fa',
          100: '#eceef1',
          200: '#dadde2',
          300: '#bcc1ca',
          400: '#969caa',
          500: '#6b7280',
          600: '#4d5560',
          700: '#3a414b',
          800: '#262b32',
          900: '#1a1d22',
        },
        success: '#118849',
        successbg: '#e5f3eb',
        warning: '#8a5a00',
        warningbg: '#fdf3e0',
        danger: '#c01c28',
        dangerbg: '#fbe9eb',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
