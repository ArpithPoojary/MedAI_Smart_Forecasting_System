/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6",   // MedAI Blue 🔥
        dark: "#1E293B",
        bg: "#F8FAFC",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        card: "0 2px 10px rgba(0,0,0,0.05)",
      },
    },
  },
  plugins: [],
};