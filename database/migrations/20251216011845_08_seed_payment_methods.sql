-- Seed inicial para métodos de pagamento
INSERT INTO payment_methods (name, slug, allows_income, allows_expense, is_active) VALUES
('Dinheiro', 'dinheiro', true, true, true),
('Pix', 'pix', true, true, true),
('Cartão de Crédito', 'cartao_credito', false, true, true),
('Cartão de Débito', 'cartao_debito', false, true, true),
('Boleto', 'boleto', false, true, true),
('Transferência', 'transferencia', true, true, true),
('Outros', 'outros', true, true, true)
ON CONFLICT (slug) DO NOTHING;
