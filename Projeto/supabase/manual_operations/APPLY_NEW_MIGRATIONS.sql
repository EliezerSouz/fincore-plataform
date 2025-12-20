-- Execute as novas migrations criadas
-- Execute este script no Supabase SQL Editor

-- Migration 034 (renumerada): Adicionar invoice_id às transações
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS credit_card_invoice_id UUID NULL;

ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS fk_transactions_invoice;

ALTER TABLE transactions
ADD CONSTRAINT fk_transactions_invoice
FOREIGN KEY (credit_card_invoice_id)
REFERENCES credit_card_invoices(id)
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_invoice_id
ON transactions(credit_card_invoice_id)
WHERE credit_card_invoice_id IS NOT NULL;

COMMENT ON COLUMN transactions.credit_card_invoice_id IS 'Links transaction to a credit card invoice (for invoice payment tracking)';

-- Migration 049: Adicionar primary_credit_card_id aos usuários
ALTER TABLE users
ADD COLUMN IF NOT EXISTS primary_credit_card_id UUID NULL;

ALTER TABLE users
DROP CONSTRAINT IF EXISTS fk_users_primary_card;

ALTER TABLE users
ADD CONSTRAINT fk_users_primary_card
FOREIGN KEY (primary_credit_card_id)
REFERENCES credit_cards(id)
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_primary_card
ON users(primary_credit_card_id)
WHERE primary_credit_card_id IS NOT NULL;

COMMENT ON COLUMN users.primary_credit_card_id IS 'The primary/active credit card for Free plan users (synchronized across devices)';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS primary_card_locked BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN users.primary_card_locked IS 'Indicates if the primary card selection has been permanently locked (Free plan)';

-- Verificar se as colunas foram criadas
SELECT 
    'transactions' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'transactions' 
AND column_name = 'credit_card_invoice_id'
UNION ALL
SELECT 
    'users' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name IN ('primary_credit_card_id', 'primary_card_locked')
ORDER BY table_name, column_name;
