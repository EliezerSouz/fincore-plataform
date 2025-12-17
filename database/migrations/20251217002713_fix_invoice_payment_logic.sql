-- Migration to fix pay_invoice logic and handle overpayments (credits)
-- This function recursively applies excess payments to future invoices.

CREATE OR REPLACE FUNCTION public.pay_invoice(p_invoice_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
    v_invoice RECORD;
    v_new_paid_amount NUMERIC;
    v_excess NUMERIC;
    v_next_invoice_id UUID;
    v_status TEXT;
BEGIN
    -- 1. Get current invoice
    SELECT * INTO v_invoice FROM public.credit_card_invoices WHERE id = p_invoice_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found';
    END IF;

    -- Calculate potential new total paid
    v_new_paid_amount := v_invoice.paid_amount + p_amount;
    
    -- Check for excess
    IF v_new_paid_amount > v_invoice.total_amount THEN
        v_excess := v_new_paid_amount - v_invoice.total_amount;
        v_new_paid_amount := v_invoice.total_amount;
        v_status := 'paid';
    ELSIF v_new_paid_amount = v_invoice.total_amount THEN
        v_excess := 0;
        v_status := 'paid';
    ELSE
        v_excess := 0;
        v_status := 'partial';
    END IF;

    -- Update current invoice (capped if there is excess, to be distributed)
    UPDATE public.credit_card_invoices 
    SET paid_amount = v_new_paid_amount,
        status = v_status,
        updated_at = NOW()
    WHERE id = p_invoice_id;

    -- Handle Excess
    IF v_excess > 0 THEN
        -- Find next invoice
        SELECT id INTO v_next_invoice_id
        FROM public.credit_card_invoices
        WHERE credit_card_id = v_invoice.credit_card_id
          AND (reference_year > v_invoice.reference_year 
               OR (reference_year = v_invoice.reference_year AND reference_month > v_invoice.reference_month))
        ORDER BY reference_year ASC, reference_month ASC
        LIMIT 1;

        IF v_next_invoice_id IS NOT NULL THEN
            -- Recursive call to apply excess to next invoice
            PERFORM public.pay_invoice(v_next_invoice_id, v_excess);
        ELSE
            -- No next invoice, so we store the excess on the current invoice
            -- This uncaps it, showing the credit there.
            UPDATE public.credit_card_invoices 
            SET paid_amount = paid_amount + v_excess
            WHERE id = p_invoice_id;
        END IF;
    END IF;

END;
$$ LANGUAGE plpgsql;
