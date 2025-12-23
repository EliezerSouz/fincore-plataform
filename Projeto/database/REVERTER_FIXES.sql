-- =====================================================
-- REVERTER MIGRATIONS 011, 012, 013 (FIXES TEMPORÁRIOS)
-- =====================================================

-- Este script desfaz as alterações das migrations de "fix"
-- e restaura o banco para o estado limpo das migrations 001-010

-- =====================================================
-- REVERTER MIGRATION 013: Reabilitar RLS
-- =====================================================

-- Reabilitar RLS na tabela users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Verificar
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'users';
-- Esperado: rowsecurity = true

-- =====================================================
-- REVERTER MIGRATION 012: Recriar FOREIGN KEY
-- =====================================================

-- Recriar a FOREIGN KEY para auth.users
ALTER TABLE public.users 
ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verificar
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conname = 'users_id_fkey';
-- Esperado: constraint existe

-- =====================================================
-- REVERTER MIGRATION 011: Remover trigger problemático
-- =====================================================

-- Dropar o trigger que criamos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Dropar a função
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Verificar
SELECT 
    trigger_name
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
-- Esperado: 0 rows (trigger não existe mais)

-- =====================================================
-- ESTADO FINAL
-- =====================================================

-- Agora o banco está no estado LIMPO das migrations 001-010:
-- ✅ RLS habilitado
-- ✅ FOREIGN KEY para auth.users
-- ✅ SEM trigger problemático

-- =====================================================
-- OBSERVAÇÃO IMPORTANTE
-- =====================================================

-- SEM o trigger, usuários NÃO serão criados automaticamente
-- em public.users quando fizerem signup.

-- SOLUÇÃO:
-- 1. Criar usuários via Supabase Dashboard
-- 2. Criar registro manualmente em public.users
-- 3. OU implementar trigger correto depois

-- =====================================================
-- PRÓXIMO PASSO
-- =====================================================

-- Agora você pode:
-- 1. Testar o sistema com usuários criados manualmente
-- 2. Investigar o problema de signup com calma
-- 3. Implementar solução correta depois

-- =====================================================
-- FIM DA REVERSÃO
-- =====================================================
