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
                poppins: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
                inter: ['var(--font-inter)', 'Inter', 'sans-serif'],
                outfit: ['var(--font-outfit)', 'sans-serif'],
                cormorant: ['var(--font-cormorant)', 'serif'],
                montserrat: ['var(--font-montserrat)', 'sans-serif'],
            },
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                bgMain: "#0d0d0f",
                panelCard: "#17171a",
                goldLight: "#e8c883",
                goldMain: "#c5a369",
                goldDark: "#8a6d38",
                textCream: "#f3ecd8",
                textMuted: "#a89f8a",
                btnConfirm: "#3fa46a",
                btnCancel: "#3a3a3f",
            },
            borderRadius: {
                card: '8px',
                input: '6px',
            },
            keyframes: {
            },
            animation: {
            }
        },
    },
    plugins: [],
};
