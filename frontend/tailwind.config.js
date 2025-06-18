/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {},
  },
  plugins: [],
  content: ["./src/**/*.{js,jsx,ts,tsx,html}", "./public/index.html"],
  safelist: [
    // Color classes for quiz results table
    'bg-green-100', 'bg-green-200', 'text-green-800', 'text-green-900',
    'bg-red-100', 'bg-red-200', 'text-red-800', 'text-red-900',
    'bg-yellow-100', 'bg-yellow-200', 'text-yellow-800', 'text-yellow-900',
    'bg-orange-100', 'bg-orange-200', 'text-orange-800', 'text-orange-900',
    'bg-gray-100', 'bg-gray-200', 'text-gray-700', 'text-gray-800',
    'border-green-500', 'border-red-500', 'border-yellow-500', 'border-orange-500'
  ]
};
