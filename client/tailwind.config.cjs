/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#1c1b1a",
        link: "#0025ff",
        clay: "#f7f3ee",
        ember: "#d97342",
        emberSoft: "#f3c2a6",
        sand: "#fffaf6",
        bark: "#6b635a",
        border: "#e7ddd3",
      },
      boxShadow: {
        soft: "0 20px 50px rgba(65, 53, 41, 0.15)",
      },
    },
  },
  plugins: [],
};
