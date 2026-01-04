-- =====================================================
-- TRIGGER COMPLETO: Criar Usuário + Dados Padrão
-- =====================================================

-- Este trigger é executado quando um usuário faz signup
-- e cria automaticamente:
-- 1. Registro em public.users
-- 2. Categorias padrão
-- 3. Métodos de pagamento padrão

-- =====================================================
-- PARTE 1: Função do Trigger
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- 1. Criar registro em public.users
    INSERT INTO public.users (
        id,
        full_name,
        email,
        subscription_plan,
        subscription_status,
        trial_ends_at,
        email_verified,
        is_active
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        'free',
        'trial',
        NOW() + INTERVAL '14 days',
        NEW.email_confirmed_at IS NOT NULL,
        true
    );

    -- 2. Criar categorias padrão
    PERFORM create_default_categories(NEW.id);

    -- 3. Criar métodos de pagamento padrão
    PERFORM create_default_payment_methods(NEW.id);

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro mas não falha o signup
        RAISE WARNING 'Erro ao criar dados padrão para usuário %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- =====================================================
-- PARTE 2: Criar o Trigger
-- =====================================================

-- Dropar trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger novo
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- PARTE 3: Verificação
-- =====================================================

-- Verificar se o trigger foi criado
SELECT 
    trigger_name,
    event_object_schema,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- =====================================================
-- PARTE 4: Criar Dados Padrão para Usuário Existente
-- =====================================================

-- Se você já tem um usuário criado e quer adicionar os dados padrão:
/*
DO $$
DECLARE
    v_user_id UUID := 'SEU_USER_ID_AQUI';  -- Substitua pelo UUID do usuário
BEGIN
    -- Criar categorias
    PERFORM create_default_categories(v_user_id);
    
    -- Criar métodos de pagamento
    PERFORM create_default_payment_methods(v_user_id);
    
    RAISE NOTICE 'Dados padrão criados para usuário %', v_user_id;
END $$;
*/

-- =====================================================
-- TESTE
-- =====================================================

-- Para testar, crie um novo usuário via signup
-- Depois verifique se foi criado:

-- SELECT * FROM public.users ORDER BY created_at DESC LIMIT 1;
-- SELECT * FROM categories WHERE user_id = 'USER_ID_AQUI';
-- SELECT * FROM payment_methods WHERE user_id = 'USER_ID_AQUI';

-- =====================================================
-- FIM
-- =====================================================
