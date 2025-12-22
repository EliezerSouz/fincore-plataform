-- =========================================================================================
-- SCRIPT DE EXTRAÇÃO COMPLETA DA ESTRUTURA DO BANCO (SCHEMA DUMP)
-- Execute este script no Supabase SQL Editor.
-- Ele retornará um JSON contendo toda a estrutura de Tabelas, Colunas, Triggers e Funções.
-- Copie o resultado da coluna "schema_dump" e cole aqui para análise.
-- =========================================================================================

SELECT json_build_object(
    'timestamp', NOW(),
    'tables', (
        SELECT json_agg(tbl) FROM (
            SELECT 
                t.table_schema, 
                t.table_name,
                (
                    SELECT json_agg(col) FROM (
                        SELECT 
                            column_name, 
                            data_type, 
                            udt_name, 
                            is_nullable, 
                            column_default 
                        FROM information_schema.columns 
                        WHERE table_schema = t.table_schema 
                        AND table_name = t.table_name
                        ORDER BY ordinal_position
                    ) col
                ) as columns,
                (
                    SELECT json_agg(pol) FROM (
                        SELECT policyname, cmd, qual, with_check
                        FROM pg_policies
                        WHERE schemaname = t.table_schema
                        AND tablename = t.table_name
                    ) pol
                ) as policies
            FROM information_schema.tables t
            WHERE t.table_schema IN ('public') 
            AND t.table_type = 'BASE TABLE'
        ) tbl
    ),
    'auth_triggers', (
        SELECT json_agg(tr) FROM (
            SELECT 
                event_object_schema, 
                event_object_table, 
                trigger_name, 
                action_statement, 
                action_timing, 
                event_manipulation
            FROM information_schema.triggers
            WHERE event_object_schema = 'auth'
            AND event_object_table = 'users'
        ) tr
    ),
    'public_triggers', (
        SELECT json_agg(tr) FROM (
            SELECT 
                event_object_schema, 
                event_object_table, 
                trigger_name, 
                action_statement, 
                action_timing, 
                event_manipulation
            FROM information_schema.triggers
            WHERE event_object_schema = 'public'
        ) tr
    ),
    'functions', (
        SELECT json_agg(f) FROM (
            SELECT 
                n.nspname as schema,
                p.proname as name,
                pg_get_functiondef(p.oid) as definition
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname IN ('public')
            AND p.proname NOT LIKE 'pg_%'
        ) f
    )
) as schema_dump;
