/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                outfit: ['var(--font-outfit)', 'sans-serif'],
                cormorant: ['var(--font-cormorant)', 'serif'],
                montserrat: ['var(--font-montserrat)', 'sans-serif'],
            },
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
            },
            keyframes: {
            },
            animation: {
            }
        },
    },
    plugins: [],
};
