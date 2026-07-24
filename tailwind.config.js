/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#f97316',
          hover: '#ea580c',
          light: '#fb923c',
        }
      }
    },
  },
  plugins: [],
}
