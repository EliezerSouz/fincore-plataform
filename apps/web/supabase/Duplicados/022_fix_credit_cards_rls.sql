-- =====================================================
-- FIX: Políticas RLS para credit_cards
-- =====================================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view own cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can insert own cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can update own cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can delete own cards" ON public.credit_cards;

-- Garantir que RLS está habilitado
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

-- Recriar políticas com sintaxe correta
CREATE POLICY "Users can view own cards"
ON public.credit_cards
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards"
ON public.credit_cards
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards"
ON public.credit_cards
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards"
ON public.credit_cards
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Garantir que a tabela tem as permissões corretas
GRANT ALL ON public.credit_cards TO authenticated;
GRANT ALL ON public.credit_cards TO service_role;
