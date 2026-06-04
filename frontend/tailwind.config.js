/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Paleta estilo terminal financiera (Bloomberg-like, dark-first)
        ink: {
          900: "#0a0e14",
          800: "#0f141c",
          700: "#161d27",
          600: "#1f2937",
          500: "#2b3543",
        },
        accent: {
          amber: "#f5a623",
          cyan: "#22d3ee",
          green: "#22c55e",
          red: "#ef4444",
          violet: "#a78bfa",
        },
      },
      fontFamily: {
        mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
