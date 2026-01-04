-- Migration: Add pocket_id to account_balance_adjustments
-- This allows balance adjustments to be associated with pockets instead of just accounts

-- Add pocket_id column (nullable for backward compatibility)
ALTER TABLE account_balance_adjustments 
ADD COLUMN IF NOT EXISTS pocket_id UUID REFERENCES pockets(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_account_balance_adjustments_pocket_id 
ON account_balance_adjustments(pocket_id);

-- Make account_id nullable since we'll use pocket_id going forward
ALTER TABLE account_balance_adjustments 
ALTER COLUMN account_id DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN account_balance_adjustments.pocket_id IS 'Reference to pocket (new structure). Use this instead of account_id for new adjustments.';
