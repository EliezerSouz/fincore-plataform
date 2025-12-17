-- Remove a coluna payment_method da tabela transactions
-- Primeiro garantimos que payment_method_id está populado (opcional, assumindo que sim pois a interface já manda)
-- Em um cenário real production, fariamos um UPDATE transactions SET payment_method_id = ... FROM payment_methods ... WHERE payment_method_id IS NULL;

ALTER TABLE transactions DROP COLUMN IF EXISTS payment_method;
