-- Migration: Add credit_card_invoice_id to transactions table
-- Description: Adds a foreign key column to link transactions with credit card invoices
-- This enables precise tracking of invoice payment transactions

-- Add the column
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS credit_card_invoice_id UUID NULL;

-- Add foreign key constraint
ALTER TABLE transactions
ADD CONSTRAINT fk_transactions_invoice
FOREIGN KEY (credit_card_invoice_id)
REFERENCES credit_card_invoices(id)
ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_invoice_id
ON transactions(credit_card_invoice_id)
WHERE credit_card_invoice_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN transactions.credit_card_invoice_id IS 'Links transaction to a credit card invoice (for invoice payment tracking)';
