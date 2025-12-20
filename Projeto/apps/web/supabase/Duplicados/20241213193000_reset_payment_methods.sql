-- 1. Limpa a tabela completamente (Cuidado: remove associações existentes se não tiver cascade, mas vamos forçar)
-- Usamos CASCADE para limpar referências órfãs se necessário, ou TRUNCATE
TRUNCATE TABLE payment_methods CASCADE;

-- 2. Insere os dados limpos e novos
INSERT INTO payment_methods (name, slug, type, allows_income, allows_expense, is_active) VALUES
('Dinheiro', 'dinheiro', 'dinheiro', true, true, true),
('Pix', 'pix', 'bancario', true, true, true),
('Cartão de Crédito', 'cartao_credito', 'credito', false, true, true),
('Cartão de Débito', 'cartao_debito', 'debito', false, true, true),
('Boleto', 'boleto', 'bancario', false, true, true),
('Transferência', 'transferencia', 'bancario', true, true, true),
('Outros', 'outros', 'outros', true, true, true);

-- 3. Verifica o resultado
SELECT count(*) as total_methods FROM payment_methods;
