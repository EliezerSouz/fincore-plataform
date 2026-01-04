-- =====================================================
-- FIX RLS: Permitir exclusão de transações e faturas
-- =====================================================

-- 1. Transações: Resetar política de DELETE
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.credit_card_transactions;

CREATE POLICY "Users can delete own transactions"
ON public.credit_card_transactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

GRANT DELETE ON public.credit_card_transactions TO authenticated;

-- 2. Faturas: Resetar política de DELETE
DROP POLICY IF EXISTS "Users can delete own invoices" ON public.credit_card_invoices;

CREATE POLICY "Users can delete own invoices"
ON public.credit_card_invoices
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

GRANT DELETE ON public.credit_card_invoices TO authenticated;

-- 3. Trigger para atualizar total da fatura ao excluir transação
-- (Isso geralmente é bom ter, mas se a fatura for recalculada via view ou função, ok)
-- Vamos assumir que o sistema precisa recalcular

CREATE OR REPLACE FUNCTION public.recalc_invoice_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.credit_card_invoices
    SET total_amount = (
        SELECT COALESCE(SUM(amount), 0)
        FROM public.credit_card_transactions
        WHERE invoice_id = OLD.invoice_id
    )
    WHERE id = OLD.invoice_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_recalc_invoice_on_delete ON public.credit_card_transactions;

CREATE TRIGGER trigger_recalc_invoice_on_delete
AFTER DELETE ON public.credit_card_transactions
FOR EACH ROW
EXECUTE FUNCTION public.recalc_invoice_total();
