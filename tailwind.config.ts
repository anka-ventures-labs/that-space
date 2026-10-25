import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#5C3D2E", deep: "#3F2A1F", 700: "#4E3326", 500: "#6E4D3C", 400: "#7A5A48" },
        kraft: { DEFAULT: "#C4A882", 600: "#A88B66", 300: "#D2BE9C" },
        washi: { DEFAULT: "#F5F0E8", 200: "#EFE7DA" },
        crease: "#E2D4BC",
        sheet: "#FBF8F2",
        accent: "#8A6450",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-vietnam)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
