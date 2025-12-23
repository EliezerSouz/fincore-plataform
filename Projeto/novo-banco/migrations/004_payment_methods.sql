-- =====================================================
-- MIGRATION 004: PAYMENT METHODS
-- Descrição: Métodos de pagamento do sistema
-- Data: 23/12/2025
-- Autor: FinCore Team
-- =====================================================

-- =====================================================
-- PARTE 1: TABELA DE MÉTODOS DE PAGAMENTO
-- =====================================================

CREATE TABLE payment_methods (
    -- Identificação
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Dados do Método
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    type payment_method_type NOT NULL,
    icon VARCHAR(50),
    
    -- Configurações
    allows_income BOOLEAN DEFAULT true,
    allows_expense BOOLEAN DEFAULT true,
    allows_transfer BOOLEAN DEFAULT false,
    affects_balance BOOLEAN DEFAULT true,
    affects_credit_card BOOLEAN DEFAULT false,
    affects_invoice BOOLEAN DEFAULT false,
    is_internal BOOLEAN DEFAULT false,
    requires_bank_account BOOLEAN DEFAULT true,
    
    -- Ordenação e Status
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,  -- Soft delete
    
    -- Constraints
    CONSTRAINT unique_payment_method_slug UNIQUE (user_id, slug)
);

-- Índices
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_type ON payment_methods(type);
CREATE INDEX idx_payment_methods_deleted_at ON payment_methods(deleted_at) WHERE deleted_at IS NULL;

-- =====================================================
-- PARTE 2: ADICIONAR FOREIGN KEY EM TRANSACTIONS
-- =====================================================

ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_payment_method
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL;

-- =====================================================
-- PARTE 3: FUNÇÃO DE CRIAÇÃO DE MÉTODOS PADRÃO
-- =====================================================

CREATE OR REPLACE FUNCTION create_default_payment_methods(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    user_slug_suffix TEXT;
BEGIN
    -- Gerar sufixo único baseado no user_id
    user_slug_suffix := SUBSTRING(p_user_id::TEXT, 1, 8);

    -- Inserir métodos padrão (ON CONFLICT DO NOTHING para evitar duplicatas)
    INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES
        (p_user_id, 'PIX', 'pix-' || user_slug_suffix, 'PIX', true, true, true, true, false, false, false, '⚡', 1, true),
        (p_user_id, 'Dinheiro', 'dinheiro-' || user_slug_suffix, 'CASH', true, true, false, true, false, false, false, '💵', 2, true),
        (p_user_id, 'Cartão de Crédito', 'cartao-credito-' || user_slug_suffix, 'CREDIT_CARD', false, true, false, false, true, true, false, '💳', 3, true),
        (p_user_id, 'Cartão de Débito', 'cartao-debito-' || user_slug_suffix, 'DEBIT_CARD', false, true, false, true, false, false, false, '💳', 4, true),
        (p_user_id, 'Transferência Bancária', 'transferencia-bancaria-' || user_slug_suffix, 'BANK_TRANSFER', true, true, true, true, false, false, false, '🏦', 5, true),
        (p_user_id, 'Boleto', 'boleto-' || user_slug_suffix, 'BOLETO', true, true, false, true, false, false, false, '📄', 6, true),
        (p_user_id, 'Débito Automático', 'debito-automatico-' || user_slug_suffix, 'AUTOMATIC', false, true, false, true, false, false, false, '🔄', 7, true),
        (p_user_id, 'Transferência Interna', 'transferencia-interna-' || user_slug_suffix, 'INTERNAL_TRANSFER', false, false, true, false, false, false, true, '🔄', 8, true),
        (p_user_id, 'Outro', 'outro-' || user_slug_suffix, 'OTHER', true, true, false, true, false, false, false, '📝', 99, true)
    ON CONFLICT (user_id, slug) DO NOTHING;
END;
$$;

-- =====================================================
-- PARTE 4: ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Policy consolidada: Usuários podem gerenciar seus próprios métodos
CREATE POLICY "Users can manage own payment methods"
    ON payment_methods
    FOR ALL
    USING (auth.uid() = user_id AND deleted_at IS NULL)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PARTE 5: GRANTS
-- =====================================================

GRANT ALL ON TABLE payment_methods TO authenticated;

-- =====================================================
-- PARTE 6: COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE payment_methods IS 'Métodos de pagamento disponíveis para o usuário';
COMMENT ON FUNCTION create_default_payment_methods(UUID) IS 'Cria métodos de pagamento padrão para novo usuário';

-- =====================================================
-- FIM DA MIGRATION 004
-- =====================================================
