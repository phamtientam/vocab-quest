/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fredoka One"', 'cursive'],
        body: ['"Nunito"', 'sans-serif'],
      },
      colors: {
        sky: { 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7' },
        lemon: { 300: '#fde047', 400: '#facc15', 500: '#eab308' },
        lime: { 400: '#a3e635', 500: '#84cc16' },
        coral: { 400: '#fb923c', 500: '#f97316' },
        grape: { 400: '#c084fc', 500: '#a855f7' },
        rose: { 400: '#fb7185', 500: '#f43f5e' },
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'pop': 'pop 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'kid': '0 8px 0 rgba(0,0,0,0.15)',
        'kid-hover': '0 12px 0 rgba(0,0,0,0.2)',
        'glow-yellow': '0 0 20px rgba(250,204,21,0.7)',
        'glow-blue': '0 0 20px rgba(56,189,248,0.7)',
        'glow-green': '0 0 20px rgba(163,230,53,0.7)',
        'glow-coral': '0 0 20px rgba(251,146,60,0.7)',
      },
    },
  },
  plugins: [],
};
