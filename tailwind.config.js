/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        mj: {
          50: '#f0f7f7',
          100: '#d9eeec',
          200: '#b4ddd9',
          300: '#7ec4bf',
          400: '#4da8a1',
          500: '#2e8c86',
          600: '#1f706c',
          700: '#1a5b58',
          800: '#174a48',
          900: '#133c3b',
          950: '#0a2524',
        },
        gold: {
          50: '#fdf9ef',
          100: '#f9f0d4',
          200: '#f2dfa6',
          300: '#e8c86e',
          400: '#dfb143',
          500: '#d49a2a',
          600: '#ba7a1f',
          700: '#9a5b1c',
          800: '#7e491e',
          900: '#693d1c',
        },
      },
    },
  },
  plugins: [],
};
