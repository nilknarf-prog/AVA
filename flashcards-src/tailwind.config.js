/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Alinha o slate ao tema zinc/Delta do index.html
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#27272a',
          800: '#18181b',
          900: '#09090b',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
