-- =====================================================
-- DIAGNÓSTICO COMPLETO DO PROBLEMA DE SIGNUP
-- =====================================================

-- Execute cada query abaixo INDIVIDUALMENTE para diagnosticar

-- 1. Verificar se a tabela users existe e está acessível
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'users';

-- 2. Verificar estrutura da tabela users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Verificar constraints da tabela users
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass;

-- 4. Verificar se o trigger existe
SELECT 
    trigger_name,
    event_object_schema,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 5. Verificar permissões da tabela users
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'users';

-- 6. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- 7. Verificar policies da tabela users
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- 8. Tentar inserir um usuário manualmente (TESTE)
-- IMPORTANTE: Substitua o UUID por um válido
/*
INSERT INTO public.users (
    id, 
    full_name, 
    email, 
    subscription_plan, 
    subscription_status,
    email_verified,
    is_active
)
VALUES (
    gen_random_uuid(),
    'Teste Manual',
    'teste@teste.com',
    'free',
    'trial',
    false,
    true
);
*/

-- 9. Verificar se há usuários na tabela
SELECT COUNT(*) as total_users FROM public.users;

-- 10. Verificar logs de erro (se disponível)
-- Infelizmente, logs detalhados só estão disponíveis no plano pago do Supabase

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================

/*
Se tudo estiver OK, você deve ver:
1. Tabela users existe
2. Colunas corretas
3. Trigger on_auth_user_created existe
4. RLS habilitado (rowsecurity = true)
5. Policies existem

Se algo estiver faltando, me avise!
*/

-- =====================================================
-- FIM DO DIAGNÓSTICO
-- =====================================================
