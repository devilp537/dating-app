/** @type {import('tailwindcss').Config} */
module.exports = {
  // مسیرها را طوری تنظیم می‌کنیم که چه پوشه app داخل src باشد چه بیرون، کار کند
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")], // این خط بسیار مهم است
  theme: {
    extend: {},
  },
  plugins: [],
}