/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        cinema: {
          black: '#0a0a0f',
          deep: '#10101a',
          card: '#16162a',
          border: '#2a2a4a',
          accent: '#e63946',
          gold: '#ffd60a',
          silver: '#c8c8d0',
          dim: '#6b6b8a',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.3s ease forwards',
        'pulse-red': 'pulseRed 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseRed: { '0%,100%': { boxShadow: '0 0 0 0 rgba(230,57,70,0)' }, '50%': { boxShadow: '0 0 0 8px rgba(230,57,70,0.2)' } },
      }
    },
  },
  plugins: [],
}