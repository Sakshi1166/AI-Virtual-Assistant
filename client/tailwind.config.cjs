/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        jarvis: {
          primary: '#38bdf8',
          accent: '#a855f7'
        }
      }
    }
  },
  plugins: []
};

