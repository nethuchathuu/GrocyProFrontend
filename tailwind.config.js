
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {

        /* ===== PRIMARY SYSTEM COLORS ===== */
        primary: {
          DEFAULT: "#0F766E",
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#0F766E",
          700: "#065F46",
          800: "#064E3B",
          900: "#022C22",
        },

        secondary: {
          DEFAULT: "#065F46",
          light: "#0D9488",
          dark: "#022C22",
        },

        accent: {
          DEFAULT: "#F4B400",
          light: "#FACC15",
          dark: "#D97706",
        },

        /* ===== BACKGROUND & SURFACES ===== */
        background: {
          DEFAULT: "#0B3B36",
          light: "#F8FAFC",
        },

        surface: {
          DEFAULT: "#134E4A",
          light: "#1F766F",
        },

        /* ===== STATUS COLORS ===== */

        success: {
          DEFAULT: "#10B981",
          50: "#ECFDF5",
          100: "#D1FAE5",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        },

        warning: {
          DEFAULT: "#F59E0B",
          50: "#FFFBEB",
          100: "#FEF3C7",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
        },

        danger: {
          DEFAULT: "#EF4444",
          50: "#FEF2F2",
          100: "#FEE2E2",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
        },

        info: {
          DEFAULT: "#38BDF8",
          50: "#F0F9FF",
          100: "#E0F2FE",
          500: "#38BDF8",
          600: "#0284C7",
        }

      },
    },
  },
  plugins: [],
}