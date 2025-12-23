-- Disable the trigger that causes double counting when combined with Go backend logic
-- We repeat this to ensure it's really gone, as it conflicts with Go backend logic for historical transactions
DROP TRIGGER IF EXISTS on_transaction_change ON public.transactions;
DROP FUNCTION IF EXISTS public.handle_balance_update();
