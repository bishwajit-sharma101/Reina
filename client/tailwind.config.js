/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
   extend: {
      colors: {
        brand: {
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6', // Violet
          600: '#7c3aed',
        }
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      spacing: {
        3: "12px",
        4: "16px",
        5: "24px",
      },
      borderRadius: {
        xl: "18px",
      },
      backdropBlur: {
        xs: "8px",
        sm: "14px",
      },
    },
  },
  plugins: [require('tailwindcss-animate'),],
};
