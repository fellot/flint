/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        red: { 50: '#fcf3f4', 100: '#f6e4e8', 200: '#ecc8d1', 300: '#dda2b1', 400: '#c7738b', 500: '#af4565', 600: '#9a2c4d', 700: '#851c38', 800: '#67192e', 900: '#481221' },
        wine: { 50: '#fcf3f4', 100: '#f6e4e8', 200: '#ecc8d1', 300: '#dda2b1', 400: '#c7738b', 500: '#af4565', 600: '#9a2c4d', 700: '#851c38', 800: '#67192e', 900: '#481221' },
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
