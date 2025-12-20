-- Adicionar identificador de grupo para parcelamentos de cartão
ALTER TABLE credit_card_transactions 
ADD COLUMN IF NOT EXISTS group_id UUID;

-- Criar índice para performance na exclusão de grupos
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_group_id ON credit_card_transactions(group_id);
