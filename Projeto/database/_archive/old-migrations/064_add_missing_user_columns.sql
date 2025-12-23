-- =====================================================
-- MIGRATION: 064
-- Adiciona colunas faltantes na tabela users para suportar o backend Go
-- Focada em Promo Codes e Assinatura
-- =====================================================

DO $$ 
BEGIN 

    -- 1. Promo Codes e Acesso Temporário
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'used_promo_code') THEN
        ALTER TABLE public.users ADD COLUMN used_promo_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_temp_access') THEN
        ALTER TABLE public.users ADD COLUMN is_temp_access BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'temp_access_expires_at') THEN
        ALTER TABLE public.users ADD COLUMN temp_access_expires_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'temp_access_origin') THEN
        ALTER TABLE public.users ADD COLUMN temp_access_origin TEXT;
    END IF;

    -- 2. Planos e Ciclos (Compatibilidade Backend)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'base_plan') THEN
        ALTER TABLE public.users ADD COLUMN base_plan TEXT DEFAULT 'free';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'billing_cycle') THEN
        ALTER TABLE public.users ADD COLUMN billing_cycle TEXT DEFAULT 'monthly';
    END IF;

    -- 3. Datas de Assinatura (Mapeamento Go: SubscriptionStartDate vs DB: subscription_started_at)
    -- O backend espera 'subscription_start_date', 'subscription_end_date', 'subscription_due_date'
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_start_date') THEN
        ALTER TABLE public.users ADD COLUMN subscription_start_date TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_end_date') THEN
        ALTER TABLE public.users ADD COLUMN subscription_end_date TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_due_date') THEN
        ALTER TABLE public.users ADD COLUMN subscription_due_date TIMESTAMPTZ;
    END IF;
    
    -- 4. Primary Card (Já deve ter sido adicionado no 049, mas garantindo)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'primary_credit_card_id') THEN
         ALTER TABLE public.users ADD COLUMN primary_credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'primary_card_locked') THEN
         ALTER TABLE public.users ADD COLUMN primary_card_locked BOOLEAN DEFAULT false;
    END IF;

END $$;
