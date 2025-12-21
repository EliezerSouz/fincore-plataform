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
                'heartbeat-slow': {
                    '0%': { transform: 'scale(1)' },
                    '14%': { transform: 'scale(1.3)' },
                    '28%': { transform: 'scale(1)' },
                    '42%': { transform: 'scale(1.3)' },
                    '56%': { transform: 'scale(1)' },
                    '100%': { transform: 'scale(1)' },
                },
                'heartbeat-fast': {
                    '0%': { transform: 'scale(1)' },
                    '10%': { transform: 'scale(1.3)' },
                    '20%': { transform: 'scale(1)' },
                    '30%': { transform: 'scale(1.3)' },
                    '40%': { transform: 'scale(1)' },
                    '100%': { transform: 'scale(1)' },
                },
                'heartbeat-irregular': {
                    '0%': { transform: 'scale(1)' },
                    '5%': { transform: 'scale(1.3)' },
                    '10%': { transform: 'scale(1)' },
                    '20%': { transform: 'scale(1.2)' },
                    '30%': { transform: 'scale(1)' },
                    '60%': { transform: 'scale(1.3)' },
                    '70%': { transform: 'scale(1)' },
                    '100%': { transform: 'scale(1)' },
                },
                'ecg-move': {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                }
            },
            animation: {
                'fade-in-up': 'fade-in-up 0.4s ease-out forwards',
                'heartbeat-slow': 'heartbeat-slow 2s infinite ease-in-out',
                'heartbeat-fast': 'heartbeat-fast 0.8s infinite ease-in-out',
                'heartbeat-irregular': 'heartbeat-irregular 2s infinite ease-in-out',
                'ecg-move': 'ecg-move 4s linear infinite',
            },
        },
    },
    plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
