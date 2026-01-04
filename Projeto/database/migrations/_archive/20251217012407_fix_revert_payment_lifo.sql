-- Function to revert payment (LIFO Strategy)
-- Removes payment from the newest invoices first, moving backwards to the starting invoice.

CREATE OR REPLACE FUNCTION public.revert_payment(p_invoice_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
    v_invoice RECORD;
    v_card_id UUID;
    v_ref_month INTEGER;
    v_ref_year INTEGER;
    v_target_invoice RECORD;
    v_amount_remaining NUMERIC := p_amount;
    v_deduction NUMERIC;
BEGIN
    -- 1. Get info about the starting invoice
    SELECT credit_card_id, reference_month, reference_year INTO v_card_id, v_ref_month, v_ref_year
    FROM public.credit_card_invoices 
    WHERE id = p_invoice_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found';
    END IF;

    -- 2. Loop through invoices starting from the future-most one, back to the current one
    -- We select all invoices for this card that are >= current date, and order them DESCENTING (Future -> Current)
    FOR v_target_invoice IN 
        SELECT id, paid_amount, total_amount, status
        FROM public.credit_card_invoices
        WHERE credit_card_id = v_card_id
          AND (reference_year > v_ref_year 
               OR (reference_year = v_ref_year AND reference_month >= v_ref_month))
          AND paid_amount > 0 -- Only care about invoices with money
        ORDER BY reference_year DESC, reference_month DESC
    LOOP
        -- If we still have amount to revert
        IF v_amount_remaining > 0 THEN
            -- Calculate how much to take from this invoice
            v_deduction := LEAST(v_target_invoice.paid_amount, v_amount_remaining);
            
            -- Update the invoice
            UPDATE public.credit_card_invoices
            SET paid_amount = paid_amount - v_deduction,
                updated_at = NOW()
            WHERE id = v_target_invoice.id;
            
            -- Update Status based on new paid amount (Status Logic)
            -- We need to check the *new* paid_amount. 
            -- Since we can't see the update result immediately in the loop record variable, we calculate:
            -- new_paid = v_target_invoice.paid_amount - v_deduction
            
            UPDATE public.credit_card_invoices
            SET status = CASE 
                    WHEN (paid_amount) >= total_amount THEN 'paid'
                    WHEN (paid_amount) > 0 THEN 'partial'
                    ELSE 'closed' -- return to waiting for payment
                END
            WHERE id = v_target_invoice.id;

            -- Decrement remaining amount
            v_amount_remaining := v_amount_remaining - v_deduction;
        END IF;
    END LOOP;

    -- Note: If v_amount_remaining > 0 at the end, it means we tried to revert more than what was paid across all future invoices combined.
    -- This shouldn't happen if the transaction amount matches reality, but if it does, the remaining amount is strictly ignored 
    -- (or we could raise an error, but let's be safe).

END;
$$ LANGUAGE plpgsql;
