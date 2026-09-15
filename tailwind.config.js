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
        red: { 50: '#f8f0ee', 100: '#eededb', 200: '#ddbeb9', 300: '#c99893', 400: '#b27670', 500: '#99595b', 600: '#884852', 700: '#783c47', 800: '#653440', 900: '#4a2931' },
        wine: { 50: '#f8f0ee', 100: '#eededb', 200: '#ddbeb9', 300: '#c99893', 400: '#b27670', 500: '#99595b', 600: '#884852', 700: '#783c47', 800: '#653440', 900: '#4a2931' },
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
