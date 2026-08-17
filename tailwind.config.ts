import type { Config } from "tailwindcss";

// Tokens hold complete OKLCH colours, so they are referenced directly rather
// than wrapped in hsl() the way the shadcn default expects.
const config: Config = {
  darkMode: ["class"],
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",

        copper: {
          DEFAULT: "var(--copper)",
          bright: "var(--copper-bright)",
          wash: "var(--copper-wash)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          soft: "var(--ink-soft)",
          faint: "var(--ink-faint)",
        },
        paper: {
          DEFAULT: "var(--paper)",
          raised: "var(--paper-raised)",
          sunken: "var(--paper-sunken)",
        },
        rule: { DEFAULT: "var(--rule)", strong: "var(--rule-strong)" },
      },
      fontFamily: {
        // --font-cjk is empty outside :lang(zh), so the Latin pages resolve
        // exactly as before and only Chinese pages pick up the CJK face.
        sans: [
          "var(--font-sans)",
          "var(--font-cjk)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        display: ["var(--font-display)", "var(--font-cjk)", "ui-sans-serif", "sans-serif"],
        mono: ["var(--font-mono)", "var(--font-cjk)", "ui-monospace", "monospace"],
      },
      fontSize: {
        // Fluid display sizes — the hero should breathe on a wide screen
        // without needing a breakpoint for every step. Centred, the ceiling
        // has to come down: at 5.5rem the headline stopped reading as a
        // sentence and started reading as a wall.
        hero: ["clamp(2.5rem, 1.7rem + 3.4vw, 4rem)", { lineHeight: "0.98" }],
        section: ["clamp(1.75rem, 1.3rem + 1.8vw, 2.75rem)", { lineHeight: "1.05" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 3px)",
      },
      maxWidth: {
        shell: "78rem",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
