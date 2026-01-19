import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Rafiqui - Economía circular solar
        primary: {
          DEFAULT: "#E6086A", // Razzmatazz - Rosa Rafiqui
          50: "#FFF0F5",
          100: "#FFE0EB",
          200: "#FFC2D7",
          300: "#FF94B8",
          400: "#FF5C93",
          500: "#E6086A",
          600: "#CC0660",
          700: "#B30554",
          800: "#990448",
          900: "#80033C",
        },
        accent: {
          DEFAULT: "#93E1D8", // Tiffany Blue - Turquesa
          50: "#F0FDFB",
          100: "#E0FAF6",
          200: "#C2F5ED",
          300: "#93E1D8",
          400: "#6DD4C8",
          500: "#4DC7B8",
          600: "#3AAFA0",
          700: "#2E9488",
          800: "#257A70",
          900: "#1C5F58",
        },
        dark: {
          DEFAULT: "#102038", // Oxford Blue
          50: "#F0F4F8",
          100: "#D9E2EC",
          200: "#BCCCDC",
          300: "#9FB3C8",
          400: "#829AB1",
          500: "#627D98",
          600: "#486581",
          700: "#334E68",
          800: "#1A3A52",
          900: "#102038",
          950: "#0A1525",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "rafiqui-gradient": "linear-gradient(135deg, #102038 0%, #1A3A52 100%)",
        "rafiqui-accent": "linear-gradient(135deg, #E6086A 0%, #93E1D8 100%)",
        "rafiqui-dark": "linear-gradient(180deg, #102038 0%, #0A1525 100%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px #E6086A, 0 0 10px #E6086A" },
          "100%": { boxShadow: "0 0 20px #E6086A, 0 0 30px #E6086A" },
        },
        "glow-accent": {
          "0%": { boxShadow: "0 0 5px #93E1D8, 0 0 10px #93E1D8" },
          "100%": { boxShadow: "0 0 20px #93E1D8, 0 0 30px #93E1D8" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
