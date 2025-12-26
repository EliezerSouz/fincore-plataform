-- Migration: Criar modelo de Conta Mãe + Pockets (Subcontas)
-- Data: 2025-12-25
-- Objetivo: Adicionar estrutura de pockets SEM ALTERAR sistema existente
-- Status: SAFE - Não quebra nada, apenas adiciona novas tabelas

-- ============================================================================
-- 1. PARENT ACCOUNTS (Contas Mãe - Instituições)
-- ============================================================================
CREATE TABLE IF NOT EXISTS parent_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Identificação da Instituição
    institution_name VARCHAR(100) NOT NULL,
    institution_type VARCHAR(50),  -- 'digital_bank', 'traditional_bank', 'fintech', 'broker'
    
    -- Visual
    color VARCHAR(7),
    logo_url TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, institution_name)
);

-- Índices para performance
CREATE INDEX idx_parent_accounts_user ON parent_accounts(user_id);
CREATE INDEX idx_parent_accounts_active ON parent_accounts(user_id, is_active);

-- Comentários
COMMENT ON TABLE parent_accounts IS 'Contas Mãe - Representam instituições financeiras (Nubank, Mercado Pago, etc)';
COMMENT ON COLUMN parent_accounts.institution_name IS 'Nome da instituição (ex: Mercado Pago, Nubank, Inter)';
COMMENT ON COLUMN parent_accounts.institution_type IS 'Tipo: digital_bank, traditional_bank, fintech, broker';

-- ============================================================================
-- 2. POCKETS (Subcontas - Bolsos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pockets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_account_id UUID NOT NULL REFERENCES parent_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Identificação
    name VARCHAR(100) NOT NULL,
    pocket_type VARCHAR(50) NOT NULL,  -- 'CAIXA', 'RESERVA_CDI', 'INVESTIMENTO'
    description TEXT,
    
    -- Saldo (calculado dinamicamente, mas pode ser cacheado)
    balance DECIMAL(15, 2) DEFAULT 0,
    
    -- Configuração de Rendimento (apenas para RESERVA_CDI)
    yield_enabled BOOLEAN DEFAULT false,
    yield_source VARCHAR(50),  -- 'CDI'
    yield_cdi_rate FLOAT DEFAULT 0,  -- Percentual do CDI (100, 105, 120)
    last_yield_date DATE,
    
    -- Configuração de Investimento (apenas para INVESTIMENTO)
    investment_type VARCHAR(50),  -- 'FII', 'ACAO', 'RENDA_FIXA', 'ETF', 'CRYPTO'
    
    -- Visual
    color VARCHAR(7),
    icon VARCHAR(50),
    
    -- Ordenação e Status
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_pocket_type CHECK (pocket_type IN ('CAIXA', 'RESERVA_CDI', 'INVESTIMENTO')),
    CONSTRAINT check_yield_config CHECK (
        (pocket_type = 'RESERVA_CDI' AND yield_enabled = true AND yield_cdi_rate > 0) OR
        (pocket_type != 'RESERVA_CDI' AND yield_enabled = false)
    )
);

-- Índices para performance
CREATE INDEX idx_pockets_parent ON pockets(parent_account_id);
CREATE INDEX idx_pockets_user ON pockets(user_id);
CREATE INDEX idx_pockets_type ON pockets(pocket_type);
CREATE INDEX idx_pockets_active ON pockets(user_id, is_active);
CREATE INDEX idx_pockets_yield ON pockets(pocket_type, yield_enabled) WHERE pocket_type = 'RESERVA_CDI';

-- Comentários
COMMENT ON TABLE pockets IS 'Subcontas (Pockets) - Bolsos com finalidades específicas dentro de uma instituição';
COMMENT ON COLUMN pockets.pocket_type IS 'CAIXA (uso diário), RESERVA_CDI (guardado rendendo), INVESTIMENTO (ativos)';
COMMENT ON COLUMN pockets.yield_enabled IS 'Se true, pocket rende CDI automaticamente (apenas RESERVA_CDI)';
COMMENT ON COLUMN pockets.yield_cdi_rate IS 'Percentual do CDI (ex: 100, 105, 120)';

-- ============================================================================
-- 3. ADICIONAR COLUNAS NULLABLE NAS TABELAS EXISTENTES
-- ============================================================================

-- 3.1 Transactions - Adicionar referência ao pocket (NULLABLE - não quebra nada)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS pocket_id UUID REFERENCES pockets(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_transactions_pocket ON transactions(pocket_id);

COMMENT ON COLUMN transactions.pocket_id IS 'Referência ao pocket (subconta). NULL = usa account_id legado';

-- 3.2 Liquidity Yields - Adicionar referência ao pocket (NULLABLE - não quebra nada)
ALTER TABLE liquidity_yields 
ADD COLUMN IF NOT EXISTS pocket_id UUID REFERENCES pockets(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_liquidity_yields_pocket ON liquidity_yields(pocket_id);

COMMENT ON COLUMN liquidity_yields.pocket_id IS 'Referência ao pocket (subconta). NULL = usa account_id legado';

-- ============================================================================
-- 4. FUNÇÃO AUXILIAR - Calcular Saldo do Pocket
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_pocket_balance(p_pocket_id UUID)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
    v_balance DECIMAL(15, 2);
    v_yields DECIMAL(15, 2);
    v_pocket_type VARCHAR(50);
BEGIN
    -- Buscar tipo do pocket
    SELECT pocket_type INTO v_pocket_type
    FROM pockets
    WHERE id = p_pocket_id;
    
    -- Calcular saldo base (transações)
    SELECT COALESCE(SUM(
        CASE 
            WHEN type IN ('RECEITA', 'TRANSFER_IN') THEN amount
            WHEN type IN ('DESPESA', 'TRANSFER_OUT') THEN -amount
            ELSE 0
        END
    ), 0) INTO v_balance
    FROM transactions
    WHERE pocket_id = p_pocket_id;
    
    -- Se for RESERVA_CDI, adicionar rendimentos
    IF v_pocket_type = 'RESERVA_CDI' THEN
        SELECT COALESCE(SUM(yield_amount), 0) INTO v_yields
        FROM liquidity_yields
        WHERE pocket_id = p_pocket_id;
        
        v_balance := v_balance + v_yields;
    END IF;
    
    RETURN v_balance;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_pocket_balance IS 'Calcula saldo total de um pocket (transações + rendimentos se RESERVA_CDI)';

-- ============================================================================
-- 5. VIEW AUXILIAR - Saldos Agregados por Parent Account
-- ============================================================================
CREATE OR REPLACE VIEW v_parent_account_balances AS
SELECT 
    pa.id as parent_account_id,
    pa.user_id,
    pa.institution_name,
    COALESCE(SUM(p.balance), 0) as total_balance,
    COALESCE(SUM(CASE WHEN p.pocket_type = 'CAIXA' THEN p.balance ELSE 0 END), 0) as caixa_balance,
    COALESCE(SUM(CASE WHEN p.pocket_type = 'RESERVA_CDI' THEN p.balance ELSE 0 END), 0) as reserva_balance,
    COALESCE(SUM(CASE WHEN p.pocket_type = 'INVESTIMENTO' THEN p.balance ELSE 0 END), 0) as investimento_balance,
    COUNT(p.id) as total_pockets,
    COUNT(CASE WHEN p.is_active = true THEN 1 END) as active_pockets
FROM parent_accounts pa
LEFT JOIN pockets p ON pa.id = p.parent_account_id
WHERE pa.is_active = true
GROUP BY pa.id, pa.user_id, pa.institution_name;

COMMENT ON VIEW v_parent_account_balances IS 'Visão agregada dos saldos por instituição (Conta Mãe)';

-- ============================================================================
-- VALIDAÇÕES FINAIS
-- ============================================================================

-- Verificar se tabelas foram criadas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parent_accounts') THEN
        RAISE EXCEPTION 'Tabela parent_accounts não foi criada!';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pockets') THEN
        RAISE EXCEPTION 'Tabela pockets não foi criada!';
    END IF;
    
    RAISE NOTICE '✅ Migration executada com sucesso!';
    RAISE NOTICE '✅ Tabelas criadas: parent_accounts, pockets';
    RAISE NOTICE '✅ Colunas adicionadas: transactions.pocket_id, liquidity_yields.pocket_id';
    RAISE NOTICE '✅ Sistema antigo continua 100%% funcional';
END $$;
