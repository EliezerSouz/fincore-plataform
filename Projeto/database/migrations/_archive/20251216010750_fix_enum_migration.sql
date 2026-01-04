-- Create new enum type V2 including 'trial' just in case data is dirty
CREATE TYPE subscription_plan_type_v2 AS ENUM ('free', 'basic', 'premium', 'premium_ia', 'enterprise', 'trial');

-- Pre-clean data: Convert any existing 'trial' plans to 'free' (IF that was the intent, or keep it if trial is a plan)
-- Based on error, some users have 'trial' as a plan. Assuming we want to migrate them or allow it.
-- If 'trial' is a status but was saved in plan column by mistake, we fix it to 'free'.
UPDATE public.users SET subscription_plan = 'free' WHERE subscription_plan::text = 'trial';
UPDATE public.users SET base_plan = 'free' WHERE base_plan::text = 'trial';

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

-- Drop old enum
DROP TYPE IF EXISTS subscription_plan_type;
