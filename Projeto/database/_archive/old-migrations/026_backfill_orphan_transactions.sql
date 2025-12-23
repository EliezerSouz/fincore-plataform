-- Backfill para definir um método de pagamento padrão ('Outros') para transações antigas que estão NULL
-- Isso corrige o problema de "aparecer vazio" na edição de transações antigas

UPDATE transactions 
SET payment_method_id = (SELECT id FROM payment_methods WHERE slug = 'outros' LIMIT 1) 
WHERE payment_method_id IS NULL;
