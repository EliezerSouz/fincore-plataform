ALTER TABLE payables ADD COLUMN recurrence_id UUID;
CREATE INDEX idx_payables_recurrence_id ON payables(recurrence_id);
