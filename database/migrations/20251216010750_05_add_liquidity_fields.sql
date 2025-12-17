ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS yield_rate FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_yield_date DATE;

CREATE TABLE IF NOT EXISTS liquidity_yields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    base_amount DECIMAL(15, 2) NOT NULL,
    yield_amount DECIMAL(15, 2) NOT NULL,
    rate_applied FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_liquidity_yields_account_date ON liquidity_yields(account_id, date);
