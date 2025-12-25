# 🎯 PLANO DE TESTES E2E COMPLETOS - FRONTEND + BACKEND

**Data**: 25/12/2025 10:30  
**Estimativa**: 6-8 horas  
**Status**: 📋 PLANEJADO

---

## 🎯 OBJETIVO

Criar testes E2E completos que simulam um usuário real usando o sistema, validando a integração completa:
- Frontend (Next.js)
- Backend (Go API)
- Banco de Dados (PostgreSQL)

---

## 🛠️ FERRAMENTAS RECOMENDADAS

### Opção 1: Playwright (Recomendado) ⭐
**Por quê?**
- Suporta múltiplos navegadores (Chrome, Firefox, Safari)
- Mais rápido e estável
- Melhor para debugging
- Suporte nativo para TypeScript
- Screenshots e vídeos automáticos

**Instalação**:
```bash
cd apps/web
npm install -D @playwright/test
npx playwright install
```

### Opção 2: Cypress
**Por quê?**
- Interface visual excelente
- Fácil de usar
- Grande comunidade

**Instalação**:
```bash
cd apps/web
npm install -D cypress
npx cypress open
```

---

## 📋 CENÁRIOS DE TESTE E2E

### 1. Fluxo Completo de Usuário (30 min)
**Cenário**: Novo usuário usando o sistema pela primeira vez

**Passos**:
1. Abrir aplicação
2. Fazer login/cadastro
3. Criar primeira conta bancária
4. Adicionar saldo inicial
5. Criar categorias
6. Lançar transações
7. Visualizar dashboard
8. Validar saldos

**Validações**:
- ✅ Login funciona
- ✅ Conta criada aparece na lista
- ✅ Saldo está correto
- ✅ Dashboard atualiza
- ✅ Gráficos renderizam

---

### 2. Sistema de Faturas Completo (1h)
**Cenário**: Usuário gerenciando cartão de crédito

**Passos**:
1. Criar cartão de crédito
2. Fazer lançamentos
3. Visualizar fatura
4. Editar lançamento
5. Excluir lançamento
6. Pagar fatura
7. Validar crédito gerado
8. Estornar pagamento

**Validações**:
- ✅ Cartão aparece na lista
- ✅ Lançamentos aparecem na fatura
- ✅ Limite disponível atualiza
- ✅ Edição funciona
- ✅ Exclusão funciona
- ✅ Pagamento registra
- ✅ Crédito é gerado
- ✅ Estorno funciona

---

### 3. Contas a Pagar (30 min)
**Cenário**: Gerenciamento de contas a pagar

**Passos**:
1. Criar conta a pagar
2. Visualizar lista
3. Editar conta
4. Pagar conta
5. Validar saldo
6. Estornar pagamento

**Validações**:
- ✅ Conta criada aparece
- ✅ Edição funciona
- ✅ Pagamento debita saldo
- ✅ Status atualiza
- ✅ Estorno restaura saldo

---

### 4. Categorias e Subcategorias (20 min)
**Cenário**: Organização financeira

**Passos**:
1. Criar categoria
2. Criar subcategoria
3. Vincular transação
4. Tentar excluir categoria com subcategoria
5. Excluir subcategoria
6. Excluir categoria

**Validações**:
- ✅ Categoria criada
- ✅ Subcategoria vinculada
- ✅ Bloqueio de exclusão funciona
- ✅ Exclusão em ordem correta funciona

---

### 5. Dashboard e Relatórios (30 min)
**Cenário**: Visualização de dados

**Passos**:
1. Acessar dashboard
2. Validar cards de resumo
3. Verificar gráficos
4. Filtrar por período
5. Validar dados

**Validações**:
- ✅ Cards mostram valores corretos
- ✅ Gráficos renderizam
- ✅ Filtros funcionam
- ✅ Dados são consistentes

---

## 💻 EXEMPLO DE TESTE PLAYWRIGHT

### Arquivo: `tests/e2e/invoice-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Sistema de Faturas - Fluxo Completo', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login
    await page.goto('http://localhost:3000');
    await page.fill('[name="email"]', 'test@fincore.com');
    await page.fill('[name="password"]', 'senha123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Criar cartão e fazer lançamentos', async ({ page }) => {
    // Navegar para cartões
    await page.click('text=Cartões');
    await page.waitForURL('**/cards');

    // Criar novo cartão
    await page.click('button:has-text("Novo Cartão")');
    await page.fill('[name="name"]', 'Visa Platinum');
    await page.fill('[name="limit"]', '10000');
    await page.fill('[name="closing_day"]', '10');
    await page.fill('[name="due_day"]', '20');
    await page.click('button:has-text("Salvar")');

    // Validar que cartão foi criado
    await expect(page.locator('text=Visa Platinum')).toBeVisible();
    await expect(page.locator('text=R$ 10.000,00')).toBeVisible();

    // Fazer lançamento
    await page.click('text=Visa Platinum');
    await page.click('button:has-text("Novo Lançamento")');
    await page.fill('[name="description"]', 'Compra Teste');
    await page.fill('[name="amount"]', '500');
    await page.click('button:has-text("Salvar")');

    // Validar lançamento
    await expect(page.locator('text=Compra Teste')).toBeVisible();
    await expect(page.locator('text=R$ 500,00')).toBeVisible();

    // Validar limite disponível
    await expect(page.locator('text=R$ 9.500,00')).toBeVisible();
  });

  test('Editar lançamento', async ({ page }) => {
    // Navegar para fatura
    await page.click('text=Cartões');
    await page.click('text=Visa Platinum');

    // Editar lançamento
    await page.click('[data-testid="edit-transaction"]');
    await page.fill('[name="amount"]', '750');
    await page.click('button:has-text("Salvar")');

    // Validar edição
    await expect(page.locator('text=R$ 750,00')).toBeVisible();
    await expect(page.locator('text=R$ 9.250,00')).toBeVisible();
  });

  test('Pagar fatura e gerar crédito', async ({ page }) => {
    // Navegar para fatura
    await page.click('text=Cartões');
    await page.click('text=Visa Platinum');

    // Pagar fatura (valor maior que o total)
    await page.click('button:has-text("Pagar Fatura")');
    await page.fill('[name="amount"]', '1000');
    await page.click('button:has-text("Confirmar")');

    // Validar pagamento
    await expect(page.locator('text=Fatura Quitada')).toBeVisible();
    
    // Validar crédito gerado
    await expect(page.locator('text=Crédito: R$ 250,00')).toBeVisible();
  });

  test('Estornar pagamento', async ({ page }) => {
    // Navegar para fatura
    await page.click('text=Cartões');
    await page.click('text=Visa Platinum');

    // Estornar pagamento
    await page.click('button:has-text("Estornar")');
    await page.click('button:has-text("Confirmar Estorno")');

    // Validar estorno
    await expect(page.locator('text=Fatura Aberta')).toBeVisible();
    await expect(page.locator('text=R$ 750,00')).toBeVisible();
  });
});
```

---

## 📊 CONFIGURAÇÃO DO PLAYWRIGHT

### Arquivo: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 🚀 EXECUÇÃO DOS TESTES

### Comandos:

```bash
# Executar todos os testes
npx playwright test

# Executar em modo UI (visual)
npx playwright test --ui

# Executar teste específico
npx playwright test invoice-flow

# Executar com debug
npx playwright test --debug

# Gerar relatório
npx playwright show-report
```

---

## 📈 ESTIMATIVA DE TEMPO

### Setup Inicial (1-2h):
- Instalar Playwright
- Configurar ambiente
- Criar estrutura de testes
- Setup de dados de teste

### Implementação de Testes (4-5h):
- Fluxo de usuário (1h)
- Sistema de faturas (1.5h)
- Contas a pagar (1h)
- Categorias (0.5h)
- Dashboard (1h)

### Debugging e Ajustes (1-2h):
- Corrigir testes falhando
- Ajustar seletores
- Melhorar estabilidade
- Documentar

**Total**: 6-8 horas

---

## 🎯 BENEFÍCIOS

### Qualidade:
- ✅ Validação completa do sistema
- ✅ Detecção precoce de bugs
- ✅ Confiança para deploy
- ✅ Documentação viva

### Desenvolvimento:
- ✅ Testes automatizados
- ✅ CI/CD integration
- ✅ Regression testing
- ✅ Faster feedback

---

## 💚 PRÓXIMOS PASSOS

### Opção A: Implementar Agora (6-8h)
1. Instalar Playwright
2. Configurar ambiente
3. Criar testes
4. Executar e validar

### Opção B: Implementar Depois
1. Documentação está pronta
2. Exemplos criados
3. Pode ser feito quando necessário

---

## 📝 NOTAS IMPORTANTES

### Pré-requisitos:
- Frontend rodando (localhost:3000)
- Backend rodando (localhost:8080)
- Banco de dados configurado
- Dados de teste preparados

### Boas Práticas:
- Usar data-testid para seletores
- Criar fixtures para dados de teste
- Isolar testes (cada teste independente)
- Limpar dados após testes
- Usar Page Object Model

---

**Documento criado**: 25/12/2025 10:30  
**Status**: Pronto para implementação  
**Estimativa**: 6-8 horas
