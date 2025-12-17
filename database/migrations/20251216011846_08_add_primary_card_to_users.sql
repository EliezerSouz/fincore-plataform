-- Migration: Add primary_credit_card_id to users table
-- Description: Stores the user's selected primary credit card (for Free plan users)
-- This ensures the selection is synchronized across all devices

-- Add the column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS primary_credit_card_id UUID NULL;

-- Add foreign key constraint
ALTER TABLE users
ADD CONSTRAINT fk_users_primary_card
FOREIGN KEY (primary_credit_card_id)
REFERENCES credit_cards(id)
ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_primary_card
ON users(primary_credit_card_id)
WHERE primary_credit_card_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN users.primary_credit_card_id IS 'The primary/active credit card for Free plan users (synchronized across devices)';

-- Add flag to track if selection has been locked (one-time choice)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS primary_card_locked BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN users.primary_card_locked IS 'Indicates if the primary card selection has been permanently locked (Free plan)';
