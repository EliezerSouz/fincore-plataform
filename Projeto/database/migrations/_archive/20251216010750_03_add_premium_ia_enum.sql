-- Add all potential plan types to subscription_plan_type enum
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan_type') THEN
        ALTER TYPE subscription_plan_type ADD VALUE IF NOT EXISTS 'basic';
        ALTER TYPE subscription_plan_type ADD VALUE IF NOT EXISTS 'premium';
        ALTER TYPE subscription_plan_type ADD VALUE IF NOT EXISTS 'premium_ia';
        ALTER TYPE subscription_plan_type ADD VALUE IF NOT EXISTS 'enterprise';
    END IF;
END$$;
