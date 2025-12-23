-- =====================================================
-- MIGRATION 002: ACCOUNTS AND TRANSACTIONS
-- Descrição: Contas financeiras e transações com locks e soft delete
-- Data: 23/12/2025
-- Autor: FinCore Team
-- =====================================================

-- =====================================================
-- PARTE 1: TABELA DE CONTAS
-- =====================================================

CREATE TABLE accounts (
    -- Identificação
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Dados da Conta
    name TEXT NOT NULL,
    type account_type NOT NULL DEFAULT 'outros',
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    
    -- Personalização
    color TEXT DEFAULT '#3b82f6',
    icon TEXT,
    
    -- Rendimento (para contas de liquidez)
    yield_rate DOUBLE PRECISION DEFAULT 0,
    last_yield_date DATE,
    
    -- Flags
    is_active BOOLEAN DEFAULT true,
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,  -- Soft delete
    
    -- Constraints
    CONSTRAINT accounts_balance_check CHECK (balance >= -999999999.99 AND balance <= 999999999.99),
    CONSTRAINT accounts_yield_rate_check CHECK (yield_rate >= 0 AND yield_rate <= 100)
);

-- Índices
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_deleted_at ON accounts(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_accounts_user_active ON accounts(user_id, is_active) WHERE deleted_at IS NULL;

-- =====================================================
-- PARTE 2: TABELA DE TRANSAÇÕES
-- =====================================================

CREATE TABLE transactions (
    -- Identificação
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contas
    account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
    destination_account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
    
    -- Categorização (será criada na migration 003)
    category_id UUID,  -- REFERENCES categories(id) ON DELETE SET NULL
    subcategory_id UUID,  -- REFERENCES subcategories(id) ON DELETE SET NULL
    
    -- Dados da Transação
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    type transaction_type NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Status
    is_paid BOOLEAN DEFAULT true,
    
    -- Método de Pagamento (será criada na migration 004)
    payment_method_id UUID,  -- REFERENCES payment_methods(id) ON DELETE SET NULL
    
    -- Vinculações
    credit_card_id UUID,  -- REFERENCES credit_cards(id) (migration 005)
    credit_card_invoice_id UUID,  -- REFERENCES credit_card_invoices(id) (migration 005)
    payable_id UUID,  -- REFERENCES payables(id) (migration 006)
    related_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    
    -- Parcelamento
    installment_number INTEGER,
    total_installments INTEGER,
    
    -- Flags Especiais
    is_historical BOOLEAN DEFAULT false,  -- Transação histórica (antes do controle)
    is_adjustment BOOLEAN DEFAULT false,  -- Ajuste manual de saldo
    
    -- Anexos e Notas
    notes TEXT,
    attachment_url TEXT,
    
    -- Idempotência (será adicionada na migration 009)
    idempotency_key TEXT,
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,  -- Soft delete
    
    -- Constraints
    CONSTRAINT transactions_amount_positive CHECK (amount > 0),
    CONSTRAINT transactions_installment_check CHECK (
        (installment_number IS NULL AND total_installments IS NULL) OR
        (installment_number > 0 AND total_installments > 0 AND installment_number <= total_installments)
    ),
    CONSTRAINT transactions_transfer_check CHECK (
        (type = 'transferencia' AND destination_account_id IS NOT NULL) OR
        (type != 'transferencia' AND destination_account_id IS NULL)
    )
);

-- Índices
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_destination_account_id ON transactions(destination_account_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_is_paid ON transactions(is_paid);
CREATE INDEX idx_transactions_deleted_at ON transactions(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_account_date ON transactions(account_id, date DESC) WHERE deleted_at IS NULL AND is_paid = true;

-- =====================================================
-- PARTE 3: TABELA DE AJUSTES DE SALDO
-- =====================================================

CREATE TABLE account_balance_adjustments (
    -- Identificação
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    
    -- Dados do Ajuste
    adjustment_date DATE NOT NULL,
    balance NUMERIC(15, 2) NOT NULL,
    type TEXT NOT NULL,  -- 'manual', 'reconciliation', 'migration'
    notes TEXT,
    
    -- Flag
    starts_controlled_period BOOLEAN DEFAULT true,
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,  -- Soft delete
    
    -- Constraints
    CONSTRAINT unique_adjustment_per_account_date UNIQUE (account_id, adjustment_date),
    CONSTRAINT adjustment_balance_check CHECK (balance >= -999999999.99 AND balance <= 999999999.99)
);

-- Índices
CREATE INDEX idx_adjustments_user_id ON account_balance_adjustments(user_id);
CREATE INDEX idx_adjustments_account_id ON account_balance_adjustments(account_id);
CREATE INDEX idx_adjustments_date ON account_balance_adjustments(adjustment_date DESC);
CREATE INDEX idx_adjustments_deleted_at ON account_balance_adjustments(deleted_at) WHERE deleted_at IS NULL;

-- =====================================================
-- PARTE 4: FUNÇÃO DE ATUALIZAÇÃO DE SALDO (COM LOCKS!)
-- =====================================================

CREATE OR REPLACE FUNCTION handle_balance_update()
RETURNS TRIGGER AS $$
DECLARE
    v_account_balance NUMERIC;
    v_dest_account_balance NUMERIC;
BEGIN
    -- ---------------------------------------------------
    -- CENÁRIO 1: INSERT (Nova Transação)
    -- ---------------------------------------------------
    IF (TG_OP = 'INSERT') THEN
        IF NEW.is_paid = true AND NEW.deleted_at IS NULL THEN
            
            -- Receita: Soma na conta
            IF NEW.type = 'receita' THEN
                -- LOCK PESSIMISTA da conta antes de atualizar
                SELECT balance INTO v_account_balance 
                FROM accounts 
                WHERE id = NEW.account_id 
                FOR UPDATE;
                
                -- Atualiza com valor locked
                UPDATE accounts 
                SET balance = balance + NEW.amount 
                WHERE id = NEW.account_id;
            
            -- Despesa: Subtrai da conta
            ELSIF NEW.type = 'despesa' THEN
                -- LOCK PESSIMISTA da conta antes de atualizar
                SELECT balance INTO v_account_balance 
                FROM accounts 
                WHERE id = NEW.account_id 
                FOR UPDATE;
                
                -- Validar saldo suficiente (opcional, mas recomendado)
                -- Comentado para permitir saldo negativo se necessário
                -- IF v_account_balance < NEW.amount THEN
                --     RAISE EXCEPTION 'Saldo insuficiente. Saldo atual: %, Valor da despesa: %', v_account_balance, NEW.amount;
                -- END IF;
                
                -- Atualiza com valor locked
                UPDATE accounts 
                SET balance = balance - NEW.amount 
                WHERE id = NEW.account_id;
            
            -- Transferência: Tira da origem, Põe no destino
            ELSIF NEW.type = 'transferencia' AND NEW.destination_account_id IS NOT NULL THEN
                -- LOCK de AMBAS as contas (ordem alfabética por ID para evitar deadlock)
                IF NEW.account_id < NEW.destination_account_id THEN
                    SELECT balance INTO v_account_balance 
                    FROM accounts 
                    WHERE id = NEW.account_id 
                    FOR UPDATE;
                    
                    SELECT balance INTO v_dest_account_balance 
                    FROM accounts 
                    WHERE id = NEW.destination_account_id 
                    FOR UPDATE;
                ELSE
                    SELECT balance INTO v_dest_account_balance 
                    FROM accounts 
                    WHERE id = NEW.destination_account_id 
                    FOR UPDATE;
                    
                    SELECT balance INTO v_account_balance 
                    FROM accounts 
                    WHERE id = NEW.account_id 
                    FOR UPDATE;
                END IF;
                
                -- Atualiza ambas as contas
                UPDATE accounts 
                SET balance = balance - NEW.amount 
                WHERE id = NEW.account_id;
                
                UPDATE accounts 
                SET balance = balance + NEW.amount 
                WHERE id = NEW.destination_account_id;
            END IF;
        END IF;
        RETURN NEW;

    -- ---------------------------------------------------
    -- CENÁRIO 2: DELETE (Remover Transação)
    -- ---------------------------------------------------
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.is_paid = true AND OLD.deleted_at IS NULL THEN
            
            -- Receita removida: Subtrai o valor que tinha entrado
            IF OLD.type = 'receita' THEN
                SELECT balance INTO v_account_balance 
                FROM accounts 
                WHERE id = OLD.account_id 
                FOR UPDATE;
                
                UPDATE accounts 
                SET balance = balance - OLD.amount 
                WHERE id = OLD.account_id;
            
            -- Despesa removida: Devolve o valor para a conta
            ELSIF OLD.type = 'despesa' THEN
                SELECT balance INTO v_account_balance 
                FROM accounts 
                WHERE id = OLD.account_id 
                FOR UPDATE;
                
                UPDATE accounts 
                SET balance = balance + OLD.amount 
                WHERE id = OLD.account_id;
            
            -- Transferência removida: Devolve para origem, tira do destino
            ELSIF OLD.type = 'transferencia' AND OLD.destination_account_id IS NOT NULL THEN
                IF OLD.account_id < OLD.destination_account_id THEN
                    SELECT balance INTO v_account_balance 
                    FROM accounts 
                    WHERE id = OLD.account_id 
                    FOR UPDATE;
                    
                    SELECT balance INTO v_dest_account_balance 
                    FROM accounts 
                    WHERE id = OLD.destination_account_id 
                    FOR UPDATE;
                ELSE
                    SELECT balance INTO v_dest_account_balance 
                    FROM accounts 
                    WHERE id = OLD.destination_account_id 
                    FOR UPDATE;
                    
                    SELECT balance INTO v_account_balance 
                    FROM accounts 
                    WHERE id = OLD.account_id 
                    FOR UPDATE;
                END IF;
                
                UPDATE accounts 
                SET balance = balance + OLD.amount 
                WHERE id = OLD.account_id;
                
                UPDATE accounts 
                SET balance = balance - OLD.amount 
                WHERE id = OLD.destination_account_id;
            END IF;
        END IF;
        RETURN OLD;

    -- ---------------------------------------------------
    -- CENÁRIO 3: UPDATE (Editar Transação)
    -- ---------------------------------------------------
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Lógica: Reverte o OLD e Aplica o NEW
        
        -- 1. Reverter OLD (se estava pago e não deletado)
        IF OLD.is_paid = true AND OLD.deleted_at IS NULL THEN
            IF OLD.type = 'receita' THEN
                SELECT balance INTO v_account_balance 
                FROM accounts WHERE id = OLD.account_id FOR UPDATE;
                UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
                
            ELSIF OLD.type = 'despesa' THEN
                SELECT balance INTO v_account_balance 
                FROM accounts WHERE id = OLD.account_id FOR UPDATE;
                UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
                
            ELSIF OLD.type = 'transferencia' AND OLD.destination_account_id IS NOT NULL THEN
                IF OLD.account_id < OLD.destination_account_id THEN
                    SELECT balance INTO v_account_balance FROM accounts WHERE id = OLD.account_id FOR UPDATE;
                    SELECT balance INTO v_dest_account_balance FROM accounts WHERE id = OLD.destination_account_id FOR UPDATE;
                ELSE
                    SELECT balance INTO v_dest_account_balance FROM accounts WHERE id = OLD.destination_account_id FOR UPDATE;
                    SELECT balance INTO v_account_balance FROM accounts WHERE id = OLD.account_id FOR UPDATE;
                END IF;
                UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
                UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.destination_account_id;
            END IF;
        END IF;

        -- 2. Aplicar NEW (se está pago e não deletado)
        IF NEW.is_paid = true AND NEW.deleted_at IS NULL THEN
            IF NEW.type = 'receita' THEN
                SELECT balance INTO v_account_balance 
                FROM accounts WHERE id = NEW.account_id FOR UPDATE;
                UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
                
            ELSIF NEW.type = 'despesa' THEN
                SELECT balance INTO v_account_balance 
                FROM accounts WHERE id = NEW.account_id FOR UPDATE;
                UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
                
            ELSIF NEW.type = 'transferencia' AND NEW.destination_account_id IS NOT NULL THEN
                IF NEW.account_id < NEW.destination_account_id THEN
                    SELECT balance INTO v_account_balance FROM accounts WHERE id = NEW.account_id FOR UPDATE;
                    SELECT balance INTO v_dest_account_balance FROM accounts WHERE id = NEW.destination_account_id FOR UPDATE;
                ELSE
                    SELECT balance INTO v_dest_account_balance FROM accounts WHERE id = NEW.destination_account_id FOR UPDATE;
                    SELECT balance INTO v_account_balance FROM accounts WHERE id = NEW.account_id FOR UPDATE;
                END IF;
                UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
                UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.destination_account_id;
            END IF;
        END IF;

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTE 5: FUNÇÃO DE CÁLCULO DE SALDO COM AJUSTES
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_account_balance_with_adjustments(
    p_account_id UUID,
    p_target_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    v_last_adjustment RECORD;
    v_transactions_sum NUMERIC;
BEGIN
    -- Buscar o último ajuste antes ou na data alvo
    SELECT * INTO v_last_adjustment
    FROM account_balance_adjustments
    WHERE account_id = p_account_id
        AND adjustment_date <= p_target_date
        AND deleted_at IS NULL
    ORDER BY adjustment_date DESC, created_at DESC
    LIMIT 1;
    
    -- Se não há ajuste, calcular desde o início
    IF v_last_adjustment IS NULL THEN
        SELECT COALESCE(
            SUM(
                CASE 
                    WHEN type = 'receita' THEN amount
                    WHEN type = 'despesa' THEN -amount
                    ELSE 0
                END
            ), 0
        ) INTO v_transactions_sum
        FROM transactions
        WHERE account_id = p_account_id
            AND date <= p_target_date
            AND is_historical = false
            AND is_paid = true
            AND deleted_at IS NULL;
        
        RETURN v_transactions_sum;
    END IF;
    
    -- Se há ajuste, somar transações posteriores ao ajuste
    SELECT COALESCE(
        SUM(
            CASE 
                WHEN type = 'receita' THEN amount
                WHEN type = 'despesa' THEN -amount
                ELSE 0
            END
        ), 0
    ) INTO v_transactions_sum
    FROM transactions
    WHERE account_id = p_account_id
        AND date > v_last_adjustment.adjustment_date
        AND date <= p_target_date
        AND is_historical = false
        AND is_paid = true
        AND deleted_at IS NULL;
    
    RETURN v_last_adjustment.balance + v_transactions_sum;
END;
$$;

-- =====================================================
-- PARTE 6: TRIGGERS
-- =====================================================

-- Trigger: Atualizar updated_at em accounts
CREATE TRIGGER set_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Trigger: Atualizar updated_at em transactions
CREATE TRIGGER set_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Trigger: Atualizar updated_at em adjustments
CREATE TRIGGER set_adjustments_updated_at
    BEFORE UPDATE ON account_balance_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Trigger: Atualizar saldo automaticamente
CREATE TRIGGER on_transaction_change
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION handle_balance_update();

-- =====================================================
-- PARTE 7: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts"
    ON accounts FOR SELECT
    USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own accounts"
    ON accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
    ON accounts FOR UPDATE
    USING (auth.uid() = user_id AND deleted_at IS NULL)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
    ON accounts FOR DELETE
    USING (auth.uid() = user_id);

-- Transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own transactions"
    ON transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
    ON transactions FOR UPDATE
    USING (auth.uid() = user_id AND deleted_at IS NULL)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
    ON transactions FOR DELETE
    USING (auth.uid() = user_id);

-- Adjustments
ALTER TABLE account_balance_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own adjustments"
    ON account_balance_adjustments FOR SELECT
    USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own adjustments"
    ON account_balance_adjustments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own adjustments"
    ON account_balance_adjustments FOR UPDATE
    USING (auth.uid() = user_id AND deleted_at IS NULL)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own adjustments"
    ON account_balance_adjustments FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- PARTE 8: GRANTS
-- =====================================================

GRANT ALL ON TABLE accounts TO authenticated;
GRANT ALL ON TABLE transactions TO authenticated;
GRANT ALL ON TABLE account_balance_adjustments TO authenticated;

-- =====================================================
-- PARTE 9: COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE accounts IS 'Contas financeiras dos usuários com soft delete';
COMMENT ON TABLE transactions IS 'Transações financeiras com locks para prevenir race conditions';
COMMENT ON TABLE account_balance_adjustments IS 'Ajustes manuais de saldo para reconciliação';
COMMENT ON FUNCTION handle_balance_update() IS 'Atualiza saldo automaticamente COM LOCKS para prevenir race conditions';
COMMENT ON FUNCTION calculate_account_balance_with_adjustments(UUID, DATE) IS 'Calcula saldo considerando ajustes retroativos';

-- =====================================================
-- FIM DA MIGRATION 002
-- =====================================================
