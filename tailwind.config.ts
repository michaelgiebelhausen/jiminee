import type { Config } from "tailwindcss";

// Design tokens from docs/design.md — the source of truth.
// Locked brand colors: primary #0D6036, ink #1D2B1D. Never restyle outside these tokens.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#0D6036", hover: "#0A4A2A" },
        "on-primary": "#FFFFFF",
        ink: { DEFAULT: "#1D2B1D", secondary: "#6B6770", muted: "#8D8791" },
        background: "#FAF6F4",
        surface: { DEFAULT: "#FFFFFF", sunken: "#F3ECE9" },
        "accent-soft": "#E5D0CC",
        line: { DEFAULT: "#DFD3D6", strong: "#BFACB5" },
        success: { DEFAULT: "#0D6036", soft: "#DEEDE4" },
        warning: { DEFAULT: "#96610F", soft: "#F6E8D4" },
        error: { DEFAULT: "#A93B33", soft: "#F6DEDC" },
        info: { DEFAULT: "#4E6273", soft: "#E2E9EE" },
      },
      fontFamily: {
        display: ["var(--font-nunito)", "system-ui", "sans-serif"],
        body: ["var(--font-nunito-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
      },
      boxShadow: {
        rest: "0 1px 3px rgba(29,43,29,0.08)",
        raised: "0 4px 12px rgba(29,43,29,0.12)",
        overlay: "0 12px 32px rgba(29,43,29,0.16)",
      },
    },
  },
  plugins: [],
};
export default config;
