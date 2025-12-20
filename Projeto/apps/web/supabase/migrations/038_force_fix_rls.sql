-- =====================================================
-- FIX DEFINITIVO: Resetar RLS para credit_cards
-- =====================================================

-- 1. Desabilitar RLS temporariamente para limpar políticas
ALTER TABLE public.credit_cards DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes (limpeza total)
DROP POLICY IF EXISTS "Users can view own cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can insert own cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can update own cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can delete own cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Enable read access for own cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Enable insert for own cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Enable update for own cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Enable delete for own cards" ON public.credit_cards;

-- 3. Criar UMA ÚNICA política unificada (mais simples e segura)
-- "O usuário pode fazer TUDO se o user_id for dele"
CREATE POLICY "Users can manage own cards"
ON public.credit_cards
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Reabilitar RLS
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

-- 5. Garantir permissões básicas para o role "authenticated"
GRANT ALL ON public.credit_cards TO authenticated;
GRANT ALL ON public.credit_cards TO service_role;

-- 6. Log de confirmação
DO $$
BEGIN
    RAISE NOTICE 'RLS resetado com sucesso! Agora você deve conseguir excluir.';
END $$;
