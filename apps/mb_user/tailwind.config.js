/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#080C14',
        surface: '#0F172A',
        surfaceAlt: '#0B0F17',
        borderDark: '#1E293B',
        emeraldStatus: '#10B981',
        cyanStatus: '#06B6D4',
        amberStatus: '#F59E0B',
        roseStatus: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

