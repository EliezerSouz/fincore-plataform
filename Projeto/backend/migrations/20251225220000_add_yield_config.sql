-- Add yield configuration fields to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS yield_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS yield_source VARCHAR(50) DEFAULT NULL;

-- Add unique constraint to prevent duplicate yields per day
ALTER TABLE liquidity_yields
ADD CONSTRAINT unique_account_date UNIQUE (account_id, date);

-- Comment for clarity
COMMENT ON COLUMN accounts.yield_enabled IS 'Indicates if the account generates liquidity yields';
COMMENT ON COLUMN accounts.yield_source IS 'Source of yield calculation (e.g., CDI, SELIC)';
COMMENT ON TABLE liquidity_yields IS 'Daily liquidity yield records - NOT financial transactions';
