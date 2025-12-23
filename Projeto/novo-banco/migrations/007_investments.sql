-- =====================================================
-- MIGRATION 007: INVESTMENTS
-- Descrição: Sistema de investimentos e rendimentos
-- Data: 23/12/2025
-- Autor: FinCore Team
-- =====================================================

-- =====================================================
-- PARTE 1: TABELA DE INVESTIMENTOS
-- =====================================================

CREATE TABLE investments (
    -- Identificação
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    
    -- Dados do Investimento
    ticker VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type investment_type NOT NULL,
    
    -- Quantidades e Preços
    quantity NUMERIC(15, 8) DEFAULT 0,
    average_price NUMERIC(15, 2) DEFAULT 0,
    current_price NUMERIC(15, 2) DEFAULT 0,
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,  -- Soft delete
    
    -- Constraints
    CONSTRAINT quantity_check CHECK (quantity >= 0),
    CONSTRAINT prices_check CHECK (average_price >= 0 AND current_price >= 0)
);

-- Índices
CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_account_id ON investments(account_id);
CREATE INDEX idx_investments_ticker ON investments(ticker);
CREATE INDEX idx_investments_deleted_at ON investments(deleted_at) WHERE deleted_at IS NULL;

-- =====================================================
-- PARTE 2: TABELA DE TRANSAÇÕES DE INVESTIMENTO
-- =====================================================

CREATE TABLE investment_transactions (
    -- Identificação
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    
    -- Dados da Transação
    type transaction_type NOT NULL,  -- 'receita' (compra) ou 'despesa' (venda)
    date DATE NOT NULL,
    quantity NUMERIC(15, 8) NOT NULL CHECK (quantity > 0),
    price NUMERIC(15, 2) NOT NULL CHECK (price > 0),
    total_amount NUMERIC(15, 2) NOT NULL,
    fees NUMERIC(15, 2) DEFAULT 0,
    notes TEXT,
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ  -- Soft delete
);

-- Índices
CREATE INDEX idx_inv_transactions_investment_id ON investment_transactions(investment_id);
CREATE INDEX idx_inv_transactions_date ON investment_transactions(date DESC);
CREATE INDEX idx_inv_transactions_deleted_at ON investment_transactions(deleted_at) WHERE deleted_at IS NULL;

-- =====================================================
-- PARTE 3: TABELA DE PREÇOS DE ATIVOS
-- =====================================================

CREATE TABLE asset_prices (
    ticker VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    close_price NUMERIC(15, 2) NOT NULL CHECK (close_price > 0),
    
    PRIMARY KEY (ticker, date)
);

-- Índices
CREATE INDEX idx_asset_prices_ticker ON asset_prices(ticker);
CREATE INDEX idx_asset_prices_date ON asset_prices(date DESC);

-- =====================================================
-- PARTE 4: TABELA DE RENDIMENTOS DE LIQUIDEZ
-- =====================================================

CREATE TABLE liquidity_yields (
    -- Identificação
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    
    -- Dados do Rendimento
    date DATE NOT NULL,
    base_amount NUMERIC(15, 2) NOT NULL,
    yield_amount NUMERIC(15, 2) NOT NULL,
    rate_applied DOUBLE PRECISION NOT NULL,
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_yield_per_account_date UNIQUE (account_id, date),
    CONSTRAINT amounts_check CHECK (base_amount >= 0 AND yield_amount >= 0),
    CONSTRAINT rate_check CHECK (rate_applied >= 0 AND rate_applied <= 100)
);

-- Índices
CREATE INDEX idx_liquidity_yields_account_id ON liquidity_yields(account_id);
CREATE INDEX idx_liquidity_yields_date ON liquidity_yields(date DESC);

-- =====================================================
-- PARTE 5: TRIGGERS
-- =====================================================

CREATE TRIGGER set_investments_updated_at
    BEFORE UPDATE ON investments
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- =====================================================
-- PARTE 6: RLS
-- =====================================================

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidity_yields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own investments" ON investments FOR ALL
    USING (auth.uid() = user_id AND deleted_at IS NULL) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own inv transactions" ON investment_transactions FOR ALL
    USING (investment_id IN (SELECT id FROM investments WHERE user_id = auth.uid() AND deleted_at IS NULL))
    WITH CHECK (investment_id IN (SELECT id FROM investments WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view asset prices" ON asset_prices FOR SELECT USING (true);

CREATE POLICY "Users can view own yields" ON liquidity_yields FOR SELECT
    USING (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid() AND deleted_at IS NULL));

-- =====================================================
-- PARTE 7: GRANTS E COMENTÁRIOS
-- =====================================================

GRANT ALL ON TABLE investments TO authenticated;
GRANT ALL ON TABLE investment_transactions TO authenticated;
GRANT SELECT ON TABLE asset_prices TO authenticated;
GRANT SELECT ON TABLE liquidity_yields TO authenticated;

COMMENT ON TABLE investments IS 'Investimentos dos usuários (ações, FIIs, cripto, etc)';
COMMENT ON TABLE investment_transactions IS 'Transações de compra/venda de investimentos';
COMMENT ON TABLE asset_prices IS 'Preços históricos de ativos';
COMMENT ON TABLE liquidity_yields IS 'Rendimentos de contas de liquidez';

-- =====================================================
-- FIM DA MIGRATION 007
-- =====================================================
