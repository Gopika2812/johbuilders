/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        merun: {
          50: '#f0f9f4',
          100: '#dcf1e5',
          200: '#bce2cb',
          300: '#8ecda7',
          400: '#5cb37e',
          500: '#3a985e',
          600: '#2b7b4a',
          700: '#0e623a', // Deep Forest Green Primary
          800: '#0b4d2d',
          900: '#093f25',
          950: '#042214',
        },
        glacier: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#a7d8ff', // Glacier Blue Secondary
          300: '#7bbbff',
          400: '#4897ff',
          500: '#2272fc',
          600: '#0c52eb',
          700: '#083ec0',
          800: '#0e359a',
          900: '#12327a',
          950: '#0b1e4b',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.8125rem', { lineHeight: '1.125rem' }], // 13px (was 12)
        'sm': ['0.9375rem', { lineHeight: '1.375rem' }], // 15px (was 14)
        'base': ['1.0625rem', { lineHeight: '1.625rem' }], // 17px (was 16)
        'lg': ['1.1875rem', { lineHeight: '1.875rem' }], // 19px (was 18)
        'xl': ['1.3125rem', { lineHeight: '1.875rem' }], // 21px (was 20)
        '2xl': ['1.625rem', { lineHeight: '2.125rem' }], // 26px (was 24)
        '3xl': ['2rem', { lineHeight: '2.375rem' }], // 32px (was 30)
        '4xl': ['2.375rem', { lineHeight: '2.625rem' }], // 38px (was 36)
        '5xl': ['3.125rem', { lineHeight: '1' }], // 50px (was 48)
      }
    },
  },
  plugins: [],
}
