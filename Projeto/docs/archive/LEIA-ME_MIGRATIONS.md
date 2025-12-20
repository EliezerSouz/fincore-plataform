# 🚨 AÇÃO NECESSÁRIA - Executar Migrations

## Problema
O código está tentando usar colunas que ainda não existem no banco de dados:
- `transactions.credit_card_invoice_id` (para vincular pagamentos de fatura)
- `users.primary_credit_card_id` (para sincronizar cartão ativo entre dispositivos)
- `users.primary_card_locked` (para bloquear a escolha permanentemente)

## Solução Rápida

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Copie e cole o conteúdo do arquivo: `APPLY_NEW_MIGRATIONS.sql`
5. Clique em **Run**
6. Aguarde a confirmação de sucesso

### Opção 2: Via Supabase CLI

```bash
cd web
supabase db push
```

Ou execute as migrations individuais:

```bash
cd web/supabase/migrations
# Execute no psql ou Supabase SQL Editor:
# 034_add_invoice_link_to_transactions.sql
# 049_add_primary_card_to_users.sql
```

## Verificação

Após executar, verifique se as colunas foram criadas:

```sql
-- Verificar transactions
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name = 'credit_card_invoice_id';

-- Verificar users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('primary_credit_card_id', 'primary_card_locked');
```

Resultado esperado:
```
credit_card_invoice_id | uuid
primary_credit_card_id | uuid
primary_card_locked    | boolean
```

## Após Executar

1. ✅ Pagamento de faturas funcionará normalmente
2. ✅ Vínculo entre transação e fatura será criado
3. ✅ Cartão primário sincronizará entre dispositivos
4. ✅ Seleção de cartão será bloqueada permanentemente

## Arquivos de Migration

- `web/supabase/migrations/034_add_invoice_link_to_transactions.sql`
- `web/supabase/migrations/049_add_primary_card_to_users.sql`
- `APPLY_NEW_MIGRATIONS.sql` (script consolidado para execução rápida)
