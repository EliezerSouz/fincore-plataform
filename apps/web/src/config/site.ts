/**
 * Site Configuration
 * Configurações centralizadas do site
 */

export const siteConfig = {
    name: 'Financeiro Platform',
    description: 'Plataforma completa de gestão financeira pessoal e empresarial',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',

    links: {
        github: 'https://github.com/yourusername/financeiro',
        docs: '/docs',
    },

    features: {
        ai: {
            enabled: !!process.env.GROQ_API_KEY,
            provider: 'groq',
        },
        analytics: {
            enabled: false,
        },
    },
} as const

export type SiteConfig = typeof siteConfig
