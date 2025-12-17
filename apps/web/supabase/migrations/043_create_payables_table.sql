-- Criação da tabela específica para Contas a Pagar (Payables)
-- Separada de Transactions para gerenciar compromissos futuros complexos

CREATE TABLE IF NOT EXISTS public.payables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    description TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    due_date DATE NOT NULL,
    
    -- Status do Compromisso
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    paid_at TIMESTAMPTZ,
    
    -- Link com a transação financeira real (quando pago)
    -- Isso evita duplicação de dados financeiros no caixa, mantendo Payables como apenas "Agendamento"
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    
    -- Categorização (importante para previsão)
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
    
    -- Recorrência e Parcelamento
    recurrence_strategy TEXT DEFAULT 'single' CHECK (recurrence_strategy IN ('single', 'installment', 'fixed')),
    installment_number INTEGER, -- Número da parcela atual
    total_installments INTEGER, -- Total de parcelas
    
    -- ID do "pai" para agrupamento (ex: compra original parcelada ou contrato de recorrência)
    parent_id UUID REFERENCES public.payables(id) ON DELETE CASCADE,
    
    -- Detalhes adicionais comuns em boletos/contas
    barcode TEXT, -- Código de barras
    beneficiary TEXT, -- Nome do beneficiário (Opcional)
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payables_user_status ON public.payables(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payables_due_date ON public.payables(due_date);
CREATE INDEX IF NOT EXISTS idx_payables_parent ON public.payables(parent_id);

-- RLS (Row Level Security)
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payables" ON public.payables;
CREATE POLICY "Users can view own payables" ON public.payables
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payables" ON public.payables;
CREATE POLICY "Users can insert own payables" ON public.payables
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payables" ON public.payables;
CREATE POLICY "Users can update own payables" ON public.payables
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own payables" ON public.payables;
CREATE POLICY "Users can delete own payables" ON public.payables
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_payables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payables_timestamp ON public.payables;
CREATE TRIGGER trigger_update_payables_timestamp
    BEFORE UPDATE ON public.payables
    FOR EACH ROW
    EXECUTE FUNCTION update_payables_updated_at();
