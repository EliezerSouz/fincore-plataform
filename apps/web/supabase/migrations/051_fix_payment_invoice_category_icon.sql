-- PASSO 1: Verificar o nome exato da categoria
SELECT id, name, icon, color 
FROM categories 
WHERE name ILIKE '%fatura%' OR name ILIKE '%pagamento%';

-- PASSO 2: Atualizar o ícone (ajuste o nome se necessário)
UPDATE categories
SET icon = 'credit-card'
WHERE name = 'Pagamento de Fatura';

-- PASSO 3: Verificar se foi atualizado
SELECT id, name, icon, color 
FROM categories 
WHERE name = 'Pagamento de Fatura';
