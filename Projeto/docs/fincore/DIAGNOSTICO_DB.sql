-- ==============================================================================
-- SCRIPT DE DIAGNÓSTICO (DUMP ESTRUTURAL)
-- Execute este script no Supabase SQL Editor para extrair o estado atual do banco
-- ==============================================================================

-- 1. ESTRUTURA DA TABELA PUBLIC.USERS
-- Verifica colunas, tipos e valores padrão (default values)
SELECT 
    'public.users' as table_name,
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. DEFINIÇÃO DOS ENUMS
-- Verifica quais valores são aceitos nos campos de assinatura
SELECT t.typname as enum_name, e.enumlabel as value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('subscription_plan', 'subscription_status')
ORDER BY t.typname, e.enumsortorder;

-- 3. TRIGGERS ATIVOS (Foco no auth.users)
-- Mostra todos os gatilhos que disparam quando um usuário é criado
SELECT 
    event_object_schema as schema,
    event_object_table as table,
    trigger_name,
    event_manipulation as event,
    action_statement as definition,
    action_timing as timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users';

-- 4. CÓDIGO FONTE DA FUNÇÃO HANDLE_NEW_USER
-- Mostra exatamente o que o banco está tentando executar
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as source_code
FROM pg_proc p
WHERE p.proname = 'handle_new_user';
