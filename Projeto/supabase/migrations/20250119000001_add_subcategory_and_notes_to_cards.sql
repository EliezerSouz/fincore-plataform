-- Adicionar colunas de subcategoria e observações na tabela de transações de cartão
ALTER TABLE credit_card_transactions 
ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Criar índice para performance na busca de subcategorias
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_subcategory_id ON credit_card_transactions(subcategory_id);
