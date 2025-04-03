/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,css,scss}",
  ],
  theme: {
    extend: {
      colors: {
        raisin: {
          DEFAULT: '#2d2a32',
          100: '#09080a',
          200: '#121114',
          300: '#1b191e',
          400: '#242128',
          500: '#2d2a32',
          600: '#565060',
          700: '#7f768d',
          800: '#aaa4b3',
          900: '#d4d1d9'
        },
        citrine: {
          DEFAULT: '#ddd92a',
          100: '#2e2d07',
          200: '#5b5a0f',
          300: '#898716',
          400: '#b6b41e',
          500: '#ddd92a',
          600: '#e4e157',
          700: '#eae981',
          800: '#f1f0ab',
          900: '#f8f8d5'
        },
        maize: {
          DEFAULT: '#eae151',
          100: '#383507',
          200: '#716a0e',
          300: '#a99f15',
          400: '#e1d41c',
          500: '#eae151',
          600: '#eee675',
          700: '#f2ec98',
          800: '#f6f2ba',
          900: '#fbf9dd'
        },
        vanilla: {
          DEFAULT: '#eeefa8',
          100: '#44450d',
          200: '#888a19',
          300: '#cccf26',
          400: '#e0e364',
          500: '#eeefa8',
          600: '#f1f2ba',
          700: '#f5f6cb',
          800: '#f8f9dd',
          900: '#fcfcee'
        },
        babypowder: {
          DEFAULT: '#fafdf6',
          100: '#365212',
          200: '#6ca424',
          300: '#9fd953',
          400: '#cdeba5',
          500: '#fafdf6',
          600: '#fbfef8',
          700: '#fcfefa',
          800: '#fdfefc',
          900: '#fefffd'
        }
      },
    },
  },
  plugins: [],
}

