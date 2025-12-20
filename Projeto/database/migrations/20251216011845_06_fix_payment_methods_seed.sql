-- 1. Primeiro garantimos que a coluna slug seja única (necessário para o ON CONFLICT funcionar)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'payment_methods_slug_key'
    ) THEN 
        ALTER TABLE payment_methods ADD CONSTRAINT payment_methods_slug_key UNIQUE (slug);
    END IF; 
END $$;

-- 2. Agora podemos inserir os dados com segurança
INSERT INTO payment_methods (name, slug, allows_income, allows_expense, is_active) VALUES
('Dinheiro', 'dinheiro', true, true, true),
('Pix', 'pix', true, true, true),
('Cartão de Crédito', 'cartao_credito', false, true, true),
('Cartão de Débito', 'cartao_debito', false, true, true),
('Boleto', 'boleto', false, true, true),
('Transferência', 'transferencia', true, true, true),
('Outros', 'outros', true, true, true)
ON CONFLICT (slug) DO NOTHING;
