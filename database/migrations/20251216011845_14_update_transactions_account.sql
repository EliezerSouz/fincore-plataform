-- Permitir transações sem conta bancária (ex: Cartão de Crédito)
ALTER TABLE public.transactions 
ALTER COLUMN account_id DROP NOT NULL;
