/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        greige: '#F3F3F1',
        ink: '#1B1A1F',
        gold: '#A8842B',
      },
      fontFamily: {
        caslon: ['"Libre Caslon Display"', 'serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
