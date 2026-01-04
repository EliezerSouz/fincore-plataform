CREATE OR REPLACE FUNCTION create_default_payment_methods(p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- PIX
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'PIX') THEN
        INSERT INTO payment_methods (user_id, name, type, slug, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'PIX', 'PIX', 'pix-' || p_user_id::text, true, true, true, true, false, false, false, '⚡', 1, true);
    END IF;

    -- Dinheiro
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'CASH') THEN
        INSERT INTO payment_methods (user_id, name, type, slug, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'Dinheiro', 'CASH', 'cash-' || p_user_id::text, true, true, false, true, false, false, false, '💵', 2, true);
    END IF;

    -- Cartão de Crédito
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'CREDIT_CARD') THEN
        INSERT INTO payment_methods (user_id, name, type, slug, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'Cartão de Crédito', 'CREDIT_CARD', 'credit-card-' || p_user_id::text, false, true, false, false, true, true, false, '💳', 3, true);
    END IF;
    
    -- Cartão de Débito
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'DEBIT_CARD') THEN
        INSERT INTO payment_methods (user_id, name, type, slug, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'Cartão de Débito', 'DEBIT_CARD', 'debit-card-' || p_user_id::text, false, true, false, true, false, false, false, '💳', 4, true);
    END IF;

    -- Boleto
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'BOLETO') THEN
        INSERT INTO payment_methods (user_id, name, type, slug, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'Boleto', 'BOLETO', 'boleto-' || p_user_id::text, false, true, false, true, false, false, false, '📄', 5, true);
    END IF;

    -- Transferência Bancária
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'BANK_TRANSFER') THEN
        INSERT INTO payment_methods (user_id, name, type, slug, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'Transferência Bancária', 'BANK_TRANSFER', 'bank-transfer-' || p_user_id::text, true, true, true, true, false, false, false, '🏦', 6, true);
    END IF;
END $$ LANGUAGE plpgsql;
