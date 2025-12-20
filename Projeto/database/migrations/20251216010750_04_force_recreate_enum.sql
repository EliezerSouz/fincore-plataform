-- Recreate the enum type completely to ensure it has all values
BEGIN;
    -- Drop the default constraint using the enum
    ALTER TABLE public.users ALTER COLUMN subscription_plan DROP DEFAULT;

    -- Alter column to text temporarily
    ALTER TABLE public.users ALTER COLUMN subscription_plan TYPE VARCHAR(50);
    ALTER TABLE public.users ALTER COLUMN base_plan TYPE VARCHAR(50);

    -- Drop the old type
    DROP TYPE IF EXISTS subscription_plan;
    DROP TYPE IF EXISTS subscription_plan_type;

    -- Create new type with all values
    CREATE TYPE subscription_plan_type AS ENUM ('free', 'basic', 'premium', 'premium_ia', 'enterprise');

    -- Cast back to new enum type with explicit casting
    ALTER TABLE public.users 
        ALTER COLUMN subscription_plan TYPE subscription_plan_type 
        USING (subscription_plan::subscription_plan_type);

    ALTER TABLE public.users 
        ALTER COLUMN base_plan TYPE subscription_plan_type 
        USING (base_plan::subscription_plan_type);
        
    -- Restore default
    ALTER TABLE public.users ALTER COLUMN subscription_plan SET DEFAULT 'free';
    ALTER TABLE public.users ALTER COLUMN base_plan SET DEFAULT 'free';
COMMIT;
