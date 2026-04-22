/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.js",
    "./resources/**/*.jsx",
    "./resources/**/*.ts",
    "./resources/**/*.tsx",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4CAF50',
        accent: '#2196F3',
        warning: '#FF9800',
        success: '#4CAF50',
        error: '#F44336',
      }
    },
  },
  plugins: [],
}