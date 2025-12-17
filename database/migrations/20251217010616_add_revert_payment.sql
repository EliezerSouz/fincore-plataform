-- Function to revert payment
-- Decrements paid_amount from current invoice AND future ones if needed.

CREATE OR REPLACE FUNCTION public.revert_payment(p_invoice_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
    v_invoice RECORD;
    v_amount_to_revert NUMERIC := p_amount;
    v_paid_deduction NUMERIC;
    v_next_invoice_id UUID;
BEGIN
    -- 1. Get current invoice
    SELECT * INTO v_invoice FROM public.credit_card_invoices WHERE id = p_invoice_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found';
    END IF;

    -- How much was effectively paid on THIS invoice?
    -- Actually, due to the recursive pay_invoice logic, the paid_amount represents strictly what's applied to this invoice (capped at total).
    -- BUT if we have "overpayment credits" stored on this invoice (uncommon with the new logic, but possible as fallback), we deduct from there first.
    
    -- Strategy:
    -- 1. Revert from future invoices first (LIFO)? Or revert from current invoice and let future invoices become "unpaid"?
    -- Logic: The user is reverting a specific PAYMENT. If that payment generated surplus that went to future invoices, we must pull it back.
    
    -- Unfortunately, we don't track *which* payment paid *which* invoice slice easily without a ledger.
    -- SIMPLE APPROACH: Deduct from the target invoice. If it goes negative (not possible with check constraints usually, but let's assume valid state),
    -- wait, pay_invoice capped the values.
    
    -- If we revert 1500 from Invoice A (Total 1000, Paid 1000), Invoice A becomes Paid -500? No.
    -- It becomes Paid 0. And we need to find where the other 500 went (Invoice B).
    
    -- Recursive Revert Logic:
    -- 1. Deduct max possible from current invoice (down to 0).
    -- 2. If there is still amount remaining, find next invoice and deduct from there.
    
    -- PROBLEM: The payment flow pushes surplus forward. The revert flow must pull surplus back?
    -- No, if I paid 1500 today, it filled Invoice A (1000) and Invoice B (500).
    -- If I revert 1500, I should revert 500 from B and 1000 from A.
    -- But since I am triggering this from Invoice A (where the transaction is linked), I should start there.
    -- WAIT: The surplus logic pushed forward. So Invoice B received a separate "pay_invoice" call recursively.
    -- So essentially, Invoice B thinks it was paid.
    
    -- If we simply decrement Invoice A by 1500, it will go to -500.
    -- We need to check if there are future invoices that were paid by this surplus.
    
    -- Let's try to find "Next Invoices" and revert from them first?
    -- Or just revert sequentially from A -> B -> C?
    -- If A has 1000 paid. Revert 1500.
    -- A becomes -500. This is wrong.
    
    -- Let's check how much we can revert from A.
    v_paid_deduction := LEAST(v_invoice.paid_amount, v_amount_to_revert);
    
    -- Update A
    UPDATE public.credit_card_invoices 
    SET paid_amount = paid_amount - v_paid_deduction,
        status = CASE WHEN (paid_amount - v_paid_deduction) < total_amount THEN 'open' ELSE 'paid' END, -- Simplified status logic
        updated_at = NOW()
    WHERE id = p_invoice_id;
    
    v_amount_to_revert := v_amount_to_revert - v_paid_deduction;
    
    -- If there is still amount to revert, go to next invoice
    IF v_amount_to_revert > 0 THEN
         SELECT id INTO v_next_invoice_id
        FROM public.credit_card_invoices
        WHERE credit_card_id = v_invoice.credit_card_id
          AND (reference_year > v_invoice.reference_year 
               OR (reference_year = v_invoice.reference_year AND reference_month > v_invoice.reference_month))
        ORDER BY reference_year ASC, reference_month ASC
        LIMIT 1;
        
        IF v_next_invoice_id IS NOT NULL THEN
            PERFORM public.revert_payment(v_next_invoice_id, v_amount_to_revert);
        ELSE
             -- No next invoice. Just leave it. The money effectively "disappeared" from the invoice accounting, which is correct since it's being refunded.
             -- Warning: If there was credit stored locally on the invoice (paid > total) caught by the ELSE in pay_invoice,
             -- the v_paid_deduction logic above (using LEAST) might have missed it if we assume paid capped at total.
             -- But pay_invoice allows paid > total in that specific ELSE case.
             -- So actually, simply checking paid_amount covers it.
        END IF;
    END IF;
    
    -- Final Status Fix for A (Clean up 'open' vs 'partial' vs 'closed')
    UPDATE public.credit_card_invoices
    SET status = CASE 
        WHEN paid_amount >= total_amount THEN 'paid'
        WHEN paid_amount > 0 THEN 'partial'
        ELSE 'closed' -- Assuming it was closed since we are paying it. If it was open, it stays open? 
                      -- Status management is tricky. Let's assume 'closed' (waiting payment) is standard for ready invoices.
    END
    WHERE id = p_invoice_id AND paid_amount < total_amount; 
    -- Note: If we reverted, it's likely not paid anymore.

END;
$$ LANGUAGE plpgsql;
