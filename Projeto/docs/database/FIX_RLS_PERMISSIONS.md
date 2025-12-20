# 🔧 Correção de Permissões - Cartões de Crédito

## ❌ Problema Identificado

```
Error: permission denied for table credit_cards
```

Isso acontece porque as **políticas RLS (Row Level Security)** não estão configuradas corretamente ou faltam permissões.

---

## ✅ Solução: Executar Migrations de Correção

### Passo 1: Acessar o Supabase Dashboard

1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em **"SQL Editor"** no menu lateral

---

### Passo 2: Executar Migration 014

**Arquivo:** `web/supabase/migrations/014_fix_credit_cards_rls.sql`

Copie e cole o conteúdo completo no SQL Editor e clique em **"Run"**.

Esta migration vai:
- ✅ Recriar as políticas RLS para `credit_cards`
- ✅ Adicionar permissões para usuários autenticados
- ✅ Garantir que `auth.uid()` funcione corretamente

---

### Passo 3: Executar Migration 015

**Arquivo:** `web/supabase/migrations/015_fix_invoices_transactions_rls.sql`

Copie e cole o conteúdo completo no SQL Editor e clique em **"Run"**.

Esta migration vai:
- ✅ Recriar as políticas RLS para `credit_card_invoices`
- ✅ Recriar as políticas RLS para `credit_card_transactions`
- ✅ Adicionar permissões necessárias

---

### Passo 4: Verificar se Funcionou

Execute esta query no SQL Editor:

```sql
-- Testar se você consegue ver a tabela
SELECT * FROM credit_cards LIMIT 1;
```

**Resultado esperado:**
- ✅ Sem erros (mesmo que retorne 0 linhas)
- ❌ Se ainda der erro de permissão, vá para o Passo 5

---

### Passo 5: Verificação de Autenticação (se ainda houver erro)

Execute esta query para verificar se você está autenticado:

```sql
SELECT auth.uid();
```

**Resultado esperado:**
- ✅ Deve retornar um UUID (seu user_id)
- ❌ Se retornar `NULL`, você não está autenticado no SQL Editor

**Solução se retornar NULL:**

O SQL Editor do Supabase roda como `service_role` por padrão, não como usuário autenticado. Para testar as políticas RLS, você precisa:

1. **Opção A - Desabilitar RLS temporariamente para teste:**
   ```sql
   ALTER TABLE credit_cards DISABLE ROW LEVEL SECURITY;
   ALTER TABLE credit_card_invoices DISABLE ROW LEVEL SECURITY;
   ALTER TABLE credit_card_transactions DISABLE ROW LEVEL SECURITY;
   ```
   
   ⚠️ **ATENÇÃO:** Isso remove a segurança! Use apenas para teste local.

2. **Opção B - Testar via aplicação:**
   - As políticas RLS funcionam automaticamente quando você acessa via aplicação
   - O erro deve desaparecer após executar as migrations 014 e 015
   - Tente criar um cartão pela interface web

---

### Passo 6: Testar na Aplicação

1. Acesse: http://localhost:3000/compromissos/cards
2. Clique em "Novo Cartão"
3. Preencha o formulário
4. Clique em "Criar Cartão"

**Resultado esperado:**
- ✅ Cartão criado com sucesso
- ✅ Página atualiza mostrando o novo cartão
- ✅ Sem erros no console

---

## 🔍 Diagnóstico Adicional

Se ainda houver problemas, execute estas queries para diagnóstico:

### Verificar se as políticas existem:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('credit_cards', 'credit_card_invoices', 'credit_card_transactions')
ORDER BY tablename, policyname;
```

### Verificar se RLS está habilitado:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('credit_cards', 'credit_card_invoices', 'credit_card_transactions');
```

**Resultado esperado:** `rowsecurity = true` para todas as tabelas

### Verificar permissões:
```sql
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'credit_cards';
```

**Resultado esperado:** Deve incluir `authenticated` com permissões

---

## 📝 Resumo dos Arquivos Criados

1. `014_fix_credit_cards_rls.sql` - Corrige políticas da tabela `credit_cards`
2. `015_fix_invoices_transactions_rls.sql` - Corrige políticas das tabelas de faturas e transações

---

## 🆘 Se Nada Funcionar

Execute este script de "reset completo" no SQL Editor:

```sql
-- ATENÇÃO: Isso vai APAGAR TODOS OS DADOS das tabelas de cartões!
-- Use apenas em ambiente de desenvolvimento

DROP TABLE IF EXISTS credit_card_transactions CASCADE;
DROP TABLE IF EXISTS credit_card_invoices CASCADE;
DROP TABLE IF EXISTS credit_cards CASCADE;

-- Depois execute novamente as migrations na ordem:
-- 009, 011, 012, 013, 014, 015
```

---

**Criado em:** 13/12/2024  
**Versão:** 1.0.0
