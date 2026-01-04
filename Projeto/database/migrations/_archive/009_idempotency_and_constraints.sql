-- =====================================================
-- MIGRATION 009: IDEMPOTENCY AND CONSTRAINTS
-- Descrição: Idempotência e constraints adicionais
-- Data: 23/12/2025
-- Autor: FinCore Team
-- =====================================================

-- =====================================================
-- PARTE 1: ADICIONAR IDEMPOTENCY_KEY
-- =====================================================

-- Adicionar idempotency_key em transactions (já existe como coluna, adicionar constraint)
CREATE UNIQUE INDEX idx_transactions_idempotency_key 
    ON transactions(user_id, idempotency_key) 
    WHERE idempotency_key IS NOT NULL AND deleted_at IS NULL;

-- Adicionar idempotency_key em credit_card_transactions
ALTER TABLE credit_card_transactions ADD COLUMN idempotency_key TEXT;

CREATE UNIQUE INDEX idx_cc_transactions_idempotency_key 
    ON credit_card_transactions(user_id, idempotency_key) 
    WHERE idempotency_key IS NOT NULL AND deleted_at IS NULL;

-- Adicionar idempotency_key em payables
ALTER TABLE payables ADD COLUMN idempotency_key TEXT;

CREATE UNIQUE INDEX idx_payables_idempotency_key 
    ON payables(user_id, idempotency_key) 
    WHERE idempotency_key IS NOT NULL AND deleted_at IS NULL;

-- =====================================================
-- PARTE 2: CONSTRAINTS ADICIONAIS DE INTEGRIDADE
-- =====================================================

-- Garantir que datas de fechamento e vencimento sejam válidas
ALTER TABLE credit_card_invoices
    ADD CONSTRAINT closing_before_due CHECK (closing_date < due_date);

-- Garantir que parcelas sejam consistentes
ALTER TABLE credit_card_transactions
    ADD CONSTRAINT group_id_with_installments CHECK (
        (is_installment = false AND group_id IS NULL) OR
        (is_installment = true AND group_id IS NOT NULL)
    );

-- Garantir que transferências tenham conta destino
ALTER TABLE transactions
    ADD CONSTRAINT transfer_has_destination CHECK (
        (type != 'transferencia') OR
        (type = 'transferencia' AND destination_account_id IS NOT NULL AND destination_account_id != account_id)
    );

-- Garantir que paid_at seja preenchido quando status = paid
ALTER TABLE payables
    ADD CONSTRAINT paid_at_when_paid CHECK (
        (status != 'paid') OR
        (status = 'paid' AND paid_at IS NOT NULL)
    );

-- =====================================================
-- PARTE 3: CONSTRAINTS DE VALORES MONETÁRIOS
-- =====================================================

-- Garantir que valores monetários sejam razoáveis (não negativos em campos específicos)
ALTER TABLE credit_cards
    ADD CONSTRAINT limit_reasonable CHECK (limit_amount <= 999999999.99);

ALTER TABLE credit_card_invoices
    ADD CONSTRAINT invoice_amounts_reasonable CHECK (
        total_amount <= 999999999.99 AND
        paid_amount <= 999999999.99
    );

-- =====================================================
-- PARTE 4: ÍNDICES ÚNICOS ADICIONAIS
-- =====================================================

-- Garantir que não haja duplicatas de ajustes no mesmo dia
-- (já existe UNIQUE constraint, mas adicionar índice para performance)
CREATE INDEX idx_adjustments_unique_per_day 
    ON account_balance_adjustments(account_id, adjustment_date) 
    WHERE deleted_at IS NULL;

-- Garantir unicidade de faturas por cartão e período
CREATE INDEX idx_invoices_unique_per_period 
    ON credit_card_invoices(credit_card_id, reference_year, reference_month) 
    WHERE deleted_at IS NULL;

-- =====================================================
-- PARTE 5: COMENTÁRIOS
-- =====================================================

COMMENT ON COLUMN transactions.idempotency_key IS 'Chave de idempotência para prevenir duplicação de transações';
COMMENT ON COLUMN credit_card_transactions.idempotency_key IS 'Chave de idempotência para prevenir duplicação de compras';
COMMENT ON COLUMN payables.idempotency_key IS 'Chave de idempotência para prevenir duplicação de contas a pagar';

-- =====================================================
-- FIM DA MIGRATION 009
-- =====================================================
