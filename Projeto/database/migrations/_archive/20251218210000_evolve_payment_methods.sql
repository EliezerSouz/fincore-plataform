-- Migration: Evolve payment_methods to support business rules
-- Date: 2025-12-18
-- Purpose: Transform payment methods from simple labels to business logic

-- 1. Add business rule columns
ALTER TABLE payment_methods
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'OTHER',
ADD COLUMN IF NOT EXISTS allows_income BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS allows_expense BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS allows_transfer BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS affects_balance BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS affects_credit_card BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS affects_invoice BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. Add comments for documentation
COMMENT ON COLUMN payment_methods.type IS 'Type category: PIX, CASH, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, BOLETO, AUTOMATIC, OTHER';
COMMENT ON COLUMN payment_methods.allows_income IS 'Can be used for income transactions';
COMMENT ON COLUMN payment_methods.allows_expense IS 'Can be used for expense transactions';
COMMENT ON COLUMN payment_methods.allows_transfer IS 'Can be used for transfers between accounts';
COMMENT ON COLUMN payment_methods.affects_balance IS 'Affects account balance immediately';
COMMENT ON COLUMN payment_methods.affects_credit_card IS 'Generates or pays credit card invoice';
COMMENT ON COLUMN payment_methods.affects_invoice IS 'Appears in credit card invoice';
COMMENT ON COLUMN payment_methods.is_internal IS 'Internal movement (neutral, like transfers)';
COMMENT ON COLUMN payment_methods.icon IS 'Icon identifier for UI';
COMMENT ON COLUMN payment_methods.sort_order IS 'Display order in UI';

-- 3. Create function to populate default payment methods for a user
CREATE OR REPLACE FUNCTION create_default_payment_methods(p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- PIX
    INSERT INTO payment_methods (user_id, name, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'PIX', 'PIX', true, true, true, true, false, false, false, '⚡', 1, true)
    ON CONFLICT DO NOTHING;

    -- Dinheiro
    INSERT INTO payment_methods (user_id, name, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Dinheiro', 'CASH', true, true, false, true, false, false, false, '💵', 2, true)
    ON CONFLICT DO NOTHING;

    -- Cartão de Crédito
    INSERT INTO payment_methods (user_id, name, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Cartão de Crédito', 'CREDIT_CARD', false, true, false, false, true, true, false, '💳', 3, true)
    ON CONFLICT DO NOTHING;

    -- Cartão de Débito
    INSERT INTO payment_methods (user_id, name, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Cartão de Débito', 'DEBIT_CARD', false, true, false, true, false, false, false, '💳', 4, true)
    ON CONFLICT DO NOTHING;

    -- Transferência Bancária
    INSERT INTO payment_methods (user_id, name, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Transferência Bancária', 'BANK_TRANSFER', true, true, true, true, false, false, false, '🏦', 5, true)
    ON CONFLICT DO NOTHING;

    -- Boleto
    INSERT INTO payment_methods (user_id, name, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Boleto', 'BOLETO', true, true, false, true, false, false, false, '📄', 6, true)
    ON CONFLICT DO NOTHING;

    -- Débito Automático
    INSERT INTO payment_methods (user_id, name, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Débito Automático', 'AUTOMATIC', false, true, false, true, false, false, false, '🔄', 7, true)
    ON CONFLICT DO NOTHING;

    -- Transferência Interna
    INSERT INTO payment_methods (user_id, name, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Transferência Interna', 'INTERNAL_TRANSFER', false, false, true, false, false, false, true, '🔄', 8, true)
    ON CONFLICT DO NOTHING;

    -- Outro
    INSERT INTO payment_methods (user_id, name, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Outro', 'OTHER', true, true, false, true, false, false, false, '📝', 99, true)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 4. Populate default payment methods for existing users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM auth.users LOOP
        PERFORM create_default_payment_methods(user_record.id);
    END LOOP;
END $$;

-- 5. Create trigger to auto-create payment methods for new users
CREATE OR REPLACE FUNCTION auto_create_payment_methods()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_default_payment_methods(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_payment_methods ON auth.users;
CREATE TRIGGER trigger_auto_create_payment_methods
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION auto_create_payment_methods();

-- 6. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_active 
ON payment_methods(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_payment_methods_type 
ON payment_methods(type);
