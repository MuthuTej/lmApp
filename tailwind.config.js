/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#ad46ff',
        secondary: '#9810fa',
        accent: '#f5f5f5',
        error: '#ff4d4d',
        success: '#00c951',
        warning: '#ffc107',
      },
      fontFamily: {
        sans: ['Outfit_400Regular'],
        serif: ['Merriweather', 'serif'],
        outfit: ['Outfit_400Regular'],
        'outfit-medium': ['Outfit_500Medium'],
        'outfit-bold': ['Outfit_700Bold'],
        'outfit-extrabold': ['Outfit_800ExtraBold'],
        'outfit-black': ['Outfit_900Black'],
      },
    },
  },
  plugins: [],
}