-- =====================================================
-- TABELA: credit_card_transactions
-- Transações/Compras de cartão de crédito
-- =====================================================

CREATE TABLE IF NOT EXISTS public.credit_card_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    credit_card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.credit_card_invoices(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    
    -- Informações da transação
    description TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    transaction_date DATE NOT NULL,
    
    -- Parcelamento
    is_installment BOOLEAN DEFAULT FALSE,
    installment_number INTEGER, -- Parcela atual (ex: 3 de 12)
    total_installments INTEGER, -- Total de parcelas
    parent_transaction_id UUID REFERENCES public.credit_card_transactions(id) ON DELETE CASCADE, -- Referência à compra original
    
    -- Tipo de transação: purchase (compra), refund (estorno), adjustment (ajuste), fee (taxa)
    transaction_type TEXT NOT NULL DEFAULT 'purchase' CHECK (transaction_type IN ('purchase', 'refund', 'adjustment', 'fee')),
    
    -- Observações
    notes TEXT,
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cc_transactions_card ON public.credit_card_transactions(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_cc_transactions_invoice ON public.credit_card_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_cc_transactions_user ON public.credit_card_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cc_transactions_date ON public.credit_card_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_cc_transactions_category ON public.credit_card_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_cc_transactions_parent ON public.credit_card_transactions(parent_transaction_id);

-- Habilitar RLS
ALTER TABLE public.credit_card_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
DROP POLICY IF EXISTS "Users can view own cc transactions" ON public.credit_card_transactions;
CREATE POLICY "Users can view own cc transactions" ON public.credit_card_transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own cc transactions" ON public.credit_card_transactions;
CREATE POLICY "Users can insert own cc transactions" ON public.credit_card_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cc transactions" ON public.credit_card_transactions;
CREATE POLICY "Users can update own cc transactions" ON public.credit_card_transactions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own cc transactions" ON public.credit_card_transactions;
CREATE POLICY "Users can delete own cc transactions" ON public.credit_card_transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_cc_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cc_transactions_timestamp ON public.credit_card_transactions;
CREATE TRIGGER trigger_update_cc_transactions_timestamp
    BEFORE UPDATE ON public.credit_card_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_cc_transactions_updated_at();

-- =====================================================
-- FUNCTION: Atualizar total da fatura automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION update_invoice_total()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar o total da fatura quando uma transação for adicionada/modificada/removida
    IF TG_OP = 'DELETE' THEN
        UPDATE public.credit_card_invoices
        SET total_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.credit_card_transactions
            WHERE invoice_id = OLD.invoice_id
        )
        WHERE id = OLD.invoice_id;
        RETURN OLD;
    ELSE
        UPDATE public.credit_card_invoices
        SET total_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.credit_card_transactions
            WHERE invoice_id = NEW.invoice_id
        )
        WHERE id = NEW.invoice_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoice_total ON public.credit_card_transactions;
CREATE TRIGGER trigger_update_invoice_total
    AFTER INSERT OR UPDATE OR DELETE ON public.credit_card_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_total();
