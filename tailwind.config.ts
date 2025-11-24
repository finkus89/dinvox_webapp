import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // 👈 igual que Trasari: modo oscuro por clase .dark
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#E5FBF6",  // muy claro, casi blanco con tinte verde
          100: "#C7F8EE",
          200: "#9FF1DF",
          300: "#72E4CF",
          400: "#3FD1BB",
          500: "#0FAE96",  // ⭐ verde metalizado principal
          600: "#0B806F",
          700: "#086257",
          800: "#064A43",
          900: "#043531",
        },
      },  
    },
  },
  plugins: [],
};

export default config;
