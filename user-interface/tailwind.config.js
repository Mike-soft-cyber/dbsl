// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Link Tailwind color names to your CSS variables
        cream: "var(--color-cream)",
        green: "var(--color-green)",
        yellow: {
          DEFAULT: "var(--color-yellow)",
          dark: "var(--color-yellow-dark)"
        },
        grayText: "var(--color-gray-text)",
        border: "var(--color-border)",
        // Keep teal shades from your root if you want them too
        teal: {
          50: "var(--color-teal-50)",
          100: "var(--color-teal-100)",
          200: "var(--color-teal-200)",
          300: "var(--color-teal-300)",
          400: "var(--color-teal-400)",
          500: "var(--color-teal-500)",
          600: "var(--color-teal-600)",
          700: "var(--color-teal-700)",
          800: "var(--color-teal-800)",
          900: "var(--color-teal-900)",
          950: "var(--color-teal-950)",
        }
      }
    }
  },
  plugins: [],
};
