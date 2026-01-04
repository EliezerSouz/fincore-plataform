-- =====================================================
-- FIX: GARANTIR PERMISSÕES PARA SUPABASE AUTH
-- =====================================================

-- O Supabase Auth precisa de permissões especiais para criar usuários
-- Vamos garantir que o service_role tenha todas as permissões

-- 1. Garantir que service_role pode inserir em users
GRANT ALL ON TABLE public.users TO service_role;
GRANT ALL ON TABLE public.users TO postgres;

-- 2. Garantir que authenticated pode ler seus próprios dados
GRANT SELECT ON TABLE public.users TO authenticated;

-- 3. Garantir que anon pode fazer signup (necessário para o fluxo de registro)
GRANT USAGE ON SCHEMA public TO anon;

-- 4. Temporariamente, desabilitar RLS para testar
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 5. Verificar permissões
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY grantee, privilege_type;

-- =====================================================
-- TESTE AGORA
-- =====================================================

-- Tente fazer signup novamente
-- Deve funcionar agora!

-- =====================================================
-- DEPOIS QUE FUNCIONAR
-- =====================================================

-- Reabilite o RLS:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- E ajuste as policies conforme necessário

-- =====================================================
-- FIM DO FIX
-- =====================================================
