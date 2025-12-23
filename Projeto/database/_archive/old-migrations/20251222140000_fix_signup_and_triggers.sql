-- 1. Ensure account_type has 'digital' (idempotent)
ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'digital';

-- 2. Fix create_default_payment_methods to use unique slugs
CREATE OR REPLACE FUNCTION create_default_payment_methods(p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- PIX
    INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'PIX', 'pix-' || p_user_id::text, 'PIX', true, true, true, true, false, false, false, '⚡', 1, true)
    ON CONFLICT DO NOTHING;

    -- Dinheiro
    INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Dinheiro', 'cash-' || p_user_id::text, 'CASH', true, true, false, true, false, false, false, '💵', 2, true)
    ON CONFLICT DO NOTHING;
    
    -- Cartão de Crédito
    INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Cartão de Crédito', 'credit-card-' || p_user_id::text, 'CREDIT_CARD', false, true, false, false, true, true, false, '💳', 3, true)
    ON CONFLICT DO NOTHING;
    
    -- Cartão de Débito
    INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Cartão de Débito', 'debit-card-' || p_user_id::text, 'DEBIT_CARD', false, true, false, true, false, false, false, '💳', 4, true)
    ON CONFLICT DO NOTHING;

    -- Boleto
    INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Boleto', 'boleto-' || p_user_id::text, 'BOLETO', false, true, false, true, false, false, false, '📄', 5, true)
    ON CONFLICT DO NOTHING;

    -- Transferência Bancária
    INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Transferência Bancária', 'bank-transfer-' || p_user_id::text, 'BANK_TRANSFER', true, true, true, true, false, false, false, '🏦', 6, true)
    ON CONFLICT DO NOTHING;

    -- Débito Automático
    INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Débito Automático', 'automatic-' || p_user_id::text, 'AUTOMATIC', false, true, false, true, false, false, false, '🔄', 7, true)
    ON CONFLICT DO NOTHING;

    -- Transferência Interna
    INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Transferência Interna', 'internal-transfer-' || p_user_id::text, 'INTERNAL_TRANSFER', false, false, true, false, false, true, '🔄', 8, true)
    ON CONFLICT DO NOTHING;

    -- Outro
    INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES (p_user_id, 'Outro', 'other-' || p_user_id::text, 'OTHER', true, true, false, true, false, false, false, '📝', 99, true)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 3. Restore handle_new_user (ensure public.users creation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    subscription_plan,
    subscription_status,
    is_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    'free',
    'trial',
    true
  )
  ON CONFLICT (id) DO NOTHING; -- Idempotency
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-enable trigger on auth.users for handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Trigger for payment methods on public.users (instead of auth.users)
-- Create wrapper function to call create_default_payment_methods from trigger
CREATE OR REPLACE FUNCTION public.trigger_setup_payment_methods()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_payment_methods(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_payment_methods ON auth.users; -- Remove old one
DROP TRIGGER IF EXISTS trigger_setup_payment_methods ON public.users;

CREATE TRIGGER trigger_setup_payment_methods
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.trigger_setup_payment_methods();
