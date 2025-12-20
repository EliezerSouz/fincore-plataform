-- Helper to decrement invoice paid amount safely
CREATE OR REPLACE FUNCTION public.decrement_invoice_paid(p_invoice_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
    v_new_paid NUMERIC;
BEGIN
    UPDATE public.credit_card_invoices 
    SET paid_amount = paid_amount - p_amount,
        updated_at = NOW()
    WHERE id = p_invoice_id
    RETURNING paid_amount INTO v_new_paid;

    -- Update status
    UPDATE public.credit_card_invoices
    SET status = CASE 
        WHEN paid_amount >= total_amount THEN 'paid'
        WHEN paid_amount > 0 THEN 'partial'
        ELSE 'closed'
    END
    WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql;
