-- Restore handle_balance_update function
CREATE OR REPLACE FUNCTION public.handle_balance_update()
RETURNS TRIGGER AS $$
BEGIN
    -- INSERT
    IF (TG_OP = 'INSERT') THEN
        IF NEW.is_paid = true AND NEW.account_id IS NOT NULL THEN
            IF NEW.type = 'receita' THEN
                UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
            ELSIF NEW.type = 'despesa' THEN
                UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
            ELSIF NEW.type = 'transferencia' AND NEW.destination_account_id IS NOT NULL THEN
                UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
                UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.destination_account_id;
            END IF;
        END IF;
        RETURN NEW;
        
    -- DELETE
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.is_paid = true AND OLD.account_id IS NOT NULL THEN
            IF OLD.type = 'receita' THEN
                UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
            ELSIF OLD.type = 'despesa' THEN
                UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
            ELSIF OLD.type = 'transferencia' AND OLD.destination_account_id IS NOT NULL THEN
                UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
                UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.destination_account_id;
            END IF;
        END IF;
        RETURN OLD;
        
    -- UPDATE
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Revert OLD
        IF OLD.is_paid = true AND OLD.account_id IS NOT NULL THEN
            IF OLD.type = 'receita' THEN
                UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
            ELSIF OLD.type = 'despesa' THEN
                UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
            ELSIF OLD.type = 'transferencia' AND OLD.destination_account_id IS NOT NULL THEN
                UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
                UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.destination_account_id;
            END IF;
        END IF;
        
        -- Apply NEW
        IF NEW.is_paid = true AND NEW.account_id IS NOT NULL THEN
            IF NEW.type = 'receita' THEN
                UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
            ELSIF NEW.type = 'despesa' THEN
                UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
            ELSIF NEW.type = 'transferencia' AND NEW.destination_account_id IS NOT NULL THEN
                UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
                UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.destination_account_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate Trigger
DROP TRIGGER IF EXISTS on_transaction_change ON public.transactions;
CREATE TRIGGER on_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_balance_update();

-- RESTORE BALANCES
-- Logic:
-- 1. For each account, find the LATEST balance adjustment (based on adjustment_date and created_at).
-- 2. Sum all transactions that occurred AFTER that adjustment date.
-- 3. Update account balance = Adjustment Balance + Transaction Sum.

WITH latest_adjustments AS (
    SELECT DISTINCT ON (account_id) *
    FROM account_balance_adjustments
    ORDER BY account_id, adjustment_date DESC, created_at DESC
),
subsequent_transactions AS (
    SELECT 
        t.account_id,
        SUM(
            CASE 
                WHEN t.type = 'receita' THEN t.amount 
                WHEN t.type = 'despesa' THEN -t.amount
                WHEN t.type = 'transferencia' AND t.destination_account_id IS NOT NULL THEN -t.amount -- Outgoing transfer
                ELSE 0 
            END
        ) as net_change
    FROM transactions t
    JOIN latest_adjustments la ON t.account_id = la.account_id
    WHERE t.date > la.adjustment_date
    AND t.is_paid = true
    GROUP BY t.account_id
),
incoming_transfers AS (
     SELECT 
        t.destination_account_id as account_id,
        SUM(t.amount) as net_change
    FROM transactions t
    JOIN latest_adjustments la ON t.destination_account_id = la.account_id
    WHERE t.type = 'transferencia'
    AND t.date > la.adjustment_date
    AND t.is_paid = true
    GROUP BY t.destination_account_id
)
UPDATE accounts a
SET balance = la.balance + COALESCE(st.net_change, 0) + COALESCE(it.net_change, 0)
FROM latest_adjustments la
LEFT JOIN subsequent_transactions st ON la.account_id = st.account_id
LEFT JOIN incoming_transfers it ON la.account_id = it.account_id
WHERE a.id = la.account_id;
