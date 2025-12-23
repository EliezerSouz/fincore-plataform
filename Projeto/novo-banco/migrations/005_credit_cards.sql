-- =====================================================
-- MIGRATION 005: CREDIT CARDS AND INVOICES
-- Descrição: Sistema completo de cartões de crédito e faturas
-- Data: 23/12/2025
-- Autor: FinCore Team
-- =====================================================

-- =====================================================
-- PARTE 1: TABELA DE CARTÕES DE CRÉDITO
-- =====================================================

CREATE TABLE credit_cards (
    -- Identificação
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    
    -- Dados do Cartão
    name TEXT NOT NULL,
    last_4_digits TEXT,
    brand card_brand DEFAULT 'outros',
    limit_amount NUMERIC(15, 2) DEFAULT 0,
    
    -- Datas de Fechamento e Vencimento
    closing_day INTEGER NOT NULL CHECK (closing_day >= 1 AND closing_day <= 31),
    due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
    
    -- Personalização
    color TEXT DEFAULT '#0f172a',
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,  -- Soft delete
    
    -- Constraints
    CONSTRAINT limit_amount_check CHECK (limit_amount >= 0)
);

-- Índices
CREATE INDEX idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX idx_credit_cards_deleted_at ON credit_cards(deleted_at) WHERE deleted_at IS NULL;

-- =====================================================
-- PARTE 2: TABELA DE FATURAS
-- =====================================================

CREATE TABLE credit_card_invoices (
    -- Identificação
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credit_card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
    
    -- Período de Referência
    reference_month INTEGER NOT NULL CHECK (reference_month >= 1 AND reference_month <= 12),
    reference_year INTEGER NOT NULL CHECK (reference_year >= 2000 AND reference_year <= 2100),
    
    -- Datas
    closing_date DATE NOT NULL,
    due_date DATE NOT NULL,
    
    -- Valores
    total_amount NUMERIC(15, 2) DEFAULT 0,
    paid_amount NUMERIC(15, 2) DEFAULT 0,
    
    -- Status
    status invoice_status DEFAULT 'open',
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,  -- Soft delete
    
    -- Constraints
    CONSTRAINT unique_invoice_per_card_period UNIQUE (credit_card_id, reference_month, reference_year),
    CONSTRAINT amounts_check CHECK (total_amount >= 0 AND paid_amount >= 0)
);

-- Índices
CREATE INDEX idx_invoices_user_id ON credit_card_invoices(user_id);
CREATE INDEX idx_invoices_card_id ON credit_card_invoices(credit_card_id);
CREATE INDEX idx_invoices_status ON credit_card_invoices(status);
CREATE INDEX idx_invoices_period ON credit_card_invoices(reference_year, reference_month);
CREATE INDEX idx_invoices_deleted_at ON credit_card_invoices(deleted_at) WHERE deleted_at IS NULL;

-- =====================================================
-- PARTE 3: TABELA DE TRANSAÇÕES DO CARTÃO
-- =====================================================

CREATE TABLE credit_card_transactions (
    -- Identificação
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credit_card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES credit_card_invoices(id) ON DELETE CASCADE,
    
    -- Dados da Transação
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    transaction_date DATE NOT NULL,
    transaction_type TEXT DEFAULT 'purchase',
    
    -- Categorização
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
    
    -- Parcelamento
    is_installment BOOLEAN DEFAULT false,
    installment_number INTEGER,
    total_installments INTEGER,
    parent_transaction_id UUID REFERENCES credit_card_transactions(id) ON DELETE SET NULL,
    group_id UUID,  -- Para agrupar parcelas
    
    -- Notas
    notes TEXT,
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,  -- Soft delete
    
    -- Constraints
    CONSTRAINT installment_check CHECK (
        (is_installment = false AND installment_number IS NULL AND total_installments IS NULL) OR
        (is_installment = true AND installment_number > 0 AND total_installments > 0 AND installment_number <= total_installments)
    )
);

-- Índices
CREATE INDEX idx_cc_transactions_user_id ON credit_card_transactions(user_id);
CREATE INDEX idx_cc_transactions_card_id ON credit_card_transactions(credit_card_id);
CREATE INDEX idx_cc_transactions_invoice_id ON credit_card_transactions(invoice_id);
CREATE INDEX idx_cc_transactions_date ON credit_card_transactions(transaction_date DESC);
CREATE INDEX idx_cc_transactions_deleted_at ON credit_card_transactions(deleted_at) WHERE deleted_at IS NULL;

-- =====================================================
-- PARTE 4: ADICIONAR FOREIGN KEYS EM TRANSACTIONS
-- =====================================================

ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_credit_card
    FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id) ON DELETE SET NULL;

ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_invoice
    FOREIGN KEY (credit_card_invoice_id) REFERENCES credit_card_invoices(id) ON DELETE SET NULL;

-- =====================================================
-- PARTE 5: FUNÇÕES DE FATURA
-- =====================================================

-- FUNÇÃO: Buscar ou criar fatura
CREATE OR REPLACE FUNCTION get_or_create_invoice(
    p_user_id UUID,
    p_card_id UUID,
    p_transaction_date DATE
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_closing_day INTEGER;
    v_due_day INTEGER;
    v_ref_month INTEGER;
    v_ref_year INTEGER;
    v_invoice_id UUID;
    v_closing_date DATE;
    v_due_date DATE;
    v_transaction_day INTEGER;
BEGIN
    -- Busca dados do cartão
    SELECT closing_day, due_day
    INTO v_closing_day, v_due_day
    FROM credit_cards
    WHERE id = p_card_id AND deleted_at IS NULL;

    v_transaction_day := EXTRACT(DAY FROM p_transaction_date);

    -- LÓGICA DE FECHAMENTO CORRETA
    IF v_transaction_day < v_closing_day THEN
        v_ref_month := EXTRACT(MONTH FROM p_transaction_date);
        v_ref_year  := EXTRACT(YEAR  FROM p_transaction_date);
    ELSE
        v_ref_month := EXTRACT(MONTH FROM (p_transaction_date + INTERVAL '1 month'));
        v_ref_year  := EXTRACT(YEAR  FROM (p_transaction_date + INTERVAL '1 month'));
    END IF;

    -- Busca fatura existente
    SELECT id INTO v_invoice_id
    FROM credit_card_invoices
    WHERE credit_card_id = p_card_id
      AND reference_month = v_ref_month
      AND reference_year  = v_ref_year
      AND deleted_at IS NULL;

    -- Cria fatura se não existir
    IF v_invoice_id IS NULL THEN
        v_closing_date := make_date(v_ref_year, v_ref_month, 1) + (v_closing_day - 1) * INTERVAL '1 day';
        
        IF v_due_day < v_closing_day THEN
            v_due_date := (make_date(v_ref_year, v_ref_month, 1) + INTERVAL '1 month') + (v_due_day - 1) * INTERVAL '1 day';
        ELSE
            v_due_date := make_date(v_ref_year, v_ref_month, 1) + (v_due_day - 1) * INTERVAL '1 day';
        END IF;

        INSERT INTO credit_card_invoices (
            user_id, credit_card_id, reference_month, reference_year,
            status, closing_date, due_date, total_amount, paid_amount
        )
        VALUES (
            p_user_id, p_card_id, v_ref_month, v_ref_year,
            'open', v_closing_date, v_due_date, 0, 0
        )
        RETURNING id INTO v_invoice_id;
    END IF;

    RETURN v_invoice_id;
END;
$$;

-- FUNÇÃO: Pagar fatura (com rollover)
CREATE OR REPLACE FUNCTION pay_invoice(p_invoice_id UUID, p_amount NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_invoice RECORD;
    v_new_paid_amount NUMERIC;
    v_excess NUMERIC;
    v_next_invoice_id UUID;
    v_status invoice_status;
BEGIN
    SELECT * INTO v_invoice FROM credit_card_invoices WHERE id = p_invoice_id AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found';
    END IF;

    v_new_paid_amount := v_invoice.paid_amount + p_amount;
    
    IF v_new_paid_amount > v_invoice.total_amount THEN
        v_excess := v_new_paid_amount - v_invoice.total_amount;
        v_new_paid_amount := v_invoice.total_amount;
        v_status := 'paid';
    ELSIF v_new_paid_amount = v_invoice.total_amount THEN
        v_excess := 0;
        v_status := 'paid';
    ELSE
        v_excess := 0;
        v_status := 'partial';
    END IF;

    UPDATE credit_card_invoices 
    SET paid_amount = v_new_paid_amount, status = v_status, updated_at = NOW()
    WHERE id = p_invoice_id;

    -- ROLLOVER: Aplica excesso na próxima fatura
    IF v_excess > 0 THEN
        SELECT id INTO v_next_invoice_id
        FROM credit_card_invoices
        WHERE credit_card_id = v_invoice.credit_card_id
          AND deleted_at IS NULL
          AND (reference_year > v_invoice.reference_year 
               OR (reference_year = v_invoice.reference_year AND reference_month > v_invoice.reference_month))
        ORDER BY reference_year ASC, reference_month ASC
        LIMIT 1;

        IF v_next_invoice_id IS NOT NULL THEN
            PERFORM pay_invoice(v_next_invoice_id, v_excess);
        ELSE
            UPDATE credit_card_invoices 
            SET paid_amount = paid_amount + v_excess
            WHERE id = p_invoice_id;
        END IF;
    END IF;
END;
$$;

-- FUNÇÃO: Reverter pagamento
CREATE OR REPLACE FUNCTION revert_payment(p_invoice_id UUID, p_amount NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_card_id UUID;
    v_ref_month INTEGER;
    v_ref_year INTEGER;
    v_target_invoice RECORD;
    v_amount_remaining NUMERIC := p_amount;
    v_deduction NUMERIC;
BEGIN
    SELECT credit_card_id, reference_month, reference_year 
    INTO v_card_id, v_ref_month, v_ref_year
    FROM credit_card_invoices 
    WHERE id = p_invoice_id AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found';
    END IF;

    FOR v_target_invoice IN 
        SELECT id, paid_amount, total_amount, status
        FROM credit_card_invoices
        WHERE credit_card_id = v_card_id
          AND deleted_at IS NULL
          AND (reference_year > v_ref_year 
               OR (reference_year = v_ref_year AND reference_month >= v_ref_month))
          AND paid_amount > 0
        ORDER BY reference_year ASC, reference_month ASC
    LOOP
        IF v_amount_remaining > 0 THEN
            v_deduction := LEAST(v_target_invoice.paid_amount, v_amount_remaining);
            
            UPDATE credit_card_invoices
            SET paid_amount = paid_amount - v_deduction,
                status = CASE 
                    WHEN (paid_amount - v_deduction) >= total_amount THEN 'paid'::invoice_status
                    WHEN (paid_amount - v_deduction) > 0 THEN 'partial'::invoice_status
                    ELSE 'closed'::invoice_status
                END,
                updated_at = NOW()
            WHERE id = v_target_invoice.id;

            v_amount_remaining := v_amount_remaining - v_deduction;
        ELSE
            EXIT;
        END IF;
    END LOOP;
END;
$$;

-- FUNÇÃO: Criar compra parcelada
CREATE OR REPLACE FUNCTION create_installment_purchase(
    p_user_id UUID,
    p_card_id UUID,
    p_description TEXT,
    p_total_amount NUMERIC,
    p_purchase_date DATE,
    p_total_installments INTEGER,
    p_category_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_amount_per_installment NUMERIC := p_total_amount / p_total_installments;
    v_current_date DATE := p_purchase_date;
    v_invoice_id UUID;
    v_group_id UUID := gen_random_uuid();
    i INTEGER;
BEGIN
    FOR i IN 1..p_total_installments LOOP
        v_invoice_id := get_or_create_invoice(p_user_id, p_card_id, v_current_date);

        INSERT INTO credit_card_transactions (
            user_id, credit_card_id, invoice_id, description, amount,
            transaction_date, is_installment, installment_number,
            total_installments, category_id, transaction_type, group_id
        )
        VALUES (
            p_user_id, p_card_id, v_invoice_id, p_description,
            v_amount_per_installment, v_current_date, TRUE, i,
            p_total_installments, p_category_id, 'purchase', v_group_id
        );

        v_current_date := v_current_date + INTERVAL '1 month';
    END LOOP;
END;
$$;

-- =====================================================
-- PARTE 6: TRIGGERS
-- =====================================================

-- Trigger: updated_at
CREATE TRIGGER set_credit_cards_updated_at
    BEFORE UPDATE ON credit_cards
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_invoices_updated_at
    BEFORE UPDATE ON credit_card_invoices
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_cc_transactions_updated_at
    BEFORE UPDATE ON credit_card_transactions
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Trigger: Atualizar total da fatura
CREATE OR REPLACE FUNCTION update_invoice_total()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE credit_card_invoices
        SET total_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM credit_card_transactions
            WHERE invoice_id = OLD.invoice_id AND deleted_at IS NULL
        )
        WHERE id = OLD.invoice_id;
        RETURN OLD;
    ELSE
        UPDATE credit_card_invoices
        SET total_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM credit_card_transactions
            WHERE invoice_id = NEW.invoice_id AND deleted_at IS NULL
        )
        WHERE id = NEW.invoice_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_total
    AFTER INSERT OR UPDATE OR DELETE ON credit_card_transactions
    FOR EACH ROW EXECUTE FUNCTION update_invoice_total();

-- =====================================================
-- PARTE 7: RLS
-- =====================================================

ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cards" ON credit_cards FOR ALL
    USING (auth.uid() = user_id AND deleted_at IS NULL) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own invoices" ON credit_card_invoices FOR ALL
    USING (auth.uid() = user_id AND deleted_at IS NULL) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own cc transactions" ON credit_card_transactions FOR ALL
    USING (auth.uid() = user_id AND deleted_at IS NULL) WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PARTE 8: GRANTS E COMENTÁRIOS
-- =====================================================

GRANT ALL ON TABLE credit_cards TO authenticated;
GRANT ALL ON TABLE credit_card_invoices TO authenticated;
GRANT ALL ON TABLE credit_card_transactions TO authenticated;

COMMENT ON TABLE credit_cards IS 'Cartões de crédito dos usuários';
COMMENT ON TABLE credit_card_invoices IS 'Faturas de cartão de crédito com suporte a rollover';
COMMENT ON TABLE credit_card_transactions IS 'Transações do cartão de crédito';
COMMENT ON FUNCTION get_or_create_invoice(UUID, UUID, DATE) IS 'Busca ou cria fatura baseada na data da compra';
COMMENT ON FUNCTION pay_invoice(UUID, NUMERIC) IS 'Paga fatura com suporte a rollover (excesso vai para próxima fatura)';
COMMENT ON FUNCTION revert_payment(UUID, NUMERIC) IS 'Reverte pagamento de fatura';
COMMENT ON FUNCTION create_installment_purchase(UUID, UUID, TEXT, NUMERIC, DATE, INTEGER, UUID) IS 'Cria compra parcelada no cartão';

-- =====================================================
-- FIM DA MIGRATION 005
-- =====================================================
