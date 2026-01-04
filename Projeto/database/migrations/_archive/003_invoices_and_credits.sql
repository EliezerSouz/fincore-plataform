-- ========================================
-- MIGRATION: Faturas de Cartão de Crédito
-- Versão: 1.0
-- Data: 24/12/2025
-- ========================================

-- ========================================
-- 1. TABELA DE EVENTOS FINANCEIROS
-- ========================================
CREATE TABLE IF NOT EXISTS financial_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'LANCAMENTO_CARTAO',
        'PAGAMENTO_FATURA',
        'PAGAMENTO_ANTECIPADO',
        'CREDITO_ANTECIPADO',
        'ESTORNO'
    )),
    invoice_id UUID NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    
    -- Rastreabilidade
    origin_invoice_id UUID,
    related_event_id UUID,
    
    -- Impacto Financeiro
    account_id UUID,
    balance_impact DECIMAL(15,2) DEFAULT 0,
    
    -- Metadados
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reverted_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT fk_financial_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_financial_events_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_financial_events_user ON financial_events(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_events_invoice ON financial_events(invoice_id);
CREATE INDEX IF NOT EXISTS idx_financial_events_type ON financial_events(type);
CREATE INDEX IF NOT EXISTS idx_financial_events_created ON financial_events(created_at DESC);

-- ========================================
-- 2. TABELA DE CRÉDITOS ANTECIPADOS
-- ========================================
CREATE TABLE IF NOT EXISTS credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    origin_invoice_id UUID NOT NULL,
    current_invoice_id UUID,
    original_amount DECIMAL(15,2) NOT NULL CHECK (original_amount > 0),
    remaining_amount DECIMAL(15,2) NOT NULL CHECK (remaining_amount >= 0),
    is_consumed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_credits_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_credits_remaining CHECK (remaining_amount <= original_amount)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_credits_user ON credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_origin ON credits(origin_invoice_id);
CREATE INDEX IF NOT EXISTS idx_credits_current ON credits(current_invoice_id);
CREATE INDEX IF NOT EXISTS idx_credits_consumed ON credits(is_consumed) WHERE is_consumed = false;

-- ========================================
-- 3. ATUALIZAR TABELA DE FATURAS
-- ========================================
-- Adicionar novos campos se a tabela já existir
DO $$ 
BEGIN
    -- Adicionar inherited_credit se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'inherited_credit'
    ) THEN
        ALTER TABLE invoices ADD COLUMN inherited_credit DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    -- Adicionar generated_credit se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'generated_credit'
    ) THEN
        ALTER TABLE invoices ADD COLUMN generated_credit DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    -- Adicionar status ESTORNADA se não existir
    -- (Assumindo que status é um ENUM ou VARCHAR)
    -- Verificar e adicionar conforme necessário
END $$;

-- ========================================
-- 4. FUNÇÃO: Calcular Limite Disponível
-- ========================================
CREATE OR REPLACE FUNCTION calculate_available_limit(
    p_credit_card_id UUID
)
RETURNS DECIMAL(15,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_credit_limit DECIMAL(15,2);
    v_total_debt DECIMAL(15,2);
    v_total_credit DECIMAL(15,2);
BEGIN
    -- Buscar limite do cartão
    SELECT credit_limit INTO v_credit_limit
    FROM credit_cards
    WHERE id = p_credit_card_id;
    
    -- Calcular dívida total (faturas não quitadas)
    SELECT COALESCE(SUM(remaining_amount), 0) INTO v_total_debt
    FROM invoices
    WHERE credit_card_id = p_credit_card_id
        AND status != 'QUITADA'
        AND deleted_at IS NULL;
    
    -- Calcular créditos ativos
    SELECT COALESCE(SUM(c.remaining_amount), 0) INTO v_total_credit
    FROM credits c
    JOIN invoices i ON c.current_invoice_id = i.id
    WHERE i.credit_card_id = p_credit_card_id
        AND c.is_consumed = false;
    
    -- Retornar limite disponível
    RETURN v_credit_limit - v_total_debt + v_total_credit;
END;
$$;

-- ========================================
-- 5. FUNÇÃO: Validar Soma de Lançamentos
-- ========================================
CREATE OR REPLACE FUNCTION validate_invoice_total(
    p_invoice_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_invoice_total DECIMAL(15,2);
    v_calculated_total DECIMAL(15,2);
BEGIN
    -- Buscar total da fatura
    SELECT total_amount INTO v_invoice_total
    FROM invoices
    WHERE id = p_invoice_id;
    
    -- Calcular soma de lançamentos
    SELECT COALESCE(SUM(amount), 0) INTO v_calculated_total
    FROM transactions
    WHERE invoice_id = p_invoice_id
        AND deleted_at IS NULL;
    
    -- Retornar se está consistente
    RETURN v_invoice_total = v_calculated_total;
END;
$$;

-- ========================================
-- 6. TRIGGER: Atualizar updated_at em credits
-- ========================================
CREATE OR REPLACE FUNCTION update_credits_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_credits_timestamp
    BEFORE UPDATE ON credits
    FOR EACH ROW
    EXECUTE FUNCTION update_credits_timestamp();

-- ========================================
-- 7. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ========================================
COMMENT ON TABLE financial_events IS 'Registro imutável de todos os eventos financeiros relacionados a faturas';
COMMENT ON TABLE credits IS 'Créditos antecipados com rastreabilidade de origem e consumo';
COMMENT ON COLUMN financial_events.type IS 'Tipo de evento: LANCAMENTO_CARTAO, PAGAMENTO_FATURA, PAGAMENTO_ANTECIPADO, CREDITO_ANTECIPADO, ESTORNO';
COMMENT ON COLUMN credits.origin_invoice_id IS 'Fatura que gerou o crédito (rastreabilidade obrigatória)';
COMMENT ON COLUMN credits.current_invoice_id IS 'Fatura atual onde o crédito está alocado';
COMMENT ON FUNCTION calculate_available_limit IS 'Calcula limite disponível do cartão considerando dívidas e créditos';
COMMENT ON FUNCTION validate_invoice_total IS 'Valida se a soma dos lançamentos corresponde ao total da fatura';

-- ========================================
-- FIM DA MIGRATION
-- ========================================
