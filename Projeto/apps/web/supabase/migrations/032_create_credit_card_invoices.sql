-- =====================================================
-- TABELA: credit_card_invoices
-- Faturas mensais de cartões de crédito
-- =====================================================

CREATE TABLE IF NOT EXISTS public.credit_card_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    credit_card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
    
    -- Período da fatura
    reference_month INTEGER NOT NULL CHECK (reference_month BETWEEN 1 AND 12),
    reference_year INTEGER NOT NULL CHECK (reference_year >= 2000),
    
    -- Datas importantes
    closing_date DATE NOT NULL,  -- Data de fechamento
    due_date DATE NOT NULL,      -- Data de vencimento
    
    -- Valores
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    
    -- Status: open, closed, paid, overdue, partial
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paid', 'overdue', 'partial')),
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: Uma fatura por cartão por mês
    UNIQUE(credit_card_id, reference_month, reference_year)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_invoices_card ON public.credit_card_invoices(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON public.credit_card_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.credit_card_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_period ON public.credit_card_invoices(reference_year, reference_month);

-- Habilitar RLS
ALTER TABLE public.credit_card_invoices ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
DROP POLICY IF EXISTS "Users can view own invoices" ON public.credit_card_invoices;
CREATE POLICY "Users can view own invoices" ON public.credit_card_invoices
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own invoices" ON public.credit_card_invoices;
CREATE POLICY "Users can insert own invoices" ON public.credit_card_invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own invoices" ON public.credit_card_invoices;
CREATE POLICY "Users can update own invoices" ON public.credit_card_invoices
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own invoices" ON public.credit_card_invoices;
CREATE POLICY "Users can delete own invoices" ON public.credit_card_invoices
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_credit_card_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoices_timestamp ON public.credit_card_invoices;
CREATE TRIGGER trigger_update_invoices_timestamp
    BEFORE UPDATE ON public.credit_card_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_credit_card_invoices_updated_at();
