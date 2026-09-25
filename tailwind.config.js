// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e3a8a', // deep indigo
        primaryLight: '#3b82f6',
        accent: '#0f766e', // teal
        success: '#16a34a',
        warning: '#d97706',
        error: '#dc2626',
        info: '#2563eb',
        muted: '#6b7280',
        bg: '#f9fafb',
        surface: '#ffffff',
        border: '#e5e7eb',
      },
    },
  },
  plugins: [],
};
