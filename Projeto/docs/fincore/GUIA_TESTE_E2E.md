# 🧪 Guia de Teste E2E Inicial - FinCore

Este documento descreve o roteiro de testes manuais para validar o fluxo crítico da aplicação, desde o cadastro de um novo usuário até a operação básica financeira.

**Data de Criação:** 21/12/2025
**Foco:** Validação do fluxo de onboarding e operações principais (Caixa).

---

## 🚀 Pré-requisitos

1.  **Ambiente Web rodando:**
    *   Certifique-se de que o projeto `apps/web` está em execução (`npm run dev` ou via Turbo).
    *   URL padrão: `http://localhost:3000`.
2.  **Banco de Dados:**
    *   Supabase acessível e com migrações aplicadas.
3.  **Backend (Go):**
    *   Se houver dependência do microsserviço Go, certifique-se de que ele está rodando (geralmente porta 8080 ou configurado no `.env`).

---

## 1️⃣ Cenário: Cadastro de Novo Usuário (Signup)

**Objetivo:** Validar a criação de conta, persistência de dados do usuário e redirecionamento correto.

### Passos:
1.  Acesse `http://localhost:3000/signup`.
2.  Preencha o formulário:
    *   **Nome Completo:** `Usuário Teste E2E`
    *   **Celular:** `(11) 99999-9999` (Verifique se a máscara aplica corretamente)
    *   **Código Promocional:** (Deixe em branco ou use `TESTE` se houver lógica específica)
    *   **Email:** `teste.e2e.01@exemplo.com` (Use um email único a cada teste ou limpe o banco)
    *   **Senha:** `SenhaForte123!`
3.  Clique em **"Criar Conta Grátis"**.

### Verificações Esperadas:
*   [ ] O botão deve mostrar estado de carregamento.
*   [ ] Não deve haver erros de validação se os dados estiverem corretos.
*   [ ] **Redirecionamento:** O usuário deve ser levado automaticamente para `/dashboard`.
*   [ ] **URL:** A URL deve conter `?welcome=true` (ex: `/dashboard?welcome=true`).
*   [ ] **Banco de Dados (Opcional):** Verificar na tabela `auth.users` e `public.users` se o registro foi criado.

---

## 2️⃣ Cenário: Dashboard Inicial (Onboarding)

**Objetivo:** Verificar a apresentação inicial para um usuário sem dados.

### Passos:
1.  Após o cadastro, observe a tela de Dashboard (`/dashboard`).

### Verificações Esperadas:
*   [ ] **Mensagem de Boas-vindas:** Se houver um modal ou banner de onboarding.
*   [ ] **Estado Vazio:** Os gráficos e resumos devem estar zerados ou mostrando "Sem dados".
*   [ ] **Sidebar:** O menu lateral deve estar visível com as opções (Dashboard, Caixa, Compromissos, etc.).
*   [ ] **Topo:** O nome do usuário (`Usuário Teste E2E`) deve aparecer no canto superior direito ou no menu de perfil.

---

## 3️⃣ Cenário: Criação de Conta Bancária (Carteira)

**Objetivo:** Criar a primeira conta para permitir transações.

### Passos:
1.  No menu lateral, vá para **Caixa > Contas** (`/caixa/accounts`).
2.  Clique no botão **"Nova Conta"** (ou "+").
3.  Preencha o formulário:
    *   **Nome da Conta:** `Nubank Principal`
    *   **Instituição:** Selecione Nubank (ou Outro).
    *   **Tipo:** `Corrente` ou `Carteira`.
    *   **Saldo Inicial:** `R$ 1.000,00` (Importante para testar saldo).
    *   **Data Saldo Inicial:** Data de hoje.
4.  Salvar.

### Verificações Esperadas:
*   [ ] A conta deve aparecer na lista de contas.
*   [ ] O saldo exibido no card da conta deve ser `R$ 1.000,00`.
*   [ ] No **Dashboard** (`/dashboard`), o "Saldo Atual" (Pulso) deve refletir esses `R$ 1.000,00`.

---

## 4️⃣ Cenário: Registrar Transação (Receita/Despesa)

**Objetivo:** Movimentar o saldo e testar categorias.

### Teste A: Despesa Simples
1.  Vá para **Caixa > Transações** (`/caixa/transactions`).
2.  Clique em **"Nova Transação"**.
3.  Selecione **Tipo:** `Despesa`.
4.  Preencha:
    *   **Descrição:** `Teste Padaria`
    *   **Valor:** `R$ 50,00`
    *   **Conta:** `Nubank Principal` (criada anteriormente).
    *   **Categoria:** `Alimentação` (ou crie uma nova se necessário).
    *   **Data:** Hoje.
    *   **Pago:** Sim (marcado).
5.  Salvar.

### Teste B: Receita
1.  Crie uma nova transação.
2.  Selecione **Tipo:** `Receita`.
3.  Preencha:
    *   **Descrição:** `Freela Design`
    *   **Valor:** `R$ 500,00`
    *   **Conta:** `Nubank Principal`.
    *   **Categoria:** `Serviços` ou `Salário`.
    *   **Pago:** Sim.
4.  Salvar.

### Verificações Esperadas:
*   [ ] A lista de transações deve mostrar as duas operações.
*   [ ] **Saldo da Conta:** Deve ser `1000 - 50 + 500 = R$ 1.450,00`.
*   [ ] Verifique na tela de **Contas** se o saldo atualizou corretamente.

---

## 5️⃣ Cenário: Logout e Login

**Objetivo:** Garantir que a sessão persiste e o login funciona.

### Passos:
1.  Clique no avatar/perfil e selecione **"Sair"** (Logout).
2.  Você deve ser redirecionado para `/login`.
3.  Tente logar novamente com `teste.e2e.01@exemplo.com` e a senha definida.

### Verificações Esperadas:
*   [ ] Login com sucesso.
*   [ ] Redirecionamento para o Dashboard.
*   [ ] Os dados criados (Contas, Transações) devem estar lá.

---

## 🐞 Como Reportar Bugs

Se encontrar problemas, anote:
1.  O passo exato onde falhou.
2.  A mensagem de erro (se houver).
3.  Tire um print da tela ou copie o erro do Console do Navegador (F12).
