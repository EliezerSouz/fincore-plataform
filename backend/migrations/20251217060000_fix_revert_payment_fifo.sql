-- Function to revert payment (FIFO Path Strategy)
-- Correct Strategy: Attempts to remove the payment from the origin invoice first.
-- If the origin invoice hits 0 and there is still amount to revert (meaning the original payment was an overpayment),
-- it allows the reversion to spill over to the next invoice, effectively tracing back the surplus.

CREATE OR REPLACE FUNCTION public.revert_payment(p_invoice_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
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

    -- 2. Loop through invoices starting from CURRENT, going forward to FUTURE
    -- Matches exactly the flow of money (Money In -> Spill Forward). Revert is (Drain Here -> Drain Forward).
    FOR v_target_invoice IN 
        SELECT id, paid_amount, total_amount, status
        FROM public.credit_card_invoices
        WHERE credit_card_id = v_card_id
          AND (reference_year > v_ref_year 
               OR (reference_year = v_ref_year AND reference_month >= v_ref_month))
          AND paid_amount > 0
        ORDER BY reference_year ASC, reference_month ASC
    LOOP
        -- If we still have amount to revert
        IF v_amount_remaining > 0 THEN
            -- Calculate how much can be taken from this invoice
            v_deduction := LEAST(v_target_invoice.paid_amount, v_amount_remaining);
            
            -- Update the invoice
            UPDATE public.credit_card_invoices
            SET paid_amount = paid_amount - v_deduction,
                updated_at = NOW()
            WHERE id = v_target_invoice.id;
            
            -- Update Status
            UPDATE public.credit_card_invoices
            SET status = CASE 
                    WHEN (paid_amount) >= total_amount THEN 'paid'
                    WHEN (paid_amount) > 0 THEN 'partial'
                    ELSE 'closed'
                END
            WHERE id = v_target_invoice.id;

            -- Decrement remaining amount
            v_amount_remaining := v_amount_remaining - v_deduction;
        ELSE
            -- Finished reverting
            EXIT; 
        END IF;
    END LOOP;

END;
$$ LANGUAGE plpgsql;
