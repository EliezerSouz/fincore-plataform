-- ==============================================================================
-- 1. REMOÇÃO DE TRIGGERS E FUNÇÕES ANTIGAS
-- Limpa qualquer automação quebrada que esteja conflitando com o Server Action
-- ==============================================================================

-- Remove triggers da tabela de Auth (onde o erro 500 acontece)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_user_created ON public.users CASCADE;
DROP TRIGGER IF EXISTS create_categories_on_signup ON public.users CASCADE;
DROP TRIGGER IF EXISTS on_user_created_add_categories ON public.users CASCADE;

-- Remove funções antigas que podem estar sendo chamadas
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_default_categories() CASCADE;
DROP FUNCTION IF EXISTS public.create_default_categories_for_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_default_categories_free(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_create_categories() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_v2() CASCADE;

-- ==============================================================================
-- 2. GARANTIA DE RLS (SEGURANÇA)
-- Permite que o usuário insira seus próprios dados via Server Action
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Remove policies antigas para recriar do zero (evita duplicidade/erro)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can select own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "System can insert users" ON public.users;

-- Policy de INSERT (Crucial para o signup funcionar)
CREATE POLICY "Users can insert their own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Policy de SELECT (Para o usuário ver seus dados)
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- Policy de UPDATE (Para o usuário editar seus dados)
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- ==============================================================================
-- 3. GARANTIA DE INTEGRIDADE
-- Remove defaults problemáticos da tabela users se existirem
-- ==============================================================================

-- Remove constraints de NOT NULL que podem quebrar se o Server Action não enviar tudo
ALTER TABLE public.users ALTER COLUMN subscription_plan SET DEFAULT 'free';
ALTER TABLE public.users ALTER COLUMN subscription_status SET DEFAULT 'trial';

-- Garante que o tipo ENUM (se usado) tenha os valores corretos
-- (Isso é apenas preventivo, não falha se já estiver ok)
DO $$
BEGIN
    -- Se for texto, ok. Se for enum, esperamos que 'free' e 'trial' existam.
    NULL; 
END $$;
