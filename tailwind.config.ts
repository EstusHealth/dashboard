import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#12121e",
        card: "#1e1e32",
        border: "#2a2a3e",
        foreground: "#e2e8f0",
        muted: "#94a3b8",
        accent: "#60a5fa",
      },
      fontFamily: {
        sans: ['"DM Sans"', "sans-serif"],
        mono: ['"Space Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
