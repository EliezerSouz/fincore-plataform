-- 1. Add missing values to account_type enum
-- Using a DO block to handle "ALTER TYPE ... ADD VALUE" safely in transactions/scripts if needed, 
-- though straight ALTER TYPE usually works. IF NOT EXISTS is not supported directly in ADD VALUE for older Postgres, 
-- but Supabase/Postgres 12+ supports it. We'll use the safe approach.

ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'digital';
ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'reserva_emergencia';
ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'vale_alimentacao';
ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'internacional';

-- 2. Restore/Ensure Payment Methods Trigger
-- We use a wrapper trigger function to call the logic
CREATE OR REPLACE FUNCTION public.trigger_setup_payment_methods()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the function defined in previous migration
  PERFORM public.create_default_payment_methods(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop any potential conflicting triggers
DROP TRIGGER IF EXISTS on_user_created_payment_methods ON auth.users;
DROP TRIGGER IF EXISTS trigger_auto_create_payment_methods ON auth.users;

-- Create the trigger
CREATE TRIGGER on_user_created_payment_methods
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.trigger_setup_payment_methods();

-- 3. Run for existing users just in case (Idempotent due to ON CONFLICT in the function)
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM auth.users LOOP
        PERFORM create_default_payment_methods(user_record.id);
    END LOOP;
END $$;
