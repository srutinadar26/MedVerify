/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50:  '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        cyan: {
          400: '#22D3EE',
          500: '#06B6D4',
        },
        maroon:  '#0D9488',
        blush:   '#5EEAD4',
        softPink:'#CCFBF1',
        lavender:'#99F6E4',
        silver:  '#CBD5E1',
        pearl:   '#F7FAFA',
        darkText:'#0F172A',
        secondaryText: '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'xs':  ['0.8125rem', { lineHeight: '1.25rem' }],
        'sm':  ['0.9375rem', { lineHeight: '1.4rem' }],
        'base':['1.0625rem', { lineHeight: '1.65rem' }],
        'lg':  ['1.1875rem', { lineHeight: '1.75rem' }],
        'xl':  ['1.3125rem', { lineHeight: '1.85rem' }],
        '2xl': ['1.625rem',  { lineHeight: '2rem' }],
        '3xl': ['2rem',      { lineHeight: '2.35rem' }],
        '4xl': ['2.5rem',    { lineHeight: '2.85rem' }],
        '5xl': ['3.25rem',   { lineHeight: '3.5rem' }],
      },
      boxShadow: {
        'glow': '0 0 24px rgba(20, 184, 166, 0.25)',
        'soft': '0 8px 30px rgba(13, 148, 136, 0.08)',
      },
    },
  },
  plugins: [],
}