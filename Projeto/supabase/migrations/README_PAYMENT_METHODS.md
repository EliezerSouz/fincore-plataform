# 📦 MIGRATIONS - PAYMENT METHODS

## ✅ Migration Consolidada

Toda a estrutura de **Payment Methods** está consolidada em uma única migration:

**Arquivo:** `20250118000000_payment_methods_complete.sql`

---

## 📋 O QUE ESTA MIGRATION FAZ

### 1. **Adiciona Novos Campos**
- `allows_transfer` - Permite transferências
- `affects_credit_card` - Afeta cartão de crédito
- `affects_invoice` - Afeta faturas
- `is_internal` - Movimento interno
- `affects_balance` - Afeta saldo
- `requires_bank_account` - Requer conta bancária
- `icon` - Ícone da modalidade

### 2. **Atualiza Métodos Existentes**
Configura automaticamente métodos comuns:
- PIX
- Dinheiro
- Cartão de Crédito
- Cartão de Débito
- Boleto
- Transferência Bancária

### 3. **Cria Índices**
5 índices para otimizar performance:
- `idx_payment_methods_allows_income`
- `idx_payment_methods_allows_expense`
- `idx_payment_methods_allows_transfer`
- `idx_payment_methods_active`
- `idx_payment_methods_user_id`

### 4. **Configura Permissões (GRANTS)**
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON payment_methods TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON payment_methods TO anon;
```

### 5. **Configura Segurança (RLS)**
4 policies:
- SELECT - Visualizar próprios métodos
- INSERT - Criar novos métodos
- UPDATE - Atualizar próprios métodos
- DELETE - Deletar próprios métodos

---

## 🚀 COMO APLICAR

### Opção 1: Supabase Dashboard (RECOMENDADO)
1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Copie o conteúdo de `20250118000000_payment_methods_complete.sql`
4. Execute (RUN)

### Opção 2: Supabase CLI
```bash
supabase db push
```

---

## ✅ VERIFICAÇÃO

Após aplicar, execute para verificar:

```sql
-- Verificar campos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payment_methods'
ORDER BY ordinal_position;

-- Verificar grants
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'payment_methods'
  AND grantee IN ('authenticated', 'anon');

-- Verificar policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'payment_methods';

-- Verificar índices
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'payment_methods';
```

**Resultado Esperado:**
- ✅ 7 novos campos adicionados
- ✅ Grants para authenticated e anon
- ✅ 4 policies ativas
- ✅ 5 índices criados

---

## 🔄 ROLLBACK (Se Necessário)

Para reverter esta migration:

```sql
-- Remover campos
ALTER TABLE payment_methods
DROP COLUMN IF EXISTS allows_transfer,
DROP COLUMN IF EXISTS affects_credit_card,
DROP COLUMN IF EXISTS affects_invoice,
DROP COLUMN IF EXISTS is_internal,
DROP COLUMN IF EXISTS affects_balance,
DROP COLUMN IF EXISTS requires_bank_account,
DROP COLUMN IF EXISTS icon;

-- Remover policies
DROP POLICY IF EXISTS "Users can view their own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can insert their own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can update their own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can delete their own payment methods" ON payment_methods;

-- Remover índices
DROP INDEX IF EXISTS idx_payment_methods_allows_income;
DROP INDEX IF EXISTS idx_payment_methods_allows_expense;
DROP INDEX IF EXISTS idx_payment_methods_allows_transfer;
DROP INDEX IF EXISTS idx_payment_methods_active;
DROP INDEX IF EXISTS idx_payment_methods_user_id;
```

---

## 📝 NOTAS IMPORTANTES

1. **Esta migration é idempotente** - Pode ser executada múltiplas vezes sem causar erros
2. **Preserva dados existentes** - Não deleta nenhum registro
3. **Atualiza métodos comuns** - Configura automaticamente PIX, Dinheiro, etc
4. **Segura para produção** - Usa `IF NOT EXISTS` e `IF EXISTS`

---

## 🎯 PRÓXIMOS PASSOS

Após aplicar esta migration:

1. ✅ Acesse `/sistema/payment-methods`
2. ✅ Configure suas formas de pagamento
3. ✅ Teste criar, editar e deletar
4. ✅ Verifique que tudo funciona

---

**Status:** ✅ TESTADO E FUNCIONANDO  
**Versão:** 1.0.0  
**Data:** 2025-01-18
