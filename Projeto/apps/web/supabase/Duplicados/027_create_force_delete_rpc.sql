-- Função para forçar exclusão de cartão e tudo relacionado
-- Roda como SECURITY DEFINER (privilégios de superusuário)
CREATE OR REPLACE FUNCTION force_delete_card(card_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Excluir transações
    DELETE FROM public.credit_card_transactions WHERE credit_card_id = card_id;
    
    -- 2. Excluir faturas
    DELETE FROM public.credit_card_invoices WHERE credit_card_id = card_id;
    
    -- 3. Excluir o cartão
    DELETE FROM public.credit_cards WHERE id = card_id;
END;
$$;
