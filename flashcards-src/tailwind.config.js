/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Spectral', 'Georgia', 'serif'],
        body: ['Public Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          DEFAULT: '#ff6b00',
          dim: '#e65c00',
          soft: 'rgba(255,107,0,0.14)',
          glow: 'rgba(255,107,0,0.18)',
        },
        ava: {
          bg: '#0b0f1a',
          surface: '#131929',
          surfaceHover: '#1a2235',
          surface2: '#1a2235',
          surface3: '#1f2a3c',
          border: 'rgba(255,255,255,0.09)',
          borderHot: 'rgba(255,107,0,0.4)',
          text: '#e8eaf0',
          muted: '#9aa5bb',
          dim: '#7d889e',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
