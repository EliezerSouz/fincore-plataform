-- 1. Remove a constraint problemática se existir
ALTER TABLE payment_methods DROP CONSTRAINT IF EXISTS payment_methods_type_check;

-- 2. Sanitiza os dados existentes para garantir que todos tenham tipos válidos antes de aplicar a nova regra
-- Converte qualquer valor desconhecido ou nulo para 'outros'
UPDATE payment_methods 
SET type = 'outros' 
WHERE type NOT IN ('dinheiro', 'bancario', 'credito', 'debito', 'outros') OR type IS NULL;

-- 3. Agora adiciona a nova constraint com segurança, pois todos os dados estão limpos
ALTER TABLE payment_methods ADD CONSTRAINT payment_methods_type_check 
CHECK (type IN ('dinheiro', 'bancario', 'credito', 'debito', 'outros'));

-- 4. Garante a constraint UNIQUE no slug
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'payment_methods_slug_key'
    ) THEN 
        ALTER TABLE payment_methods ADD CONSTRAINT payment_methods_slug_key UNIQUE (slug);
    END IF; 
END $$;

-- 5. Seed dos dados corretos
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
