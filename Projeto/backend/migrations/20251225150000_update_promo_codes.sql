-- Ensure Promo Codes Table Exists
CREATE TABLE IF NOT EXISTS public.promo_codes (
    code VARCHAR(50) PRIMARY KEY,
    plan_type VARCHAR(20) NOT NULL, -- 'premium', 'premium_ia'
    duration_days INT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    usage_limit INT DEFAULT 999999,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert new user requested codes (Case Insensitive logic handled in app, stored uppercase here)
INSERT INTO public.promo_codes (code, plan_type, duration_days, active, usage_limit) VALUES
('PREMIUM14', 'premium', 14, TRUE, 999999),
('IA7', 'premium_ia', 7, TRUE, 999999)
ON CONFLICT (code) DO UPDATE 
SET plan_type = EXCLUDED.plan_type, duration_days = EXCLUDED.duration_days, active = TRUE;

-- Ensure users table has subscription fields needed for logic
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS redeemed_promo_codes TEXT[] DEFAULT '{}';
