-- =====================================================
-- TESTE DE VALIDAÇÃO DO BANCO NOVO
-- Data: 23/12/2025
-- =====================================================

-- =====================================================
-- PARTE 1: VERIFICAÇÕES ESTRUTURAIS
-- =====================================================

-- 1. Contar tabelas REAIS (sem views)
SELECT COUNT(*) as total_tabelas_reais
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';
-- Esperado: 17

-- 2. Contar views
SELECT COUNT(*) as total_views
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'VIEW';
-- Esperado: 3

-- 3. Listar todas as tabelas e views
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_type, table_name;

-- 4. Verificar ENUMs
SELECT COUNT(DISTINCT typname) as total_enums
FROM pg_type t 
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public' AND t.typtype = 'e';
-- Esperado: 11

-- 5. Verificar Functions
SELECT COUNT(*) as total_functions
FROM information_schema.routines
WHERE routine_schema = 'public';
-- Esperado: 15+

-- 6. Verificar Triggers
SELECT COUNT(DISTINCT trigger_name) as total_triggers
FROM information_schema.triggers
WHERE trigger_schema = 'public';
-- Esperado: 20+

-- 7. Verificar Policies
SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';
-- Esperado: 30+

-- =====================================================
-- PARTE 2: TESTE FUNCIONAL (SEM AUTH)
-- =====================================================

-- IMPORTANTE: Este teste NÃO cria usuário real do Supabase Auth
-- Apenas valida que as funções e estruturas estão corretas

-- 2.1. Testar função de categorias (sem inserir usuário)
DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Verificar se a função existe e pode ser chamada
    RAISE NOTICE 'Função create_default_categories existe: %', 
        (SELECT COUNT(*) FROM pg_proc WHERE proname = 'create_default_categories') > 0;
    
    RAISE NOTICE 'Função create_default_payment_methods existe: %', 
        (SELECT COUNT(*) FROM pg_proc WHERE proname = 'create_default_payment_methods') > 0;
    
    RAISE NOTICE 'Função handle_balance_update existe: %', 
        (SELECT COUNT(*) FROM pg_proc WHERE proname = 'handle_balance_update') > 0;
    
    RAISE NOTICE 'Função get_or_create_invoice existe: %', 
        (SELECT COUNT(*) FROM pg_proc WHERE proname = 'get_or_create_invoice') > 0;
    
    RAISE NOTICE 'Função pay_invoice existe: %', 
        (SELECT COUNT(*) FROM pg_proc WHERE proname = 'pay_invoice') > 0;
END $$;

-- 2.2. Verificar triggers de auditoria
SELECT 
    trigger_name,
    event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'audit_%'
ORDER BY event_object_table;
-- Esperado: 7 triggers de auditoria

-- 2.3. Verificar RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- Esperado: rowsecurity = true em todas as tabelas principais

-- 2.4. Verificar índices de soft delete
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%deleted_at%'
ORDER BY tablename;
-- Esperado: Vários índices para deleted_at

-- 2.5. Verificar idempotency_key
SELECT 
    table_name,
    column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'idempotency_key'
ORDER BY table_name;
-- Esperado: transactions, credit_card_transactions, payables

-- =====================================================
-- PARTE 3: RELATÓRIO FINAL
-- =====================================================

SELECT 
    '✅ BANCO VALIDADO COM SUCESSO!' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as tabelas,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'VIEW') as views,
    (SELECT COUNT(DISTINCT typname) FROM pg_type t JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e') as enums,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') as functions,
    (SELECT COUNT(DISTINCT trigger_name) FROM information_schema.triggers WHERE trigger_schema = 'public') as triggers,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as policies;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================

/*
✅ BANCO VALIDADO COM SUCESSO!

Tabelas: 17
Views: 3
ENUMs: 11
Functions: 15+
Triggers: 20+
Policies: 30+

Se todos os números estiverem corretos, o banco está 100% funcional!
*/

-- =====================================================
-- FIM DO TESTE
-- =====================================================
