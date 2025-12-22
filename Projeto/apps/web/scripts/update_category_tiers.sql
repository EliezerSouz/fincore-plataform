-- 1. Unmark all categories as system first (to ensure only the specific ones remain)
UPDATE categories 
SET is_system = false 
WHERE is_system = true;

-- 2. Mark ONLY specific categories as system
UPDATE categories 
SET is_system = true 
WHERE name ILIKE 'Pagamento de fatura' 
   OR name ILIKE 'Transferência' 
   OR name ILIKE 'Transferencia';

-- 3. Ensure Premium categories are correctly marked
UPDATE categories 
SET is_premium = true 
WHERE name ILIKE 'Compras' 
   OR name ILIKE 'Educação' 
   OR name ILIKE 'Educacao' 
   OR name ILIKE 'Saúde' 
   OR name ILIKE 'Saude';

-- 4. Ensure these Premium categories are NOT system (just in case)
UPDATE categories 
SET is_system = false 
WHERE name ILIKE 'Compras' 
   OR name ILIKE 'Educação' 
   OR name ILIKE 'Educacao' 
   OR name ILIKE 'Saúde' 
   OR name ILIKE 'Saude';
