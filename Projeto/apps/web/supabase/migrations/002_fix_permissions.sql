-- =====================================================
-- CORREÇÃO DE PERMISSÕES (GRANT)
-- Execute este script para resolver erros de "permission denied"
-- =====================================================

-- 1. Garantir uso do schema public
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Garantir permissões na tabela users
-- O RLS continuará restringindo QUAL linha pode ser editada (apenas a sua)
-- Mas o GRANT permite que a ação de UPDATE seja tentada.
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;
GRANT ALL ON TABLE public.users TO postgres;

-- 3. Garantir permissões em sequências e funções (preventivo)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated;

-- Confirmação
COMMENT ON TABLE public.users IS 'Tabela de usuários com permissões GRANT aplicadas';
