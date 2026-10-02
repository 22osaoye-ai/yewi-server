/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./templates/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0284C7',
          light: '#E0F2FE',
          dark: '#38BDF8',
        },
        brand: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
          950: '#082F49',
        },
      },
      fontFamily: {
        'sans-light': ['PlusJakartaSans-Light', 'sans-serif'],
        sans: ['PlusJakartaSans-Regular', 'sans-serif'],
        'sans-medium': ['PlusJakartaSans-Medium', 'sans-serif'],
        'sans-semibold': ['PlusJakartaSans-SemiBold', 'sans-serif'],
        'sans-bold': ['PlusJakartaSans-Bold', 'sans-serif'],
        'sans-extrabold': ['PlusJakartaSans-ExtraBold', 'sans-serif'],
        'sans-black': ['PlusJakartaSans-ExtraBold', 'sans-serif'],
        // Retrocompatibilidad
        'satoshi-light': ['PlusJakartaSans-Light', 'sans-serif'],
        'satoshi': ['PlusJakartaSans-Regular', 'sans-serif'],
        'satoshi-medium': ['PlusJakartaSans-Medium', 'sans-serif'],
        'satoshi-bold': ['PlusJakartaSans-Bold', 'sans-serif'],
        'satoshi-black': ['PlusJakartaSans-ExtraBold', 'sans-serif'],
      },
    },
  },
  plugins: [],
}