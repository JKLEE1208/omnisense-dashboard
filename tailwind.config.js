/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        hud: {
          black: '#0a0a0b',
          dark: '#121214',
          panel: '#18181b',
          border: '#27272a',
          primary: '#06b6d4',
          accent: '#f59e0b',
          danger: '#ef4444',
          success: '#22c55e',
        }
      },
      animation: {
        'radar-spin': 'spin 4s linear infinite',
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}