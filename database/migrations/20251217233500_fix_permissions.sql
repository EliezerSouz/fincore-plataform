-- Fix permissions for account_balance_adjustments table
-- Error 42501 occurred because 'authenticated' role was not granted access to the table

GRANT ALL ON TABLE account_balance_adjustments TO authenticated;
GRANT ALL ON TABLE account_balance_adjustments TO service_role;

-- Ensure RLS is enabled
ALTER TABLE account_balance_adjustments ENABLE ROW LEVEL SECURITY;

-- Re-apply policies just in case (using IF NOT EXISTS logic via DO block or just relying on existing migration)
-- For safety, we just allow the GRANTS here. The previous migration created the policies.
