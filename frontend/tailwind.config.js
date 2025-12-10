/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#1e40af', // Example premium blue
                secondary: '#f59e0b', // Example accent
                dark: '#111827',
            }
        },
    },
    plugins: [],
}
