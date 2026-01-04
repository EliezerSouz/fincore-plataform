-- Add related_transaction_id to transactions table for linking transfers
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS related_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL;

-- Create default Transfer categories if they don't exist
-- We need two: one for Expense (Transferência Enviada) and one for Income (Transferência Recebida)
-- Or just "Transferência" for both?
-- Categories table has 'type' column ('receita', 'despesa').
-- So we need two rows.

DO $$
DECLARE
    user_id uuid;
BEGIN
    -- We can't easily insert for ALL users if categories are per-user.
    -- If categories are global (user_id is null), we insert global.
    -- If categories are per-user, we can't do it here easily for existing users without looping.
    -- Let's check if categories table has user_id.
    -- Assuming categories are per-user or there are global defaults.
    -- Usually 'default' categories are created on user signup.
    -- We'll assume the code handles creation on demand or we rely on 'Transferência' name lookup.
    
    -- If there are global categories (user_id IS NULL), insert there.
    INSERT INTO public.categories (name, type, icon, color, is_active, is_default)
    SELECT 'Transferência', 'despesa', 'arrow-right-left', '#3b82f6', true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.categories WHERE name = 'Transferência' AND type = 'despesa' AND (user_id IS NULL OR is_default = true)
    );

    INSERT INTO public.categories (name, type, icon, color, is_active, is_default)
    SELECT 'Transferência', 'receita', 'arrow-right-left', '#3b82f6', true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.categories WHERE name = 'Transferência' AND type = 'receita' AND (user_id IS NULL OR is_default = true)
    );
END $$;
