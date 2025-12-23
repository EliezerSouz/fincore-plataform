-- =====================================================
-- MIGRATION 001: CORE SCHEMA
-- Descrição: Estrutura base do sistema (ENUMs, Usuários, Funções Essenciais)
-- Data: 23/12/2025
-- Autor: FinCore Team
-- =====================================================

-- =====================================================
-- PARTE 1: CRIAR ENUMS CONSOLIDADOS
-- =====================================================

-- ENUM: Status de Assinatura
CREATE TYPE subscription_status AS ENUM (
    'free',        -- Usuário gratuito permanente
    'trial',       -- Período de teste ativo
    'active',      -- Assinatura ativa e paga
    'past_due',    -- Pagamento atrasado (grace period)
    'canceled',    -- Cancelada pelo usuário
    'suspended'    -- Suspensa por falta de pagamento
);

-- ENUM: Tipo de Plano de Assinatura
CREATE TYPE subscription_plan_type AS ENUM (
    'free',            -- Plano gratuito
    'basic',           -- Plano básico
    'premium',         -- Plano premium
    'premium_ia',      -- Plano premium com IA
    'enterprise'       -- Plano enterprise
);

-- ENUM: Tipo de Conta Financeira
CREATE TYPE account_type AS ENUM (
    'corrente',              -- Conta corrente
    'poupanca',              -- Poupança
    'investimento',          -- Conta de investimento
    'carteira',              -- Carteira digital
    'digital',               -- Conta digital (Nubank, PicPay, etc)
    'reserva_emergencia',    -- Reserva de emergência
    'vale_alimentacao',      -- Vale alimentação
    'internacional',         -- Conta internacional
    'outros'                 -- Outros tipos
);

-- ENUM: Tipo de Transação
CREATE TYPE transaction_type AS ENUM (
    'receita',         -- Receita/Entrada
    'despesa',         -- Despesa/Saída
    'transferencia'    -- Transferência entre contas
);

-- ENUM: Tipo de Categoria
CREATE TYPE category_type AS ENUM (
    'receita',    -- Categoria de receita
    'despesa'     -- Categoria de despesa
);

-- ENUM: Marca de Cartão de Crédito
CREATE TYPE card_brand AS ENUM (
    'visa',
    'mastercard',
    'amex',
    'elo',
    'hipercard',
    'outros'
);

-- ENUM: Status de Fatura
CREATE TYPE invoice_status AS ENUM (
    'open',       -- Aberta (ainda não fechou)
    'closed',     -- Fechada (aguardando pagamento)
    'paid',       -- Paga completamente
    'overdue',    -- Vencida
    'partial'     -- Parcialmente paga
);

-- ENUM: Status de Conta a Pagar
CREATE TYPE payable_status AS ENUM (
    'pending',    -- Pendente
    'paid',       -- Paga
    'cancelled'   -- Cancelada
);

-- ENUM: Tipo de Método de Pagamento
CREATE TYPE payment_method_type AS ENUM (
    'PIX',
    'CASH',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'BANK_TRANSFER',
    'BOLETO',
    'AUTOMATIC',
    'INTERNAL_TRANSFER',
    'OTHER'
);

-- ENUM: Tipo de Investimento
CREATE TYPE investment_type AS ENUM (
    'acao',         -- Ações
    'fii',          -- Fundos Imobiliários
    'renda_fixa',   -- Renda Fixa
    'cripto',       -- Criptomoedas
    'fundo',        -- Fundos de Investimento
    'tesouro',      -- Tesouro Direto
    'outros'        -- Outros
);

-- ENUM: Período de Recorrência
CREATE TYPE recurrence_period AS ENUM (
    'diario',
    'semanal',
    'quinzenal',
    'mensal',
    'trimestral',
    'semestral',
    'anual'
);

-- =====================================================
-- PARTE 2: CRIAR TABELA DE USUÁRIOS
-- =====================================================

CREATE TABLE users (
    -- Identificação
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Dados Pessoais
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    
    -- Assinatura e Plano
    subscription_plan subscription_plan_type NOT NULL DEFAULT 'free',
    subscription_status subscription_status NOT NULL DEFAULT 'free',
    base_plan subscription_plan_type DEFAULT 'free',
    
    -- Datas de Assinatura
    subscription_started_at TIMESTAMPTZ,
    subscription_ends_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    
    -- Acesso Temporário (Promoções)
    is_temp_access BOOLEAN DEFAULT false,
    temp_access_expires_at TIMESTAMPTZ,
    temp_access_origin VARCHAR(255),
    used_promo_code VARCHAR(50),
    
    -- Pagamento
    last_payment_date TIMESTAMPTZ,
    next_billing_date TIMESTAMPTZ,
    payment_method TEXT,
    billing_cycle VARCHAR(50) DEFAULT 'monthly',
    
    -- Integração Stripe
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    
    -- Preferências
    primary_credit_card_id UUID,
    primary_card_locked BOOLEAN DEFAULT false,
    
    -- Flags de Controle
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ  -- Soft delete
);

-- Índices para Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
CREATE INDEX idx_users_subscription_plan ON users(subscription_plan);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- =====================================================
-- PARTE 3: FUNÇÕES ESSENCIAIS
-- =====================================================

-- FUNÇÃO: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- FUNÇÃO: Verificar se assinatura está válida
CREATE OR REPLACE FUNCTION is_subscription_valid(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT subscription_status, subscription_ends_at, trial_ends_at
    INTO user_record
    FROM users
    WHERE id = user_id AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Verifica se está em trial válido
    IF user_record.subscription_status = 'trial' THEN
        RETURN user_record.trial_ends_at > NOW();
    END IF;
    
    -- Verifica se assinatura está ativa
    IF user_record.subscription_status = 'active' THEN
        RETURN user_record.subscription_ends_at IS NULL 
               OR user_record.subscription_ends_at > NOW();
    END IF;
    
    -- Permite grace period para past_due (3 dias)
    IF user_record.subscription_status = 'past_due' THEN
        RETURN user_record.subscription_ends_at > (NOW() - INTERVAL '3 days');
    END IF;
    
    -- Free é sempre válido
    IF user_record.subscription_status = 'free' THEN
        RETURN true;
    END IF;
    
    -- Outros status: cancelado, suspenso = false
    RETURN false;
END;
$$;

-- FUNÇÃO: Verificar se usuário é premium
CREATE OR REPLACE FUNCTION is_premium(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id 
        AND deleted_at IS NULL
        AND (
            (subscription_status = 'trial' AND trial_ends_at > NOW()) OR
            (subscription_status = 'active') OR
            (subscription_plan IN ('premium', 'premium_ia', 'enterprise') AND subscription_status = 'active')
        )
    );
END;
$$;

-- FUNÇÃO: Obter plano ativo do usuário
CREATE OR REPLACE FUNCTION get_user_active_plan(user_id UUID)
RETURNS VARCHAR
LANGUAGE plpgsql
AS $$
DECLARE
    u_base_plan VARCHAR;
    u_is_temp BOOLEAN;
    u_temp_expires TIMESTAMPTZ;
    u_sub_plan VARCHAR;
BEGIN
    SELECT base_plan, is_temp_access, temp_access_expires_at, subscription_plan::TEXT
    INTO u_base_plan, u_is_temp, u_temp_expires, u_sub_plan
    FROM users
    WHERE id = user_id AND deleted_at IS NULL;

    -- Se acesso temporário está ativo e não expirou
    IF u_is_temp IS TRUE AND u_temp_expires > NOW() THEN
        RETURN u_sub_plan;
    END IF;

    -- Fallback para base plan
    RETURN u_base_plan::TEXT;
END;
$$;

-- FUNÇÃO: Atualizar assinaturas expiradas (executar via cron)
CREATE OR REPLACE FUNCTION update_expired_subscriptions()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Atualizar trials expirados
    UPDATE users
    SET subscription_status = 'suspended'
    WHERE subscription_status = 'trial'
        AND trial_ends_at < NOW()
        AND deleted_at IS NULL;
    
    -- Atualizar assinaturas expiradas
    UPDATE users
    SET subscription_status = 'past_due'
    WHERE subscription_status = 'active'
        AND subscription_ends_at < NOW()
        AND deleted_at IS NULL;
    
    -- Suspender assinaturas com mais de 3 dias de atraso
    UPDATE users
    SET subscription_status = 'suspended'
    WHERE subscription_status = 'past_due'
        AND subscription_ends_at < (NOW() - INTERVAL '3 days')
        AND deleted_at IS NULL;
END;
$$;

-- =====================================================
-- PARTE 4: TRIGGERS
-- =====================================================

-- Trigger: Atualizar updated_at em users
CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- =====================================================
-- PARTE 5: ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own data"
    ON users
    FOR SELECT
    USING (auth.uid() = id AND deleted_at IS NULL);

-- Policy: Usuários podem atualizar apenas seus próprios dados
CREATE POLICY "Users can update own data"
    ON users
    FOR UPDATE
    USING (auth.uid() = id AND deleted_at IS NULL)
    WITH CHECK (auth.uid() = id);

-- Policy: Sistema pode inserir usuários (via trigger de auth)
CREATE POLICY "System can insert users"
    ON users
    FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- PARTE 6: GRANTS
-- =====================================================

GRANT ALL ON TABLE users TO authenticated;
GRANT ALL ON TABLE users TO service_role;

-- =====================================================
-- PARTE 7: COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE users IS 'Tabela principal de usuários do sistema com informações de assinatura e autenticação';
COMMENT ON COLUMN users.subscription_status IS 'Status atual da assinatura (free, trial, active, past_due, canceled, suspended)';
COMMENT ON COLUMN users.subscription_plan IS 'Plano de assinatura atual';
COMMENT ON COLUMN users.deleted_at IS 'Data de exclusão (soft delete) - NULL se ativo';
COMMENT ON FUNCTION is_subscription_valid(UUID) IS 'Verifica se o usuário tem acesso válido ao sistema';
COMMENT ON FUNCTION is_premium(UUID) IS 'Verifica se o usuário tem plano premium ativo';

-- =====================================================
-- FIM DA MIGRATION 001
-- =====================================================
