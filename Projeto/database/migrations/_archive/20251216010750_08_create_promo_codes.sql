-- Create Promo Codes Table
CREATE TABLE IF NOT EXISTS public.promo_codes (
    code VARCHAR(50) PRIMARY KEY,
    plan_type VARCHAR(20) NOT NULL, -- 'premium', 'premium_ia'
    duration_days INT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Global Promo Codes
INSERT INTO public.promo_codes (code, plan_type, duration_days, active) VALUES
('PREMIUM7', 'premium', 7, TRUE),
('IA5', 'premium_ia', 5, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Add used_promo_code to users to ensure one-time use per life policy
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS used_promo_code VARCHAR(50);

-- Function to get active plan (can be used for debugging or views)
CREATE OR REPLACE FUNCTION public.get_user_active_plan(user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    u_base_plan VARCHAR;
    u_is_temp BOOLEAN;
    u_temp_expires TIMESTAMPTZ;
    u_sub_plan VARCHAR;
BEGIN
    SELECT base_plan, is_temp_access, temp_access_expires_at, subscription_plan
    INTO u_base_plan, u_is_temp, u_temp_expires, u_sub_plan
    FROM public.users
    WHERE id = user_id;

    -- If temp access is active and not expired
    IF u_is_temp IS TRUE AND u_temp_expires > NOW() THEN
        RETURN u_sub_plan;
    END IF;

    -- Fallback to base plan (usually free, but could be paid sub)
    RETURN u_base_plan;
END;
$$ LANGUAGE plpgsql;
