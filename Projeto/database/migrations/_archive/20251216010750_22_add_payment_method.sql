-- Adiciona a coluna de forma de pagamento na tabela de transações
ALTER TABLE public.transactions 
ADD COLUMN payment_method TEXT DEFAULT 'outros';

-- Comentário na coluna
COMMENT ON COLUMN public.transactions.payment_method IS 'Forma de pagamento específica: pix, boleto, dinheiro, cartao_credito, cartao_debito, transferencia, etc.';
