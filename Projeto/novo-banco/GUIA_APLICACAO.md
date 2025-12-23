# 🚀 GUIA DE APLICAÇÃO DAS MIGRATIONS

**Banco:** FinCore Production (Novo)  
**Data:** 23/12/2025  
**Migrations:** 10 arquivos  

---

## ✅ PRÉ-REQUISITOS

- [x] Novo banco Supabase criado
- [x] `.env` atualizado com novas credenciais
- [x] Acesso ao Supabase Dashboard

---

## 📋 MÉTODO RECOMENDADO: SQL EDITOR

### Passo 1: Acessar SQL Editor

1. Abra: https://supabase.com/dashboard
2. Selecione o projeto **FinCore Production**
3. No menu lateral, clique em **SQL Editor**

### Passo 2: Habilitar Extensões

Cole e execute este script primeiro:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

✅ **Resultado esperado:** "Success. No rows returned"

---

### Passo 3: Aplicar Migrations (EM ORDEM!)

**IMPORTANTE:** Aplique UMA POR VEZ, na ordem exata!

#### Migration 001: Core Schema

1. Abra: `novo-banco/migrations/001_core_schema.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor
4. Clique em **"Run"**
5. ✅ Verifique: "Success. No rows returned"

**O que foi criado:**
- 11 ENUMs
- Tabela `users`
- 5 funções essenciais
- 1 trigger
- 3 policies

---

#### Migration 002: Accounts and Transactions

1. Abra: `novo-banco/migrations/002_accounts_and_transactions.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor
4. Clique em **"Run"**
5. ✅ Verifique: "Success. No rows returned"

**O que foi criado:**
- Tabelas: `accounts`, `transactions`, `account_balance_adjustments`
- Função `handle_balance_update()` COM LOCKS
- Função `calculate_account_balance_with_adjustments()`
- 3 triggers
- 12 policies

---

#### Migration 003: Categories

1. Abra: `novo-banco/migrations/003_categories.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor
4. Clique em **"Run"**
5. ✅ Verifique: "Success. No rows returned"

**O que foi criado:**
- Tabelas: `categories`, `subcategories`
- Função `create_default_categories()`
- 2 triggers
- 8 policies

---

#### Migration 004: Payment Methods

1. Abra: `novo-banco/migrations/004_payment_methods.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor
4. Clique em **"Run"**
5. ✅ Verifique: "Success. No rows returned"

**O que foi criado:**
- Tabela: `payment_methods`
- Função `create_default_payment_methods()`
- 1 policy

---

#### Migration 005: Credit Cards

1. Abra: `novo-banco/migrations/005_credit_cards.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor
4. Clique em **"Run"**
5. ✅ Verifique: "Success. No rows returned"

**O que foi criado:**
- Tabelas: `credit_cards`, `credit_card_invoices`, `credit_card_transactions`
- Funções: `get_or_create_invoice()`, `pay_invoice()`, `revert_payment()`, `create_installment_purchase()`
- 4 triggers
- 3 policies

---

#### Migration 006: Payables

1. Abra: `novo-banco/migrations/006_payables.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor
4. Clique em **"Run"**
5. ✅ Verifique: "Success. No rows returned"

**O que foi criado:**
- Tabela: `payables`
- 1 trigger
- 1 policy

---

#### Migration 007: Investments

1. Abra: `novo-banco/migrations/007_investments.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor
4. Clique em **"Run"**
5. ✅ Verifique: "Success. No rows returned"

**O que foi criado:**
- Tabelas: `investments`, `investment_transactions`, `asset_prices`, `liquidity_yields`
- 1 trigger
- 4 policies

---

#### Migration 008: Audit System

1. Abra: `novo-banco/migrations/008_audit_system.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor
4. Clique em **"Run"**
5. ✅ Verifique: "Success. No rows returned"

**O que foi criado:**
- Tabela: `audit_log` (IMUTÁVEL)
- Função `audit_trigger_function()`
- Função `get_record_history()`
- 3 views úteis
- 7 triggers de auditoria
- 2 policies

---

#### Migration 009: Idempotency

1. Abra: `novo-banco/migrations/009_idempotency_and_constraints.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor
4. Clique em **"Run"**
5. ✅ Verifique: "Success. No rows returned"

**O que foi criado:**
- Colunas `idempotency_key` em 3 tabelas
- Índices UNIQUE para idempotência
- Constraints adicionais de integridade

---

#### Migration 010: Indexes

1. Abra: `novo-banco/migrations/010_indexes_and_performance.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor
4. Clique em **"Run"**
5. ✅ Verifique: "Success. No rows returned"

**O que foi criado:**
- ~50 índices otimizados
- Estatísticas atualizadas (ANALYZE)

---

## ✅ VERIFICAÇÃO FINAL

Após aplicar TODAS as migrations, execute estas queries no SQL Editor:

### 1. Verificar Tabelas (Esperado: 17)

```sql
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Resultado esperado:** `17`

### 2. Verificar ENUMs (Esperado: 11)

```sql
SELECT COUNT(DISTINCT typname) as total_enums
FROM pg_type t 
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public' AND t.typtype = 'e';
```

**Resultado esperado:** `11`

### 3. Verificar Funções (Esperado: 15+)

```sql
SELECT COUNT(*) as total_functions
FROM information_schema.routines
WHERE routine_schema = 'public';
```

**Resultado esperado:** `15` ou mais

### 4. Verificar Triggers (Esperado: 25+)

```sql
SELECT COUNT(DISTINCT trigger_name) as total_triggers
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

**Resultado esperado:** `25` ou mais

### 5. Verificar Policies (Esperado: 30+)

```sql
SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';
```

**Resultado esperado:** `30` ou mais

### 6. Listar Todas as Tabelas

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Resultado esperado:**
```
account_balance_adjustments
accounts
asset_prices
audit_log
categories
credit_card_invoices
credit_card_transactions
credit_cards
investment_transactions
investments
liquidity_yields
payables
payment_methods
subcategories
transactions
users
```

---

## 🧪 TESTE BÁSICO

Execute este teste para validar que tudo está funcionando:

```sql
-- 1. Criar usuário de teste (use um UUID do auth.users real ou crie um fake)
INSERT INTO users (id, full_name, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'Teste FinCore', 'teste@fincore.com')
ON CONFLICT (id) DO NOTHING;

-- 2. Criar categorias padrão
SELECT create_default_categories('00000000-0000-0000-0000-000000000001');

-- 3. Criar métodos de pagamento padrão
SELECT create_default_payment_methods('00000000-0000-0000-0000-000000000001');

-- 4. Verificar categorias criadas (Esperado: 8)
SELECT COUNT(*) FROM categories WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- 5. Verificar métodos de pagamento criados (Esperado: 9)
SELECT COUNT(*) FROM payment_methods WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- 6. Limpar teste
DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000000001';
```

---

## ❌ TROUBLESHOOTING

### Erro: "relation already exists"
**Causa:** Migration já foi aplicada  
**Solução:** Pule para a próxima migration

### Erro: "type already exists"
**Causa:** ENUM já foi criado  
**Solução:** Pule para a próxima migration

### Erro: "column does not exist"
**Causa:** Migration anterior não foi aplicada  
**Solução:** Volte e aplique as migrations anteriores

### Erro: "permission denied"
**Causa:** Usando usuário sem permissões  
**Solução:** Use o usuário `postgres` (service_role)

---

## 📊 CHECKLIST DE CONCLUSÃO

Após aplicar todas as migrations, marque:

- [ ] Migration 001 aplicada com sucesso
- [ ] Migration 002 aplicada com sucesso
- [ ] Migration 003 aplicada com sucesso
- [ ] Migration 004 aplicada com sucesso
- [ ] Migration 005 aplicada com sucesso
- [ ] Migration 006 aplicada com sucesso
- [ ] Migration 007 aplicada com sucesso
- [ ] Migration 008 aplicada com sucesso
- [ ] Migration 009 aplicada com sucesso
- [ ] Migration 010 aplicada com sucesso
- [ ] Verificação: 17 tabelas ✅
- [ ] Verificação: 11 ENUMs ✅
- [ ] Verificação: 15+ funções ✅
- [ ] Verificação: 25+ triggers ✅
- [ ] Verificação: 30+ policies ✅
- [ ] Teste básico executado ✅

---

## 🎯 PRÓXIMO PASSO

Após aplicar todas as migrations:

1. ✅ Marcar Fase 1 como 100% concluída
2. ✅ Commitar progresso
3. ✅ Iniciar Fase 2: Migrar código Backend/Frontend

---

**Boa sorte! Qualquer erro, me avise!** 🚀
