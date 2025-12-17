-- Add missing billing_cycle column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly';
