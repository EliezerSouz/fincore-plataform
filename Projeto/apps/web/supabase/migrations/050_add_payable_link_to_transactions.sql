-- Migration: Add payable_id to transactions table
-- Description: Adds a foreign key column to link transactions with payables (accounts payable)
-- This enables precise tracking of payable payment transactions

-- Add the column
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS payable_id UUID NULL;

-- Add foreign key constraint
ALTER TABLE transactions
ADD CONSTRAINT fk_transactions_payable
FOREIGN KEY (payable_id)
REFERENCES payables(id)
ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_payable_id
ON transactions(payable_id)
WHERE payable_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN transactions.payable_id IS 'Links transaction to a payable (for payable payment tracking)';
