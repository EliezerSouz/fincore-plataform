-- =====================================================
-- MIGRATION 006: PAYABLES (CONTAS A PAGAR)
-- Descrição: Sistema de contas a pagar com recorrência
-- Data: 23/12/2025
-- Autor: FinCore Team
-- =====================================================

-- =====================================================
-- PARTE 1: TABELA DE CONTAS A PAGAR
-- =====================================================

CREATE TABLE payables (
    -- Identificação
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Dados da Conta
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    
    -- Status e Pagamento
    status payable_status DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    
    -- Categorização
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    
    -- Recorrência e Parcelamento
    recurrence_strategy TEXT DEFAULT 'single',  -- 'single', 'recurring', 'installment'
    installment_number INTEGER,
    total_installments INTEGER,
    parent_id UUID REFERENCES payables(id) ON DELETE SET NULL,
    
    -- Dados Adicionais
    barcode TEXT,
    beneficiary TEXT,
    notes TEXT,
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,  -- Soft delete
    
    -- Constraints
    CONSTRAINT installment_check CHECK (
        (recurrence_strategy != 'installment') OR
        (installment_number > 0 AND total_installments > 0 AND installment_number <= total_installments)
    )
);

-- Índices
CREATE INDEX idx_payables_user_id ON payables(user_id);
CREATE INDEX idx_payables_status ON payables(status);
CREATE INDEX idx_payables_due_date ON payables(due_date);
CREATE INDEX idx_payables_deleted_at ON payables(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_payables_user_status ON payables(user_id, status) WHERE deleted_at IS NULL;

-- =====================================================
-- PARTE 2: ADICIONAR FOREIGN KEY EM TRANSACTIONS
-- =====================================================

ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_payable
    FOREIGN KEY (payable_id) REFERENCES payables(id) ON DELETE SET NULL;

-- =====================================================
-- PARTE 3: TRIGGERS
-- =====================================================

CREATE TRIGGER set_payables_updated_at
    BEFORE UPDATE ON payables
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- =====================================================
-- PARTE 4: RLS
-- =====================================================

ALTER TABLE payables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payables"
    ON payables
    FOR ALL
    USING (auth.uid() = user_id AND deleted_at IS NULL)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PARTE 5: GRANTS E COMENTÁRIOS
-- =====================================================

GRANT ALL ON TABLE payables TO authenticated;

COMMENT ON TABLE payables IS 'Contas a pagar com suporte a recorrência e parcelamento';

-- =====================================================
-- FIM DA MIGRATION 006
-- =====================================================
