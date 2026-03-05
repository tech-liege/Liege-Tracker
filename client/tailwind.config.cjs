/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#102a43",
        link: "#155eef",
        clay: "#e8f1f8",
        ember: "#0f766e",
        emberSoft: "#bfeae5",
        sand: "#f7fbff",
        bark: "#486581",
        border: "#c9d9e8",
      },
      boxShadow: {
        soft: "0 20px 50px rgba(16, 42, 67, 0.14)",
      },
    },
  },
  plugins: [],
};
