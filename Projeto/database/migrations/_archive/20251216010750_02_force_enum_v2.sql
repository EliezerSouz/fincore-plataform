-- Create new enum type with a different name to avoid conflicts/cache
CREATE TYPE subscription_plan_type_v2 AS ENUM ('free', 'basic', 'premium', 'premium_ia', 'enterprise');

-- Alter table to use new enum
ALTER TABLE public.users 
    ALTER COLUMN subscription_plan DROP DEFAULT,
    ALTER COLUMN subscription_plan TYPE subscription_plan_type_v2 
    USING (subscription_plan::text::subscription_plan_type_v2),
    ALTER COLUMN subscription_plan SET DEFAULT 'free';

ALTER TABLE public.users 
    ALTER COLUMN base_plan DROP DEFAULT,
    ALTER COLUMN base_plan TYPE subscription_plan_type_v2 
    USING (base_plan::text::subscription_plan_type_v2),
    ALTER COLUMN base_plan SET DEFAULT 'free';

-- Drop old enum if possible (ignore if fails due to dependencies)
DROP TYPE IF EXISTS subscription_plan_type;
