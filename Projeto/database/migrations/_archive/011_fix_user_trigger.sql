-- =====================================================
-- FIX: TRIGGER DE CRIAÇÃO AUTOMÁTICA DE USUÁRIO
-- =====================================================

-- Este trigger deve ser executado APÓS a criação de um usuário no auth.users
-- para criar automaticamente o registro correspondente em public.users

-- 1. Dropar função antiga se existir
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Criar a função SIMPLIFICADA que será chamada pelo trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir usuário com valores mínimos necessários
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
        false,
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro mas não falha o signup
        RAISE WARNING 'Erro ao criar usuário em public.users: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Dropar trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. Criar o trigger no schema auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. Verificar se o trigger foi criado
SELECT 
    trigger_name,
    event_object_schema,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- =====================================================
-- TESTE MANUAL (OPCIONAL)
-- =====================================================

-- Para testar se o trigger está funcionando, você pode:
-- 1. Criar um usuário de teste via Supabase Dashboard
-- 2. Verificar se ele aparece em public.users

-- SELECT * FROM public.users ORDER BY created_at DESC LIMIT 5;

-- =====================================================
-- FIM DO FIX
-- =====================================================

