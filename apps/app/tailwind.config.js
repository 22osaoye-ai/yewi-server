/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        'satoshi-light': ['Satoshi-Light', 'sans-serif'],
        'satoshi': ['Satoshi-Regular', 'sans-serif'],
        'satoshi-medium': ['Satoshi-Medium', 'sans-serif'],
        'satoshi-bold': ['Satoshi-Bold', 'sans-serif'],
        'satoshi-black': ['Satoshi-Black', 'sans-serif'],
      },
    },
  },
  plugins: [],
}