-- Migration para alterar comportamento de deleção (Remove CASCADE/SET NULL e aplica RESTRICT)

-- 1. ACCOUNT_ID (O principal causador do problema relatado)
-- Remove a constraint antiga que tinha ON DELETE CASCADE
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_account_id_fkey;

-- Adiciona nova constraint com ON DELETE RESTRICT
-- Isso impedirá a deleção de uma Conta se houver transações vinculadas a ela.
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_account_id_fkey 
FOREIGN KEY (account_id) 
REFERENCES public.accounts(id) 
ON DELETE RESTRICT;

-- 2. DESTINATION_ACCOUNT_ID (Transferências)
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_destination_account_id_fkey;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_destination_account_id_fkey 
FOREIGN KEY (destination_account_id) 
REFERENCES public.accounts(id) 
ON DELETE RESTRICT;

-- 3. CATEGORY_ID
-- Atualmente é SET NULL, alterando para RESTRICT para evitar deleção acidental de categorias em uso
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_category_id_fkey;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES public.categories(id) 
ON DELETE RESTRICT;

-- 4. SUBCATEGORY_ID
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_subcategory_id_fkey;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_subcategory_id_fkey 
FOREIGN KEY (subcategory_id) 
REFERENCES public.subcategories(id) 
ON DELETE RESTRICT;

-- OBS: user_id DEVE ser mantido como CASCADE (padrão) para permitir que ao deletar o usuário, tudo seja limpo.
-- Não precisa alterar transactions_user_id_fkey.
