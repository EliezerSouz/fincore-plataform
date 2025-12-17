-- Add missing date columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_due_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;
