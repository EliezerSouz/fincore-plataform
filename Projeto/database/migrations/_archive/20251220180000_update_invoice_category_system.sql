-- Set is_system = true for "Pagamento de Fatura" categories
UPDATE categories 
SET is_system = true 
WHERE LOWER(name) IN ('pagamento de fatura', 'pagamento de faturas', 'faturas') 
AND type = 'despesa';
