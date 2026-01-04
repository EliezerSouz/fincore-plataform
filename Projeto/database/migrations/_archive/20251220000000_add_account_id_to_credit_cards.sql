-- Add account_id to credit_cards
ALTER TABLE public.credit_cards 
ADD COLUMN account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;
