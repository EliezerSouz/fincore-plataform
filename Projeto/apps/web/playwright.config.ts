import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes E2E do FinCore
 * 
 * Este arquivo configura:
 * - Diretório de testes
 * - Configurações de execução
 * - Browsers a serem testados
 * - Servidor de desenvolvimento
 */

export default defineConfig({
    // Diretório onde os testes estão localizados
    testDir: './tests/e2e',

    // Executar testes em paralelo
    fullyParallel: true,

    // Falhar se houver .only em CI
    forbidOnly: !!process.env.CI,

    // Número de tentativas em caso de falha
    retries: process.env.CI ? 2 : 0,

    // Número de workers (processos paralelos)
    workers: process.env.CI ? 1 : undefined,

    // Tipo de relatório
    reporter: 'html',

    // Timeout padrão para cada teste
    timeout: 30 * 1000, // 30 segundos

    // Configurações de uso
    use: {
        // URL base da aplicação
        baseURL: 'http://localhost:3000',

        // Trace on first retry
        trace: 'on-first-retry',

        // Screenshot apenas em falhas
        screenshot: 'only-on-failure',

        // Vídeo apenas em falhas
        video: 'retain-on-failure',

        // Timeout para ações
        actionTimeout: 10 * 1000, // 10 segundos
    },

    // Projetos (browsers) para testar
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },

        // Descomentar para testar em outros browsers
        // {
        //   name: 'firefox',
        //   use: { ...devices['Desktop Firefox'] },
        // },

        // {
        //   name: 'webkit',
        //   use: { ...devices['Desktop Safari'] },
        // },
    ],

    // Servidor web para iniciar antes dos testes
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000, // 2 minutos para iniciar
    },
});
