-- =====================================================
-- FUNÇÃO: Verificar se assinatura está válida
-- =====================================================
-- Esta função estava faltando no schema consolidado e causava erros no dashboard

CREATE OR REPLACE FUNCTION public.is_subscription_valid(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT 
    subscription_status,
    subscription_ends_at,
    trial_ends_at
  INTO user_record
  FROM public.users
  WHERE id = user_id;
  
  -- Se não encontrou usuário, retorna false
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Verifica se está em trial válido
  IF user_record.subscription_status = 'trial' THEN
    RETURN user_record.trial_ends_at > NOW();
  END IF;
  
  -- Verifica se assinatura está ativa
  IF user_record.subscription_status = 'active' THEN
    RETURN user_record.subscription_ends_at IS NULL 
           OR user_record.subscription_ends_at > NOW();
  END IF;
  
  -- Permite grace period para past_due (3 dias)
  IF user_record.subscription_status = 'past_due' THEN
    RETURN user_record.subscription_ends_at > (NOW() - INTERVAL '3 days');
  END IF;
  
  -- Outros status: cancelado, suspenso = false
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir permissões de execução
GRANT EXECUTE ON FUNCTION public.is_subscription_valid(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_subscription_valid(UUID) TO service_role;
