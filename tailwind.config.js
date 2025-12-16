/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2F6BFF',
        'primary-light': '#E6EFFF',
        'primary-dark': '#0F2A5F',
        'text-main': '#0B1220',
        'secondary-gray': '#94A3B8',
        'background-main': '#F7FAFF'
      },
      borderRadius: {
        pill: '24px'
      },
      boxShadow: {
        card: '0 10px 30px rgba(15, 42, 95, 0.06)'
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
