/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'warm': {
          50: '#FFF8F1',
          100: '#FFE8D6',
          200: '#FFD0A8',
          300: '#FFB07A',
          400: '#FF8C42',
          500: '#F56B00',
          600: '#D95A00',
          700: '#B04800',
          800: '#883800',
          900: '#662A00',
        },
        'cream': {
          50: '#FDFCF8',
          100: '#F8F3E8',
          200: '#EFE6D0',
          300: '#E2D3AE',
          400: '#D2BB85',
          500: '#C1A25D',
          600: '#A58645',
          700: '#836838',
          800: '#665030',
          900: '#4E3E29',
        },
        'earth': {
          50: '#F5F1EE',
          100: '#E6DED7',
          200: '#CCBBAD',
          300: '#B0947F',
          400: '#947156',
          500: '#7A5640',
          600: '#624334',
          700: '#4D342B',
          800: '#3B2823',
          900: '#2C1E1C',
        }
      },
      fontFamily: {
        'sans': ['system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(122, 86, 64, 0.1), 0 2px 4px -2px rgba(122, 86, 64, 0.1)',
        'card-hover': '0 10px 15px -3px rgba(122, 86, 64, 0.15), 0 4px 6px -4px rgba(122, 86, 64, 0.15)',
      }
    },
  },
  plugins: [],
}
