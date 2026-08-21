/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blush: '#E9B8C8',
        softPink: '#F4DDE5',
        lavender: '#DDD6F3',
        silver: '#D8D8DE',
        pearl: '#FAF8FC',
        darkText: '#292633',
        secondaryText: '#77727F',
        maroon: '#800020',
      }
    },
  },
  plugins: [],
}