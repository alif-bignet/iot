// tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{html,js,svelte,ts}'], // <-- Add this line
    theme: {
      extend: {
        colors: {
          'trisakti-blue': '#005689'
        },
        fontFamily: {
          sans: ['Poppins', 'system-ui', 'sans-serif']
        }
      },
    },
    plugins: [],
  }