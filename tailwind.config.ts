import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#0B3C5D",
          accent: "#1F7A8C",
          light: "#F4F7FA",
          dark: "#111827",
        },
      },
    },
  },
  plugins: [],
};

export default config;
