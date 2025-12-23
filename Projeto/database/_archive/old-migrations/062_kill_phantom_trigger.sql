-- Remover trigger e função problemática que está bloqueando o cadastro
DROP TRIGGER IF EXISTS trigger_auto_create_payment_methods ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.auto_create_payment_methods() CASCADE;

-- Garantia extra: remover qualquer outro trigger antigo que possa estar no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
