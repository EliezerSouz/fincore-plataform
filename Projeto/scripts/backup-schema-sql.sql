-- =====================================================
-- BACKUP COMPLETO DO SCHEMA - FINCORE
-- Data: 23/12/2025
-- Método: SQL Dump via Supabase SQL Editor
-- =====================================================

-- INSTRUÇÕES:
-- 1. Acesse: https://supabase.com/dashboard
-- 2. Vá em: SQL Editor
-- 3. Copie e cole este script
-- 4. Execute
-- 5. Copie o resultado e salve em um arquivo .sql

-- =====================================================
-- PARTE 1: DUMP DE ENUMS
-- =====================================================

SELECT 
    'CREATE TYPE ' || n.nspname || '.' || t.typname || ' AS ENUM (' ||
    string_agg('''' || e.enumlabel || '''', ', ' ORDER BY e.enumsortorder) || ');' as create_enum
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
GROUP BY n.nspname, t.typname
ORDER BY t.typname;

-- =====================================================
-- PARTE 2: DUMP DE TABELAS (ESTRUTURA)
-- =====================================================

SELECT 
    'CREATE TABLE ' || schemaname || '.' || tablename || ' (' ||
    string_agg(
        column_name || ' ' || data_type ||
        CASE 
            WHEN character_maximum_length IS NOT NULL 
            THEN '(' || character_maximum_length || ')'
            ELSE ''
        END ||
        CASE 
            WHEN is_nullable = 'NO' THEN ' NOT NULL'
            ELSE ''
        END ||
        CASE 
            WHEN column_default IS NOT NULL 
            THEN ' DEFAULT ' || column_default
            ELSE ''
        END,
        ', '
    ) || ');' as create_table
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- =====================================================
-- PARTE 3: DUMP DE FUNÇÕES
-- =====================================================

SELECT 
    'CREATE OR REPLACE FUNCTION ' || n.nspname || '.' || p.proname || 
    '(' || pg_get_function_arguments(p.oid) || ') ' ||
    'RETURNS ' || pg_get_function_result(p.oid) || ' ' ||
    'LANGUAGE ' || l.lanname || ' ' ||
    CASE WHEN p.prosecdef THEN 'SECURITY DEFINER ' ELSE '' END ||
    'AS $' || 'function$' || chr(10) ||
    p.prosrc || chr(10) ||
    '$' || 'function$;' as create_function
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;

-- =====================================================
-- PARTE 4: DUMP DE TRIGGERS
-- =====================================================

SELECT 
    'CREATE TRIGGER ' || trigger_name || ' ' ||
    action_timing || ' ' ||
    string_agg(event_manipulation, ' OR ') || ' ' ||
    'ON ' || event_object_schema || '.' || event_object_table || ' ' ||
    'FOR EACH ROW ' ||
    action_statement || ';' as create_trigger
FROM information_schema.triggers
WHERE trigger_schema = 'public'
GROUP BY trigger_name, action_timing, event_object_schema, event_object_table, action_statement
ORDER BY trigger_name;

-- =====================================================
-- PARTE 5: DUMP DE POLICIES (RLS)
-- =====================================================

SELECT 
    'CREATE POLICY "' || policyname || '" ON ' || schemaname || '.' || tablename || ' ' ||
    'FOR ' || cmd || ' ' ||
    CASE WHEN qual IS NOT NULL THEN 'USING (' || qual || ') ' ELSE '' END ||
    CASE WHEN with_check IS NOT NULL THEN 'WITH CHECK (' || with_check || ')' ELSE '' END ||
    ';' as create_policy
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- FIM DO SCRIPT DE BACKUP
-- =====================================================
