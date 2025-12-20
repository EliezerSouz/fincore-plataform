# 🚀 Como Executar as Migrations - Guia Atualizado

## ⚠️ Importante

O script `run-migrations.mjs` pode **não funcionar** em todos os projetos Supabase porque:
- Requer a função `exec_sql` que não existe por padrão
- Precisa de permissões especiais do `service_role`

**Recomendação:** Execute as migrations **manualmente** pelo Dashboard do Supabase.

---

## ✅ Método Recomendado: Supabase Dashboard

### Passo 1: Acessar o SQL Editor

1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em **"SQL Editor"** no menu lateral esquerdo
4. Clique em **"New query"**

### Passo 2: Executar as Migrations na Ordem

Execute cada arquivo SQL **na ordem numérica**. Copie o conteúdo completo de cada arquivo e cole no SQL Editor.

#### ✅ Migration 011: Credit Card Invoices
**Arquivo:** `web/supabase/migrations/011_create_credit_card_invoices.sql`

Clique em **"Run"** (ou Ctrl+Enter)

#### ✅ Migration 012: Credit Card Transactions
**Arquivo:** `web/supabase/migrations/012_create_credit_card_transactions.sql`

Clique em **"Run"**

#### ✅ Migration 013: Credit Card Functions
**Arquivo:** `web/supabase/migrations/013_credit_card_functions.sql`

Clique em **"Run"**

#### ✅ Migration 014: Fix Credit Cards RLS (IMPORTANTE!)
**Arquivo:** `web/supabase/migrations/014_fix_credit_cards_rls.sql`

Clique em **"Run"**

Esta migration corrige o erro: `permission denied for table credit_cards`

#### ✅ Migration 015: Fix Invoices & Transactions RLS (IMPORTANTE!)
**Arquivo:** `web/supabase/migrations/015_fix_invoices_transactions_rls.sql`

Clique em **"Run"**

Esta migration corrige as permissões das outras tabelas.

---

## 🧪 Verificar se Funcionou

Execute esta query no SQL Editor:

```sql
-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'credit_card%'
ORDER BY table_name;
```

**Resultado esperado:**
```
credit_card_invoices
credit_card_transactions
credit_cards
```

---

## 🔍 Verificar Políticas RLS

```sql
-- Verificar se as políticas existem
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('credit_cards', 'credit_card_invoices', 'credit_card_transactions')
ORDER BY tablename, policyname;
```

**Resultado esperado:** Deve mostrar 4 políticas por tabela (SELECT, INSERT, UPDATE, DELETE)

---

## 🔧 Verificar Permissões

```sql
-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('credit_cards', 'credit_card_invoices', 'credit_card_transactions');
```

**Resultado esperado:** `rowsecurity = true` para todas as tabelas

---

## 🎯 Testar na Aplicação

Após executar todas as migrations:

1. Acesse: http://localhost:3000/compromissos/cards
2. Clique em **"Novo Cartão"** ou **"Criar Primeiro Cartão"**
3. Preencha o formulário:
   - Nome: "Meu Cartão Teste"
   - Bandeira: Visa
   - Últimos 4 dígitos: 1234
   - Limite: 5000
   - Dia fechamento: 5
   - Dia vencimento: 15
   - Cor: Escolha qualquer uma (agora tem **Amarelo do Banco do Brasil**! 🟡)
4. Clique em **"Criar Cartão"**

**Resultado esperado:**
- ✅ Cartão criado com sucesso
- ✅ Página atualiza mostrando o novo cartão
- ✅ Limite disponível aparece corretamente
- ✅ Sem erros no console

---

## 🆘 Troubleshooting

### Erro: "permission denied for table credit_cards"

**Solução:** Execute as migrations **014** e **015** que corrigem as políticas RLS.

### Erro: "relation credit_card_invoices does not exist"

**Solução:** Execute a migration **011** primeiro.

### Erro: "function get_or_create_invoice does not exist"

**Solução:** Execute a migration **013**.

### Script run-migrations.mjs não funciona

**Solução:** Isso é normal! Execute manualmente pelo Dashboard conforme este guia.

---

## 📝 Resumo das Migrations

| # | Arquivo | Descrição |
|---|---------|-----------|
| 011 | `011_create_credit_card_invoices.sql` | Cria tabela de faturas |
| 012 | `012_create_credit_card_transactions.sql` | Cria tabela de transações |
| 013 | `013_credit_card_functions.sql` | Cria funções auxiliares |
| 014 | `014_fix_credit_cards_rls.sql` | **Corrige permissões** da tabela credit_cards |
| 015 | `015_fix_invoices_transactions_rls.sql` | **Corrige permissões** das outras tabelas |

---

## 🎨 Novidades

### Cores Disponíveis para Cartões

Agora você tem **10 opções de cores**:

1. 🟣 Roxo (Nubank)
2. 🟠 Laranja (Inter)
3. 🔴 Vermelho (Bradesco/Santander)
4. ⚫ Preto (Black/C6/XP)
5. 🔵 Azul (Itaú/Caixa)
6. 🟡 **Amarelo (Banco do Brasil)** ← NOVO!
7. 🟢 Verde (Stone/Outros)
8. 🩷 Rosa
9. 🟨 Gold

---

**Última atualização:** 13/12/2024  
**Versão:** 2.0.0
