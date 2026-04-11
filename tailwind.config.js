/** @type {import('tailwindcss').Config} */
const layoutTokens = require("./src/lib/layout-tokens");

module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-app-inter)", "sans-serif"],
        heading: ["var(--font-app-inter)", "sans-serif"],
      },
      colors: {
        "brand-red": "#f12d33",
        "light-gray": "#d9d9d9",
        "brand-green": "#03c75a",
        "dark-gray": "#6a7282",
        "gray-border": "#e5e7eb",
        "bubble-gray": "#f1f1f1",
        "muted-brown": "#695656",
        "gray-300": "#e2e8f0",
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.625rem",
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.375rem",
        "4xl": "1.625rem",
      },
      width: layoutTokens.width,
      screens: {
        s1: layoutTokens.width.s1,
        s2: layoutTokens.width.s2,
      },
    },
  },
};
