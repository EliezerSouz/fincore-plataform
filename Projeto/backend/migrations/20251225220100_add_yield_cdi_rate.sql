-- Add yield_cdi_rate column to store CDI percentage separately from yield_rate
-- This avoids constraint violations since yield_rate has a 0-100 check constraint
-- but CDI rates can be >100 (e.g., 105%, 120%)

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS yield_cdi_rate FLOAT DEFAULT 0;

COMMENT ON COLUMN accounts.yield_cdi_rate IS 'Percentage of CDI for yield calculation (e.g., 100, 105, 120)';
