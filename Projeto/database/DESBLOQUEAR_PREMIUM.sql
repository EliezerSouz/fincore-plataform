-- =====================================================
-- DESBLOQUEAR TUDO PARA TESTES
-- =====================================================

-- Este script força todos os usuários a terem acesso PREMIUM_IA
-- durante a fase de testes, removendo qualquer bloqueio

-- 1. Atualizar usuário atual para premium_ia
UPDATE public.users
SET 
    subscription_plan = 'premium_ia',
    subscription_status = 'active',
    base_plan = 'premium_ia',
    is_temp_access = false,
    trial_ends_at = NOW() + INTERVAL '365 days',
    subscription_started_at = NOW(),
    subscription_ends_at = NOW() + INTERVAL '365 days'
WHERE id = '37397337-8fb8-465f-812a-2cefbc96ae42';

-- 2. Verificar
SELECT 
    id,
    email,
    subscription_plan,
    subscription_status,
    base_plan
FROM public.users
WHERE id = '37397337-8fb8-465f-812a-2cefbc96ae42';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================

/*
Deve mostrar:
- subscription_plan: premium_ia
- subscription_status: active
- base_plan: premium_ia

Agora o usuário tem ACESSO TOTAL a todas as funcionalidades!
*/

-- =====================================================
-- PARA APLICAR A TODOS OS USUÁRIOS (OPCIONAL)
-- =====================================================

/*
-- Se quiser desbloquear para TODOS os usuários:
UPDATE public.users
SET 
    subscription_plan = 'premium_ia',
    subscription_status = 'active',
    base_plan = 'premium_ia',
    trial_ends_at = NOW() + INTERVAL '365 days',
    subscription_ends_at = NOW() + INTERVAL '365 days'
WHERE deleted_at IS NULL;
*/

-- =====================================================
-- FIM
-- =====================================================
