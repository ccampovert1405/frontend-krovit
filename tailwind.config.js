/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary-color, #E31E24)',
          dark: 'var(--primary-color-dark, #C41920)',
          light: 'var(--primary-color-light, #FEF2F2)',
          border: 'var(--primary-color-border, #FECACA)',
        },
        surface: {
          ground: 'var(--surface-ground, #F9FAFB)',
          section: 'var(--surface-section, #ffffff)',
          card: 'var(--surface-card, #ffffff)',
          border: 'var(--surface-border, #F3F4F6)',
        },
        text: {
          main: 'var(--text-main, #1A1A1A)',
          secondary: 'var(--text-secondary, #6B7280)',
          muted: 'var(--text-muted, #9CA3AF)',
        }
      },
      fontFamily: {
        sans: ['var(--font-family, Inter)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
