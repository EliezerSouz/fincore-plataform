-- Adicionar coluna payment_method_id na tabela payables
ALTER TABLE payables ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id);

-- Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_payables_payment_method_id ON payables(payment_method_id);
