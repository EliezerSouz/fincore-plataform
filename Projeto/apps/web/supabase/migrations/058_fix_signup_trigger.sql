-- Fix signup trigger to explicitly set valid defaults
-- This avoids issues with table default values being incorrect or out of sync

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    phone,
    subscription_plan,
    subscription_status,
    subscription_started_at,
    is_active,
    email_verified,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.raw_user_meta_data->>'phone',
    'free',    -- Explicitly set to 'free' (must exist in ENUM)
    'trial',   -- Explicitly set to 'trial' (must exist in ENUM)
    NOW(),
    true,
    false,
    false
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error to Postgres logs (visible in Supabase dashboard)
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    -- Re-raise to fail the transaction
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
