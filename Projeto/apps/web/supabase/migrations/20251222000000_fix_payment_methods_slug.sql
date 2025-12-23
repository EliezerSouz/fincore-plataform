-- Fix create_default_payment_methods to include slug
-- This fixes the issue where payment methods were not created because of the missing slug column constraint
-- Slugs are generated as 'type-userid' to ensure global uniqueness required by the current table schema

CREATE OR REPLACE FUNCTION create_default_payment_methods(p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- PIX
    INSERT INTO payment_methods (user_id, name, type, slug, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'PIX', 'PIX', 'pix-' || p_user_id::text, true, true, true, true, false, false, false, '⚡', 1, true)
    ON CONFLICT DO NOTHING;

    -- Dinheiro
    INSERT INTO payment_methods (user_id, name, type, slug, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Dinheiro', 'CASH', 'cash-' || p_user_id::text, true, true, false, true, false, false, false, '💵', 2, true)
    ON CONFLICT DO NOTHING;

    -- Cartão de Crédito
    INSERT INTO payment_methods (user_id, name, type, slug, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Cartão de Crédito', 'CREDIT_CARD', 'credit-card-' || p_user_id::text, false, true, false, false, true, true, false, '💳', 3, true)
    ON CONFLICT DO NOTHING;
    
    -- Cartão de Débito
    INSERT INTO payment_methods (user_id, name, type, slug, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Cartão de Débito', 'DEBIT_CARD', 'debit-card-' || p_user_id::text, false, true, false, true, false, false, false, '💳', 4, true)
    ON CONFLICT DO NOTHING;

    -- Boleto
    INSERT INTO payment_methods (user_id, name, type, slug, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Boleto', 'BOLETO', 'boleto-' || p_user_id::text, false, true, false, true, false, false, false, '📄', 5, true)
    ON CONFLICT DO NOTHING;

    -- Transferência Bancária
    INSERT INTO payment_methods (user_id, name, type, slug, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Transferência Bancária', 'BANK_TRANSFER', 'bank-transfer-' || p_user_id::text, true, true, true, true, false, false, false, '🏦', 6, true)
    ON CONFLICT DO NOTHING;

    -- Débito Automático
    INSERT INTO payment_methods (user_id, name, type, slug, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Débito Automático', 'AUTOMATIC', 'automatic-' || p_user_id::text, false, true, false, true, false, false, false, '🔄', 7, true)
    ON CONFLICT DO NOTHING;

    -- Transferência Interna
    INSERT INTO payment_methods (user_id, name, type, slug, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Transferência Interna', 'INTERNAL_TRANSFER', 'internal-' || p_user_id::text, false, false, true, false, false, false, true, '🔄', 8, true)
    ON CONFLICT DO NOTHING;

    -- Outro
    INSERT INTO payment_methods (user_id, name, type, slug, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Outro', 'OTHER', 'other-' || p_user_id::text, true, true, false, true, false, false, false, '📝', 99, true)
    ON CONFLICT DO NOTHING;

END;
$$ LANGUAGE plpgsql;

-- Force update for existing users who might have 0 payment methods
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM auth.users LOOP
        PERFORM create_default_payment_methods(user_record.id);
    END LOOP;
END $$;
