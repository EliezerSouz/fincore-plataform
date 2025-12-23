-- =====================================================
-- SCRIPT DE APLICAÇÃO DE TODAS AS MIGRATIONS
-- Banco: FinCore Production (Novo)
-- Data: 23/12/2025
-- =====================================================

-- IMPORTANTE: Execute este script no SQL Editor do Supabase
-- OU execute cada migration individualmente na ordem correta

-- =====================================================
-- VERIFICAÇÃO INICIAL
-- =====================================================

-- Verificar versão do PostgreSQL
SELECT version();

-- Verificar extensões disponíveis
SELECT * FROM pg_available_extensions WHERE name IN ('uuid-ossp', 'pg_trgm', 'pgcrypto');

-- =====================================================
-- HABILITAR EXTENSÕES NECESSÁRIAS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Para busca textual

-- =====================================================
-- INSTRUÇÕES DE APLICAÇÃO
-- =====================================================

/*
OPÇÃO 1: Aplicar via SQL Editor do Supabase (RECOMENDADO)

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto "FinCore Production"
3. Vá em: SQL Editor
4. Para cada migration (001 a 010):
   a. Abra o arquivo da migration
   b. Copie todo o conteúdo
   c. Cole no SQL Editor
   d. Clique em "Run"
   e. Verifique se não há erros
   f. Passe para a próxima migration

ORDEM CORRETA:
1. 001_core_schema.sql
2. 002_accounts_and_transactions.sql
3. 003_categories.sql
4. 004_payment_methods.sql
5. 005_credit_cards.sql
6. 006_payables.sql
7. 007_investments.sql
8. 008_audit_system.sql
9. 009_idempotency_and_constraints.sql
10. 010_indexes_and_performance.sql

OPÇÃO 2: Aplicar via psql (Avançado)

psql -h db.XXXXXXX.supabase.co -U postgres -d postgres -f 001_core_schema.sql
psql -h db.XXXXXXX.supabase.co -U postgres -d postgres -f 002_accounts_and_transactions.sql
... (continuar para todas)

OPÇÃO 3: Aplicar via Supabase CLI (Intermediário)

supabase db push
*/

-- =====================================================
-- VERIFICAÇÃO PÓS-APLICAÇÃO
-- =====================================================

-- Após aplicar TODAS as migrations, execute estas queries para validar:

-- 1. Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Verificar ENUMs criados
SELECT t.typname as enum_name, string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;

-- 3. Verificar funções criadas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 4. Verificar triggers criados
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 5. Verificar policies (RLS)
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. Verificar índices criados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================

/*
Após aplicar todas as migrations, você deve ter:

✅ 17 tabelas
✅ 11 ENUMs
✅ 15+ funções
✅ 25+ triggers
✅ 30+ policies
✅ 80+ índices

Se algum número estiver diferente, revise as migrations aplicadas.
*/

-- =====================================================
-- TESTE RÁPIDO
-- =====================================================

-- Criar um usuário de teste (após aplicar todas as migrations)
-- Substitua 'SEU_USER_ID' por um UUID válido do auth.users

/*
-- 1. Inserir usuário de teste
INSERT INTO users (id, full_name, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'Usuário Teste', 'teste@fincore.com');

-- 2. Criar categorias padrão
SELECT create_default_categories('00000000-0000-0000-0000-000000000001');

-- 3. Criar métodos de pagamento padrão
SELECT create_default_payment_methods('00000000-0000-0000-0000-000000000001');

-- 4. Verificar se foi criado
SELECT * FROM users WHERE id = '00000000-0000-0000-0000-000000000001';
SELECT * FROM categories WHERE user_id = '00000000-0000-0000-0000-000000000001';
SELECT * FROM payment_methods WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- 5. Limpar teste
DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000000001';
*/

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
