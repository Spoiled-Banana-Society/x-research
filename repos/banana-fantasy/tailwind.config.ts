import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        'bg-primary': '#0a0a0f',
        'bg-secondary': '#12121a',
        'bg-tertiary': '#1a1a24',
        'bg-elevated': '#22222e',

        // Accent colors
        'banana': '#fbbf24',
        'banana-dark': '#f59e0b',
        'banana-light': '#fcd34d',

        // Text colors
        'text-primary': '#ffffff',
        'text-secondary': '#a1a1aa',
        'text-muted': '#71717a',

        // Status colors
        'success': '#22c55e',
        'warning': '#f59e0b',
        'error': '#ef4444',

        // Draft type colors
        'jackpot': '#ef4444',
        'hof': '#D4AF37',
        'pro': '#a855f7',

        // Draft type glow colors
        'jackpot-glow': 'rgba(239, 68, 68, 0.3)',
        'hof-glow': 'rgba(212, 175, 55, 0.3)',
        'pro-glow': 'rgba(168, 85, 247, 0.3)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        primary: ['Montserrat', 'Arial', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'spin-wheel': 'spin 4s cubic-bezier(0.17, 0.67, 0.12, 0.99) forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(251, 191, 36, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(251, 191, 36, 0.6)' },
        },
        'slide-up': {
          '0%': { transform: 'translate(-50%, -50%) translateY(10px)', opacity: '0' },
          '100%': { transform: 'translate(-50%, -50%) translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
