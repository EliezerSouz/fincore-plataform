-- Migration: Evolve payment_methods to support business rules (SAFE VERSION)
-- Date: 2025-12-18
-- Purpose: Transform payment methods from simple labels to business logic

-- 1. Add business rule columns (one by one for better error handling)
DO $$ 
BEGIN
    -- Add type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payment_methods' AND column_name='type') THEN
        ALTER TABLE payment_methods ADD COLUMN type VARCHAR(50) DEFAULT 'OTHER';
    END IF;

    -- Add allows_income column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payment_methods' AND column_name='allows_income') THEN
        ALTER TABLE payment_methods ADD COLUMN allows_income BOOLEAN NOT NULL DEFAULT true;
    END IF;

    -- Add allows_expense column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payment_methods' AND column_name='allows_expense') THEN
        ALTER TABLE payment_methods ADD COLUMN allows_expense BOOLEAN NOT NULL DEFAULT true;
    END IF;

    -- Add allows_transfer column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payment_methods' AND column_name='allows_transfer') THEN
        ALTER TABLE payment_methods ADD COLUMN allows_transfer BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- Add affects_balance column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payment_methods' AND column_name='affects_balance') THEN
        ALTER TABLE payment_methods ADD COLUMN affects_balance BOOLEAN NOT NULL DEFAULT true;
    END IF;

    -- Add affects_credit_card column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payment_methods' AND column_name='affects_credit_card') THEN
        ALTER TABLE payment_methods ADD COLUMN affects_credit_card BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- Add affects_invoice column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payment_methods' AND column_name='affects_invoice') THEN
        ALTER TABLE payment_methods ADD COLUMN affects_invoice BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- Add is_internal column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payment_methods' AND column_name='is_internal') THEN
        ALTER TABLE payment_methods ADD COLUMN is_internal BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- Add icon column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payment_methods' AND column_name='icon') THEN
        ALTER TABLE payment_methods ADD COLUMN icon VARCHAR(50);
    END IF;

    -- Add sort_order column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='payment_methods' AND column_name='sort_order') THEN
        ALTER TABLE payment_methods ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
END $$;

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
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'PIX') THEN
        INSERT INTO payment_methods (user_id, name, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'PIX', 'PIX', true, true, true, true, false, false, false, '⚡', 1, true);
    END IF;

    -- Dinheiro
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'CASH') THEN
        INSERT INTO payment_methods (user_id, name, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'Dinheiro', 'CASH', true, true, false, true, false, false, false, '💵', 2, true);
    END IF;

    -- Cartão de Crédito
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'CREDIT_CARD') THEN
        INSERT INTO payment_methods (user_id, name, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'Cartão de Crédito', 'CREDIT_CARD', false, true, false, false, true, true, false, '💳', 3, true);
    END IF;

    -- Cartão de Débito
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'DEBIT_CARD') THEN
        INSERT INTO payment_methods (user_id, name, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'Cartão de Débito', 'DEBIT_CARD', false, true, false, true, false, false, false, '💳', 4, true);
    END IF;

    -- Transferência Bancária
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'BANK_TRANSFER') THEN
        INSERT INTO payment_methods (user_id, name, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'Transferência Bancária', 'BANK_TRANSFER', true, true, true, true, false, false, false, '🏦', 5, true);
    END IF;

    -- Boleto
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'BOLETO') THEN
        INSERT INTO payment_methods (user_id, name, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'Boleto', 'BOLETO', true, true, false, true, false, false, false, '📄', 6, true);
    END IF;

    -- Débito Automático
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'AUTOMATIC') THEN
        INSERT INTO payment_methods (user_id, name, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'Débito Automático', 'AUTOMATIC', false, true, false, true, false, false, false, '🔄', 7, true);
    END IF;

    -- Transferência Interna
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'INTERNAL_TRANSFER') THEN
        INSERT INTO payment_methods (user_id, name, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'Transferência Interna', 'INTERNAL_TRANSFER', false, false, true, false, false, false, true, '🔄', 8, true);
    END IF;

    -- Outro
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'OTHER') THEN
        INSERT INTO payment_methods (user_id, name, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'Outro', 'OTHER', true, true, false, true, false, false, false, '📝', 99, true);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Populate default payment methods for existing users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Check if auth.users exists, if not use public.users or skip
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        FOR user_record IN SELECT id FROM auth.users LOOP
            PERFORM create_default_payment_methods(user_record.id);
        END LOOP;
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        FOR user_record IN SELECT id FROM public.users LOOP
            PERFORM create_default_payment_methods(user_record.id);
        END LOOP;
    END IF;
END $$;

-- 5. Create trigger to auto-create payment methods for new users (if auth.users exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        -- Create function
        CREATE OR REPLACE FUNCTION auto_create_payment_methods()
        RETURNS TRIGGER AS $func$
        BEGIN
            PERFORM create_default_payment_methods(NEW.id);
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;

        -- Drop trigger if exists
        DROP TRIGGER IF EXISTS trigger_auto_create_payment_methods ON auth.users;
        
        -- Create trigger
        CREATE TRIGGER trigger_auto_create_payment_methods
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION auto_create_payment_methods();
    END IF;
END $$;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_active 
ON payment_methods(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_payment_methods_type 
ON payment_methods(type);

-- 7. Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Payment methods table evolved with business rules.';
END $$;
