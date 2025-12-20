-- Disable the trigger that causes double counting when combined with Go backend logic
DROP TRIGGER IF EXISTS on_transaction_change ON public.transactions;
DROP FUNCTION IF EXISTS public.handle_balance_update();

-- Recalculate balances to fix corruption
UPDATE public.accounts a
SET balance = (
    COALESCE((
        SELECT SUM(
            CASE 
                WHEN type = 'receita' THEN amount 
                WHEN type = 'despesa' THEN -amount
                WHEN type = 'transferencia' THEN -amount
                ELSE 0
            END
        )
        FROM public.transactions t
        WHERE t.account_id = a.id
    ), 0)
    +
    COALESCE((
        SELECT SUM(amount)
        FROM public.transactions t
        WHERE t.destination_account_id = a.id AND t.type = 'transferencia'
    ), 0)
);
