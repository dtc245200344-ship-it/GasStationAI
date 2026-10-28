/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        secondary: "#475569",
        accent: "#38BDF8",
        dark: "#0F172A",
        light: "#F8FAFC"
      }
    },
  },
  plugins: [],
}
