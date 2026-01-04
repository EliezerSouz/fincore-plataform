-- Função para forçar exclusão de transação (ignora RLS)
CREATE OR REPLACE FUNCTION force_delete_transaction(transaction_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.credit_card_transactions WHERE id = transaction_id;
END;
$$;

-- Permitir que usuários autenticados usem a função
GRANT EXECUTE ON FUNCTION force_delete_transaction TO authenticated;

-- Garantir que a de cartão também exista (reforço)
CREATE OR REPLACE FUNCTION force_delete_card(card_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.credit_card_transactions WHERE credit_card_id = card_id;
    DELETE FROM public.credit_card_invoices WHERE credit_card_id = card_id;
    DELETE FROM public.credit_cards WHERE id = card_id;
END;
$$;

GRANT EXECUTE ON FUNCTION force_delete_card TO authenticated;
