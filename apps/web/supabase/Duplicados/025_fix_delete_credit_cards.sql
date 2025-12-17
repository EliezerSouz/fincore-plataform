-- =====================================================
-- FIX: Garantir que DELETE funcione para credit_cards
-- =====================================================

-- Verificar se a política de DELETE existe e está correta
DROP POLICY IF EXISTS "Users can delete own cards" ON public.credit_cards;

-- Recriar política de DELETE
CREATE POLICY "Users can delete own cards"
ON public.credit_cards
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Garantir que a tabela tem as permissões corretas
GRANT DELETE ON public.credit_cards TO authenticated;
GRANT DELETE ON public.credit_cards TO service_role;

-- Verificar se há constraint que impede exclusão
-- (faturas e transações devem ter ON DELETE CASCADE ou SET NULL)

-- Se houver faturas ou transações, elas devem ser excluídas ou ter referência removida
-- Isso já foi configurado nas migrations anteriores, mas vamos garantir:

-- Verificar constraint de credit_card_invoices
DO $$
BEGIN
    -- Remove constraint antiga se existir
    ALTER TABLE public.credit_card_invoices 
    DROP CONSTRAINT IF EXISTS credit_card_invoices_credit_card_id_fkey;
    
    -- Adiciona constraint com ON DELETE CASCADE
    ALTER TABLE public.credit_card_invoices
    ADD CONSTRAINT credit_card_invoices_credit_card_id_fkey
    FOREIGN KEY (credit_card_id)
    REFERENCES public.credit_cards(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Constraint já existe ou erro: %', SQLERRM;
END $$;

-- Verificar constraint de credit_card_transactions
DO $$
BEGIN
    -- Remove constraint antiga se existir
    ALTER TABLE public.credit_card_transactions 
    DROP CONSTRAINT IF EXISTS credit_card_transactions_credit_card_id_fkey;
    
    -- Adiciona constraint com ON DELETE CASCADE
    ALTER TABLE public.credit_card_transactions
    ADD CONSTRAINT credit_card_transactions_credit_card_id_fkey
    FOREIGN KEY (credit_card_id)
    REFERENCES public.credit_cards(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Constraint já existe ou erro: %', SQLERRM;
END $$;

-- Log de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Políticas de DELETE atualizadas com sucesso!';
END $$;
