import { test, expect } from '@playwright/test';

/**
 * Teste E2E - Página Inicial
 * 
 * Valida que a aplicação carrega corretamente
 */

test.describe('Página Inicial', () => {
    test('deve carregar a página inicial', async ({ page }) => {
        // Navegar para a página inicial
        await page.goto('/');

        // Aguardar a página carregar
        await page.waitForLoadState('networkidle');

        // Validar que a página carregou
        await expect(page).toHaveTitle(/FinCore/i);

        // Tirar screenshot
        await page.screenshot({ path: 'test-results/homepage.png' });
    });

    test('deve ter elementos principais', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Validar que existem elementos na página
        const body = await page.locator('body');
        await expect(body).toBeVisible();
    });
});
