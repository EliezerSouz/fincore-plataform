-- Fix payment_methods table to add unique constraint on slug
-- This prevents duplicate payment methods and allows ON CONFLICT to work properly

-- 1. First, clean up any duplicate slugs that might exist
DELETE FROM payment_methods a
USING payment_methods b
WHERE a.id > b.id
  AND a.slug = b.slug
  AND a.user_id = b.user_id;

-- 2. Add unique constraint on (user_id, slug)
-- This ensures each user can only have one payment method with a given slug
ALTER TABLE payment_methods 
ADD CONSTRAINT payment_methods_user_slug_unique 
UNIQUE (user_id, slug);

-- 3. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_slug 
ON payment_methods(user_id, slug);

-- 4. Update the create_default_payment_methods function to handle conflicts properly
CREATE OR REPLACE FUNCTION create_default_payment_methods(p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- PIX
    INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'PIX', 'pix-' || p_user_id::text, 'PIX', true, true, true, true, false, false, false, '⚡', 1, true)
    ON CONFLICT (user_id, slug) DO NOTHING;

    -- Dinheiro
    INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Dinheiro', 'cash-' || p_user_id::text, 'CASH', true, true, false, true, false, false, false, '💵', 2, true)
    ON CONFLICT (user_id, slug) DO NOTHING;
    
    -- Cartão de Crédito
    INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Cartão de Crédito', 'credit-card-' || p_user_id::text, 'CREDIT_CARD', false, true, false, false, true, true, false, '💳', 3, true)
    ON CONFLICT (user_id, slug) DO NOTHING;
    
    -- Cartão de Débito
    INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Cartão de Débito', 'debit-card-' || p_user_id::text, 'DEBIT_CARD', false, true, false, true, false, false, false, '💳', 4, true)
    ON CONFLICT (user_id, slug) DO NOTHING;

    -- Boleto
    INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Boleto', 'boleto-' || p_user_id::text, 'BOLETO', false, true, false, true, false, false, false, '📄', 5, true)
    ON CONFLICT (user_id, slug) DO NOTHING;

    -- Transferência Bancária
    INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Transferência Bancária', 'bank-transfer-' || p_user_id::text, 'BANK_TRANSFER', true, true, true, true, false, false, false, '🏦', 6, true)
    ON CONFLICT (user_id, slug) DO NOTHING;

    -- Débito Automático
    INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Débito Automático', 'automatic-' || p_user_id::text, 'AUTOMATIC', false, true, false, true, false, false, false, '🔄', 7, true)
    ON CONFLICT (user_id, slug) DO NOTHING;

    -- Transferência Interna
    INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Transferência Interna', 'internal-transfer-' || p_user_id::text, 'INTERNAL_TRANSFER', false, false, true, false, false, false, true, '🔄', 8, true)
    ON CONFLICT (user_id, slug) DO NOTHING;

    -- Outro
    INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Outro', 'other-' || p_user_id::text, 'OTHER', true, true, false, true, false, false, false, '📝', 99, true)
    ON CONFLICT (user_id, slug) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Ensure RLS is properly configured
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read system and own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can manage own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can view their own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can insert their own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can update their own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can delete their own payment methods" ON payment_methods;

-- Create comprehensive policies
CREATE POLICY "payment_methods_select_policy"
ON payment_methods FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR user_id IS NULL
);

CREATE POLICY "payment_methods_insert_policy"
ON payment_methods FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "payment_methods_update_policy"
ON payment_methods FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "payment_methods_delete_policy"
ON payment_methods FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 6. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON payment_methods TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
