-- 1. Garante a constraint UNIQUE no slug (caso ainda não tenha passado)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'payment_methods_slug_key'
    ) THEN 
        ALTER TABLE payment_methods ADD CONSTRAINT payment_methods_slug_key UNIQUE (slug);
    END IF; 
END $$;

-- 2. Insere os dados incluindo a coluna 'type' que é obrigatória
-- Estamos assumindo valores lógicos para 'type' baseados no nome do método
INSERT INTO payment_methods (name, slug, type, allows_income, allows_expense, is_active) VALUES
('Dinheiro', 'dinheiro', 'dinheiro', true, true, true),
('Pix', 'pix', 'bancario', true, true, true),
('Cartão de Crédito', 'cartao_credito', 'credito', false, true, true),
('Cartão de Débito', 'cartao_debito', 'debito', false, true, true),
('Boleto', 'boleto', 'bancario', false, true, true),
('Transferência', 'transferencia', 'bancario', true, true, true),
('Outros', 'outros', 'outros', true, true, true)
ON CONFLICT (slug) DO UPDATE SET
    allows_income = EXCLUDED.allows_income,
    allows_expense = EXCLUDED.allows_expense,
    type = EXCLUDED.type;
