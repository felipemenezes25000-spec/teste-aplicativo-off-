import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'DM Sans', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // RenoveJá+ Premium Healthcare Colors
        "health-blue": {
          DEFAULT: "hsl(var(--health-blue))",
          light: "hsl(var(--health-blue-light))",
          dark: "hsl(var(--health-blue-dark))",
        },
        "health-green": {
          DEFAULT: "hsl(var(--health-green))",
          light: "hsl(var(--health-green-light))",
        },
        "health-orange": {
          DEFAULT: "hsl(var(--health-orange))",
          light: "hsl(var(--health-orange-light))",
        },
        "health-purple": {
          DEFAULT: "hsl(var(--health-purple))",
          light: "hsl(var(--health-purple-light))",
        },
        "health-red": "hsl(var(--health-red))",
        "health-yellow": "hsl(var(--health-yellow))",
        "health-teal": "hsl(var(--health-teal))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 16px)",
      },
      boxShadow: {
        'health': '0 4px 24px -4px hsl(var(--health-blue) / 0.18)',
        'health-lg': '0 12px 40px -8px hsl(var(--health-blue) / 0.25)',
        'card': '0 0 0 1px hsl(214 32% 91% / 0.6), 0 2px 8px -2px hsl(210 40% 50% / 0.06)',
        'card-hover': '0 0 0 1px hsl(var(--primary) / 0.2), 0 8px 24px -4px hsl(var(--primary) / 0.15)',
        'glow': '0 0 0 1px hsl(var(--primary) / 0.1), 0 4px 16px -4px hsl(var(--primary) / 0.2)',
        'soft': '0 2px 8px -2px hsl(210 40% 50% / 0.08), 0 4px 16px -4px hsl(210 40% 50% / 0.06)',
        'premium': '0 0 0 1px hsl(214 32% 91% / 0.5), 0 4px 16px -4px hsl(210 40% 50% / 0.08), 0 12px 32px -8px hsl(210 40% 50% / 0.06)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(24px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "bounce-subtle": {
          "0%": { transform: "scale(0.95)" },
          "50%": { transform: "scale(1.02)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "slide-down": "slide-down 0.4s ease-out",
        "slide-in-right": "slide-in-right 0.4s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "spin-slow": "spin-slow 3s linear infinite",
        "bounce-subtle": "bounce-subtle 0.6s ease-out",
      },
      // Accessibility utilities
      extend: {
        // ... existing extend
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
