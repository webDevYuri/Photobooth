/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
      "./pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "*.{js,ts,jsx,tsx,mdx}",
      "app/**/*.{ts,tsx}",
      "components/**/*.{ts,tsx}",
    ],
    theme: {
      extend: {
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
          // primary: {
          //   DEFAULT: "#6366f1",
          //   foreground: "#ffffff",
          // },
          // secondary: {
          //   DEFAULT: "#8b5cf6",
          //   foreground: "#ffffff",
          // },
          // accent: {
          //   DEFAULT: "#f3f4f6",
          //   foreground: "#1f2937",
          // },
          // background: {
          //   DEFAULT: "#ffffff",
          //   foreground: "#1f2937",
          // },
          // muted: {
          //   DEFAULT: "#f3f4f6",
          //   foreground: "#6b7280",
          // },
          // card: {
          //   DEFAULT: "#ffffff",
          //   foreground: "#1f2937",
          // },
          // border: "#e5e7eb",
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
        fontFamily: {
          sans: ["Outfit", "sans-serif"],
          display: ["Montserrat", "sans-serif"],
        },
        boxShadow: {
          subtle: "0 1px 3px rgba(0, 0, 0, 0.05)",
          card: "0 1px 3px rgba(0, 0, 0, 0.08)",
          hover: "0 4px 6px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.08)",
        },
        backgroundImage: {
          "gradient-primary": "linear-gradient(135deg, #6366f1, #8b5cf6)",
        },
      },
    },
    plugins: [require("tailwindcss-animate")],
  }
  
  