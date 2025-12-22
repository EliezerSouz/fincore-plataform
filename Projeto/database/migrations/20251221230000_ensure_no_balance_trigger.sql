-- Disable the trigger that causes double counting when combined with Go backend logic
DROP TRIGGER IF EXISTS on_transaction_change ON public.transactions;
DROP FUNCTION IF EXISTS public.handle_balance_update();
