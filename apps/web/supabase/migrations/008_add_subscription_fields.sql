-- Atualizar tabela users para bater com lib/user.ts e SaaS logic
DO $$ 
BEGIN 
    -- subscription_plan
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_plan') THEN
        ALTER TABLE public.users ADD COLUMN subscription_plan TEXT DEFAULT 'free';
    END IF;

    -- subscription_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_status') THEN
        ALTER TABLE public.users ADD COLUMN subscription_status TEXT DEFAULT 'trial';
    END IF;

    -- trial_ends_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'trial_ends_at') THEN
        ALTER TABLE public.users ADD COLUMN trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + interval '14 days');
    END IF;
    
    -- stripe integration fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE public.users ADD COLUMN stripe_customer_id TEXT;
        ALTER TABLE public.users ADD COLUMN stripe_subscription_id TEXT;
    END IF;
END $$;

-- Atualizar users existentes para Trial Premium se estiverem nulos
UPDATE public.users 
SET 
  subscription_plan = 'premium',
  subscription_status = 'trial',
  trial_ends_at = (NOW() + interval '14 days')
WHERE subscription_plan IS NULL OR subscription_plan = 'free';

-- Função helper atualizada
CREATE OR REPLACE FUNCTION public.is_premium(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id 
    AND (
      (subscription_status = 'trial' AND trial_ends_at > NOW()) OR
      (subscription_status = 'active') OR
      (subscription_plan IN ('premium', 'enterprise') AND subscription_status = 'active')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
