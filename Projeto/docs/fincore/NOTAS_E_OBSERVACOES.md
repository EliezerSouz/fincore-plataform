# 📝 Notas e Observações - FinCore

Use este arquivo para registrar bugs, melhorias e observações, organizado por fluxo de telas.

**Data de Início:** 21/12/2025

---

## 1. Cadastro e Login (Auth)
**Telas:** `/signup`, `/login`, `/esqueci-senha`

*   [x] **[Cadastro]** ✅ **RESOLVIDO** - Erro: Database error saving new user
    *   *Causa Raiz:* Falta de constraint UNIQUE na tabela `payment_methods`, causando falha no `ON CONFLICT DO NOTHING` durante criação de métodos de pagamento padrão.
    *   *Correção (23/12/2025):* Criada migration `20251223000000_fix_payment_methods_constraints.sql` que:
        - Adiciona constraint `UNIQUE (user_id, slug)` na tabela `payment_methods`
        - Limpa duplicatas existentes
        - Atualiza função `create_default_payment_methods()` para usar corretamente o ON CONFLICT
        - Reorganiza policies RLS para acesso correto
    *   *Documentação:* Ver `docs/fincore/FIX_DATABASE_ERROR_SAVING_USER.md`
*   [!] **[Infraestrutura]** **Supabase SMTP Incident (21/12/2025):** E-mails de autenticação (confirmação, recuperação de senha) não estão sendo enviados via SMTP compartilhado do Supabase devido a uma interrupção no serviço deles.
    *   *Impacto:* Usuários não recebem e-mail de confirmação de cadastro.
    *   *Solução Temporária (Dev):* Desativar "Enable Email Confirmations" no painel do Supabase (Authentication -> Providers -> Email).
    *   *Solução Definitiva:* Configurar Custom SMTP (Resend, SendGrid, etc.).
*   [ ] **[Login]**

---

## 2. Onboarding e Boas-Vindas
**Telas:** Primeiro acesso ao `/dashboard`

*   [ ] **[Modal/Banner]**
*   [ ] **[Estado Vazio]**

---

## 3. Dashboard (Visão Geral)
**Tela:** `/dashboard`

*   [ ] **[Resumo/Cards]**
*   [ ] **[Gráficos]**
*   [ ] **[Sidebar/Menu]**

---

## 4. Gestão de Contas (Carteira)
**Tela:** `/caixa/accounts`

*   [ ] **[Listagem]**
*   [ ] **[Criação de Conta]**
*   [ ] **[Edição/Exclusão]**

---

## 5. Transações (Receitas/Despesa)
**Tela:** `/caixa/transactions`

*   [ ] **[Listagem]**
*   [ ] **[Nova Transação]**
*   [ ] **[Filtros]**

---

## 6. Cartões de Crédito
**Tela:** `/compromissos/cards`

*   [ ] **[Listagem de Cartões]**
*   [ ] **[Fatura]**
*   [ ] **[Compra no Cartão]**

---

## 7. Contas a Pagar (Compromissos)
**Tela:** `/compromissos/payables`

*   [ ] **[Listagem]**
*   [ ] **[Cadastro]**

---

## 8. Patrimônio e Investimentos
**Tela:** `/patrimonio/investments`

*   [ ] **[Geral]**

---

## 9. Configurações e Perfil
**Telas:** `/settings`, `/profile`

*   [ ] **[Perfil]**
*   [ ] **[Categorias]**

---

## 10. Outros / Geral

*   [ ] **[Performance]**
*   [ ] **[Responsividade (Mobile)]**
*   [ ] **[Erros Gerais]**
