-- Disable the automatic signup trigger to prevent "Database error saving new user"
-- We will rely on the application (Next.js Server Action) to create the user record safely.

-- 1. Drop the trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Ensure RLS allows the user to insert their own record (Server Action does this)
-- The existing policy "System can insert users" allows insertion, but let's make it safer if needed.
-- For now, we assume the existing policies from 001_create_users_table.sql are sufficient for the Server Action to work.
