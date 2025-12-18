-- Fix permissions and policies for account_balance_adjustments safely

-- 1. Enable RLS
ALTER TABLE account_balance_adjustments ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid "policy already exists" errors
DROP POLICY IF EXISTS "Users can view their own balance adjustments" ON account_balance_adjustments;
DROP POLICY IF EXISTS "Users can insert their own balance adjustments" ON account_balance_adjustments;
DROP POLICY IF EXISTS "Users can update their own balance adjustments" ON account_balance_adjustments;
DROP POLICY IF EXISTS "Users can delete their own balance adjustments" ON account_balance_adjustments;

-- 3. Recreate policies
CREATE POLICY "Users can view their own balance adjustments"
ON account_balance_adjustments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own balance adjustments"
ON account_balance_adjustments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own balance adjustments"
ON account_balance_adjustments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own balance adjustments"
ON account_balance_adjustments FOR DELETE
USING (auth.uid() = user_id);

-- 4. Grant permissions (The Fix for 42501)
GRANT ALL ON TABLE account_balance_adjustments TO authenticated;
GRANT ALL ON TABLE account_balance_adjustments TO service_role;
