/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './app/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
        './hooks/**/*.{js,ts,jsx,tsx}',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#1E3A8A',
                accent: '#7C3AED',
                cyan: '#06B6D4',
                teal: '#14B8A6',
                success: '#10B981',
                danger: '#EF4444',
                // Cores Semânticas Premium
                insight: '#8B5CF6', // Violeta para inteligência/dicas
                risk: '#F59E0B',    // Âmbar para atenção/risco
                wealth: '#059669',  // Emerald profundo para patrimônio
                surface: '#0F172A', // Slate 900 para fundos deep
                'surface-light': '#1E293B', // Slate 800 para cards dark
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['Manrope', 'ui-monospace', 'monospace'],
            },
            keyframes: {
                'fade-in-up': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
            animation: {
                'fade-in-up': 'fade-in-up 0.4s ease-out forwards',
            },
        },
    },
    plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
