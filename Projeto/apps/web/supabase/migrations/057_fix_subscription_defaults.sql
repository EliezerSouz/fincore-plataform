-- Fix default value for subscription_plan in users table
-- Previous migration 001 had an invalid default 'trial' for the ENUM type

DO $$
BEGIN
    -- Check if users table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        -- Check if subscription_plan column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_plan') THEN
            -- Attempt to set default to 'free'
            -- We handle both ENUM and TEXT cases by casting if needed, but simple literal 'free' works for both usually
            -- However, to be safe with ENUMs, we should check the type
            
            -- If it's an ENUM, 'free' must be in the list (it is)
            ALTER TABLE public.users ALTER COLUMN subscription_plan SET DEFAULT 'free';
        END IF;
    END IF;
END $$;
