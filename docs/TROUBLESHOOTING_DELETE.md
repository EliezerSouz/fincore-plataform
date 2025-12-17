# 🔧 Troubleshooting: Botão de Excluir Cartão

## ❌ Problema
O botão de excluir cartão não está funcionando.

---

## 🔍 Diagnóstico

### Passo 1: Verificar o Console do Navegador

Abra o console (F12) e tente excluir um cartão. Procure por mensagens de erro:

#### Erro 1: "permission denied for table credit_cards"
**Causa:** Política RLS de DELETE não está configurada corretamente.

**Solução:**
1. Execute a migration `016_fix_delete_credit_cards.sql` no Supabase SQL Editor
2. Ou execute este SQL diretamente:

```sql
DROP POLICY IF EXISTS "Users can delete own cards" ON public.credit_cards;

CREATE POLICY "Users can delete own cards"
ON public.credit_cards
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

GRANT DELETE ON public.credit_cards TO authenticated;
```

---

#### Erro 2: "foreign key constraint"
**Causa:** Existem faturas ou transações vinculadas ao cartão.

**Solução:**
Execute a migration `016_fix_delete_credit_cards.sql` que configura `ON DELETE CASCADE`:

```sql
-- Para faturas
ALTER TABLE public.credit_card_invoices 
DROP CONSTRAINT IF EXISTS credit_card_invoices_credit_card_id_fkey;

ALTER TABLE public.credit_card_invoices
ADD CONSTRAINT credit_card_invoices_credit_card_id_fkey
FOREIGN KEY (credit_card_id)
REFERENCES public.credit_cards(id)
ON DELETE CASCADE;

-- Para transações
ALTER TABLE public.credit_card_transactions 
DROP CONSTRAINT IF EXISTS credit_card_transactions_credit_card_id_fkey;

ALTER TABLE public.credit_card_transactions
ADD CONSTRAINT credit_card_transactions_credit_card_id_fkey
FOREIGN KEY (credit_card_id)
REFERENCES public.credit_cards(id)
ON DELETE CASCADE;
```

---

#### Erro 3: "Unauthorized"
**Causa:** Usuário não está autenticado.

**Solução:**
1. Faça logout e login novamente
2. Verifique se o token de autenticação é válido
3. Limpe o cache do navegador

---

### Passo 2: Verificar Políticas RLS no Supabase

No Supabase Dashboard:
1. Vá em **Database** → **Tables** → `credit_cards`
2. Clique em **Policies**
3. Verifique se existe a política: **"Users can delete own cards"**

**Política correta:**
```
Policy name: Users can delete own cards
Command: DELETE
Target roles: authenticated
USING expression: (auth.uid() = user_id)
```

---

### Passo 3: Testar Exclusão Diretamente no SQL

Execute no SQL Editor do Supabase:

```sql
-- Verificar se você está autenticado
SELECT auth.uid();

-- Tentar excluir (substitua o ID)
DELETE FROM credit_cards 
WHERE id = 'seu-card-id-aqui' 
AND user_id = auth.uid();
```

**Resultado esperado:** 
- ✅ `DELETE 1` - Funcionou!
- ❌ `DELETE 0` - Não encontrou ou sem permissão
- ❌ Erro - Problema de constraint ou RLS

---

## ✅ Solução Rápida

### Opção 1: Executar Migration 016

1. Acesse: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo de `016_fix_delete_credit_cards.sql`
4. Clique em **Run**

### Opção 2: SQL Direto (Correção Completa)

Execute este SQL no Supabase SQL Editor:

```sql
-- 1. Corrigir política de DELETE
DROP POLICY IF EXISTS "Users can delete own cards" ON public.credit_cards;

CREATE POLICY "Users can delete own cards"
ON public.credit_cards
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 2. Garantir permissões
GRANT DELETE ON public.credit_cards TO authenticated;
GRANT DELETE ON public.credit_cards TO service_role;

-- 3. Configurar CASCADE para faturas
ALTER TABLE public.credit_card_invoices 
DROP CONSTRAINT IF EXISTS credit_card_invoices_credit_card_id_fkey;

ALTER TABLE public.credit_card_invoices
ADD CONSTRAINT credit_card_invoices_credit_card_id_fkey
FOREIGN KEY (credit_card_id)
REFERENCES public.credit_cards(id)
ON DELETE CASCADE;

-- 4. Configurar CASCADE para transações
ALTER TABLE public.credit_card_transactions 
DROP CONSTRAINT IF EXISTS credit_card_transactions_credit_card_id_fkey;

ALTER TABLE public.credit_card_transactions
ADD CONSTRAINT credit_card_transactions_credit_card_id_fkey
FOREIGN KEY (credit_card_id)
REFERENCES public.credit_cards(id)
ON DELETE CASCADE;
```

---

## 🧪 Testar Após Correção

1. Recarregue a página de cartões
2. Tente excluir um cartão
3. Verifique o console (F12) - não deve ter erros
4. O cartão deve desaparecer da lista

---

## 📝 Mensagens de Erro Melhoradas

Agora o sistema mostra mensagens mais claras:

- **"Erro de permissão"** → Execute migration 016
- **"Existem faturas vinculadas"** → Execute migration 016
- **Outro erro** → Verifique o console para detalhes

---

## 🆘 Se Nada Funcionar

1. **Verifique autenticação:**
   ```sql
   SELECT auth.uid();
   ```
   Deve retornar um UUID, não NULL.

2. **Verifique se o cartão existe:**
   ```sql
   SELECT * FROM credit_cards WHERE user_id = auth.uid();
   ```

3. **Verifique RLS:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'credit_cards';
   ```

4. **Desabilite RLS temporariamente (APENAS PARA TESTE):**
   ```sql
   ALTER TABLE credit_cards DISABLE ROW LEVEL SECURITY;
   ```
   ⚠️ **ATENÇÃO:** Reabilite depois!
   ```sql
   ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
   ```

---

**Criado em:** 13/12/2024  
**Versão:** 1.0.0
