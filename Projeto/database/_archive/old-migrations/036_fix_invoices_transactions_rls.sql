-- =====================================================
-- FIX: Políticas RLS para credit_card_invoices
-- =====================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view own invoices" ON public.credit_card_invoices;
DROP POLICY IF EXISTS "Users can insert own invoices" ON public.credit_card_invoices;
DROP POLICY IF EXISTS "Users can update own invoices" ON public.credit_card_invoices;
DROP POLICY IF EXISTS "Users can delete own invoices" ON public.credit_card_invoices;

-- Garantir que RLS está habilitado
ALTER TABLE public.credit_card_invoices ENABLE ROW LEVEL SECURITY;

-- Recriar políticas
CREATE POLICY "Users can view own invoices"
ON public.credit_card_invoices
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices"
ON public.credit_card_invoices
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
ON public.credit_card_invoices
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
ON public.credit_card_invoices
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Garantir permissões
GRANT ALL ON public.credit_card_invoices TO authenticated;
GRANT ALL ON public.credit_card_invoices TO service_role;

-- =====================================================
-- FIX: Políticas RLS para credit_card_transactions
-- =====================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view own cc transactions" ON public.credit_card_transactions;
DROP POLICY IF EXISTS "Users can insert own cc transactions" ON public.credit_card_transactions;
DROP POLICY IF EXISTS "Users can update own cc transactions" ON public.credit_card_transactions;
DROP POLICY IF EXISTS "Users can delete own cc transactions" ON public.credit_card_transactions;

-- Garantir que RLS está habilitado
ALTER TABLE public.credit_card_transactions ENABLE ROW LEVEL SECURITY;

-- Recriar políticas
CREATE POLICY "Users can view own cc transactions"
ON public.credit_card_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cc transactions"
ON public.credit_card_transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cc transactions"
ON public.credit_card_transactions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cc transactions"
ON public.credit_card_transactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Garantir permissões
GRANT ALL ON public.credit_card_transactions TO authenticated;
GRANT ALL ON public.credit_card_transactions TO service_role;
