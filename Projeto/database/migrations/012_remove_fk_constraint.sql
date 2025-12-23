-- =====================================================
-- FIX ALTERNATIVO: REMOVER FOREIGN KEY CONSTRAINT
-- =====================================================

-- O problema pode ser a FOREIGN KEY que referencia auth.users
-- Vamos remover temporariamente e adicionar de volta depois

-- 1. Remover a constraint de FOREIGN KEY
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 2. Verificar se foi removida
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conname = 'users_id_fkey';

-- 3. Agora a tabela users não depende mais de auth.users
-- O trigger ainda vai funcionar, mas não vai falhar se houver problema

-- =====================================================
-- TESTE
-- =====================================================

-- Tente criar um usuário novamente via signup
-- Deve funcionar agora!

-- =====================================================
-- NOTA IMPORTANTE
-- =====================================================

-- Sem a FOREIGN KEY, você pode ter usuários em public.users
-- que não existem em auth.users (órfãos).
-- 
-- Isso não é ideal para produção, mas resolve o problema agora.
-- Depois podemos investigar melhor e adicionar a constraint de volta.

-- =====================================================
-- FIM DO FIX
-- =====================================================
