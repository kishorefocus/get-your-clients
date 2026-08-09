import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        surface: "hsl(var(--surface))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "hsl(var(--danger-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 3px)",
        sm: "calc(var(--radius) - 5px)",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgb(18 20 28 / 0.04), 0 1px 1px 0 rgb(18 20 28 / 0.03)",
        card: "0 1px 3px 0 rgb(18 20 28 / 0.06), 0 8px 24px -8px rgb(18 20 28 / 0.08)",
        popover: "0 4px 12px -2px rgb(18 20 28 / 0.12), 0 12px 32px -8px rgb(18 20 28 / 0.14)",
        "glow-primary": "0 0 0 1px hsl(228 100% 57% / 0.4), 0 4px 24px -4px hsl(228 100% 57% / 0.28)",
        "glow-success": "0 0 0 1px hsl(160 71% 33% / 0.4), 0 4px 20px -4px hsl(160 71% 33% / 0.24)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "pulse-ring": { "0%": { transform: "scale(0.8)", opacity: "0.8" }, "80%,100%": { transform: "scale(1.8)", opacity: "0" } },
        "shimmer": { "0%": { backgroundPosition: "200% 0" }, "100%": { backgroundPosition: "-200% 0" } },
        "bounce-in": { "0%": { transform: "scale(0.96)" }, "55%": { transform: "scale(1.02)" }, "100%": { transform: "scale(1)" } },
        "celebrate": { "0%": { transform: "scale(0) rotate(0deg)", opacity: "1" }, "80%": { opacity: "1" }, "100%": { transform: "scale(1.5) rotate(360deg)", opacity: "0" } },
        "typing-dot": { "0%,80%,100%": { transform: "scale(0.6)", opacity: "0.4" }, "40%": { transform: "scale(1)", opacity: "1" } },
        "glow-pulse": { "0%,100%": { boxShadow: "0 0 0 0 hsl(228 100% 57% / 0)" }, "50%": { boxShadow: "0 0 0 4px hsl(228 100% 57% / 0.2)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "fade-up": "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-ring": "pulse-ring 2.2s cubic-bezier(0.2,0.6,0.4,1) infinite",
        "pulse-ring-slow": "pulse-ring 2.8s cubic-bezier(0.2,0.6,0.4,1) 0.4s infinite",
        "shimmer": "shimmer 2s linear infinite",
        "bounce-in": "bounce-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "celebrate": "celebrate 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "typing-dot": "typing-dot 1.4s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
