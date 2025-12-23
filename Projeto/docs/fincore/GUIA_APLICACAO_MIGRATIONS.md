# GUIA DE APLICAÇÃO DAS MIGRATIONS - FASE 1

**⚠️ IMPORTANTE: LEIA ANTES DE APLICAR**

---

## 🎯 OBJETIVO

Aplicar as 3 migrations críticas criadas na Fase 1:
1. Consolidação de ENUMs
2. Locks em Trigger de Saldo
3. Sistema de Auditoria

---

## ⚠️ PRÉ-REQUISITOS

### 1. Backup do Banco de Dados
**OBRIGATÓRIO** antes de aplicar qualquer migration!

```bash
# Via Supabase Dashboard
# 1. Acesse seu projeto no Supabase
# 2. Vá em Database > Backups
# 3. Clique em "Create Backup"
# 4. Aguarde conclusão
```

### 2. Ambiente de Desenvolvimento
**NÃO APLICAR EM PRODUÇÃO AINDA!**

Estas migrations devem ser testadas primeiro em desenvolvimento.

### 3. Verificar Conexão com Banco
```bash
# Verificar se .env.local está configurado
cat apps/web/.env.local | grep DATABASE_URL
```

---

## 📋 PASSO A PASSO

### MIGRATION 1: Consolidar ENUMs

**Arquivo:** `20251223010000_consolidate_enums.sql`  
**Risco:** 🟡 MÉDIO (altera estrutura de dados)  
**Tempo Estimado:** 2-5 minutos

#### Aplicar

```bash
# 1. Navegar para diretório do projeto
cd f:\Antigravity\FinCore\Projeto\apps\web

# 2. Editar apply-migration.mjs
# Alterar linha 31 para:
# const migrationFile = path.resolve(__dirname, 'migrations/20251223010000_consolidate_enums.sql')

# 3. Aplicar migration
node supabase/apply-migration.mjs
```

#### Verificar

```sql
-- Conectar ao banco via Supabase SQL Editor e executar:

-- Verificar ENUMs criados
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'subscription_status'::regtype;
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'subscription_plan_type'::regtype;
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'account_type'::regtype;

-- Verificar dados migrados
SELECT subscription_status, subscription_plan FROM users LIMIT 10;
SELECT type FROM accounts LIMIT 10;
```

#### Resultado Esperado
```
subscription_status: free, trial, active, past_due, canceled, suspended
subscription_plan_type: free, basic, premium, premium_ia, enterprise
account_type: corrente, poupanca, investimento, carteira, digital, outros
```

---

### MIGRATION 2: Locks em Trigger de Saldo

**Arquivo:** `20251223020000_add_locks_to_balance_trigger.sql`  
**Risco:** 🟢 BAIXO (apenas atualiza função)  
**Tempo Estimado:** 1 minuto

#### Aplicar

```bash
# 1. Editar apply-migration.mjs
# Alterar linha 31 para:
# const migrationFile = path.resolve(__dirname, 'migrations/20251223020000_add_locks_to_balance_trigger.sql')

# 2. Aplicar migration
node supabase/apply-migration.mjs
```

#### Verificar

```sql
-- Verificar se função foi atualizada
SELECT prosrc FROM pg_proc WHERE proname = 'handle_balance_update';

-- Deve conter "FOR UPDATE" no código
```

#### Testar

```sql
-- Criar transação de teste
BEGIN;
INSERT INTO transactions (user_id, account_id, description, amount, type, date, is_paid)
VALUES (
    'SEU_USER_ID',
    'SEU_ACCOUNT_ID',
    'Teste de lock',
    100.00,
    'receita',
    CURRENT_DATE,
    true
);
COMMIT;

-- Verificar se saldo foi atualizado corretamente
SELECT balance FROM accounts WHERE id = 'SEU_ACCOUNT_ID';
```

---

### MIGRATION 3: Sistema de Auditoria

**Arquivo:** `20251223030000_create_audit_log.sql`  
**Risco:** 🟢 BAIXO (apenas cria tabela e triggers)  
**Tempo Estimado:** 2 minutos

#### Aplicar

```bash
# 1. Editar apply-migration.mjs
# Alterar linha 31 para:
# const migrationFile = path.resolve(__dirname, 'migrations/20251223030000_create_audit_log.sql')

# 2. Aplicar migration
node supabase/apply-migration.mjs
```

#### Verificar

```sql
-- Verificar se tabela foi criada
SELECT * FROM audit_log LIMIT 1;

-- Verificar triggers
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname LIKE 'audit_%';

-- Deve retornar 7 triggers:
-- audit_transactions_trigger
-- audit_accounts_trigger
-- audit_invoices_trigger
-- audit_cc_transactions_trigger
-- audit_payables_trigger
-- audit_credit_cards_trigger
-- audit_balance_adjustments_trigger
```

#### Testar

```sql
-- Criar transação de teste
INSERT INTO transactions (user_id, account_id, description, amount, type, date)
VALUES (
    'SEU_USER_ID',
    'SEU_ACCOUNT_ID',
    'Teste de auditoria',
    50.00,
    'receita',
    CURRENT_DATE
);

-- Verificar se log foi criado
SELECT * FROM audit_log 
WHERE table_name = 'transactions' 
ORDER BY created_at DESC 
LIMIT 1;

-- Deve retornar um registro com:
-- - operation = 'INSERT'
-- - new_values contendo os dados da transação
-- - old_values = NULL
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após aplicar todas as migrations, verificar:

- [ ] Nenhum erro durante aplicação
- [ ] ENUMs consolidados existem
- [ ] Dados de usuários migrados corretamente
- [ ] Função `handle_balance_update` contém "FOR UPDATE"
- [ ] Tabela `audit_log` existe
- [ ] 7 triggers de auditoria criados
- [ ] Teste de criação de transação funciona
- [ ] Log de auditoria é criado automaticamente
- [ ] Views de auditoria funcionam (`v_account_balance_history`, etc)

---

## 🚨 EM CASO DE ERRO

### Erro na Migration de ENUMs

**Sintoma:** Erro "type already exists" ou "column type mismatch"

**Solução:**
```sql
-- Reverter para TEXT temporariamente
ALTER TABLE users ALTER COLUMN subscription_status TYPE TEXT;
ALTER TABLE users ALTER COLUMN subscription_plan TYPE TEXT;
ALTER TABLE accounts ALTER COLUMN type TYPE TEXT;

-- Reexecutar migration
```

### Erro na Migration de Locks

**Sintoma:** Erro "function handle_balance_update does not exist"

**Solução:**
```sql
-- Verificar se trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'on_transaction_change';

-- Se não existir, recriar
-- (código está na migration 004_create_transactions_table.sql)
```

### Erro na Migration de Auditoria

**Sintoma:** Erro "table audit_log already exists"

**Solução:**
```sql
-- Dropar tabela e recriar
DROP TABLE IF EXISTS audit_log CASCADE;

-- Reexecutar migration
```

---

## 📊 MONITORAMENTO PÓS-APLICAÇÃO

### Verificar Performance

```sql
-- Verificar se locks não estão causando deadlocks
SELECT * FROM pg_stat_activity WHERE wait_event_type = 'Lock';

-- Verificar tamanho da tabela de auditoria
SELECT pg_size_pretty(pg_total_relation_size('audit_log'));
```

### Verificar Auditoria Funcionando

```sql
-- Ver últimas 10 operações auditadas
SELECT 
    table_name,
    operation,
    created_at
FROM audit_log
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎯 PRÓXIMOS PASSOS

Após aplicar e validar todas as migrations:

1. ✅ Commitar mudanças
2. ✅ Fazer merge para `main`
3. ✅ Testar em staging (se houver)
4. ⏳ Implementar Correções #4 e #5 (backend)
5. ⏳ Aplicar em produção (após testes completos)

---

## 📞 SUPORTE

Se encontrar problemas:

1. Verificar logs do Supabase
2. Consultar documentação das migrations
3. Revisar `FASE1_RESUMO_CORRECOES.md`
4. Verificar `AUDITORIA_TECNICA_COMPLETA.md`

---

**Última Atualização:** 22/12/2025 23:58  
**Versão:** 1.0
