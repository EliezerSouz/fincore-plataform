-- =====================================================
-- MIGRATION: Consolidar e Corrigir ENUMs Duplicados
-- OBJETIVO: Eliminar conflitos entre ENUMs antigos e novos
-- PRIORIDADE: CRÍTICA
-- =====================================================

-- =====================================================
-- PARTE 1: BACKUP DE DADOS ANTES DE MODIFICAR ENUMs
-- =====================================================

-- Criar tabela temporária para backup de subscription_status
CREATE TEMP TABLE temp_users_backup AS
SELECT id, subscription_status::TEXT as old_status, subscription_plan::TEXT as old_plan
FROM users;

-- =====================================================
-- PARTE 2: REMOVER ENUMs ANTIGOS E CONFLITANTES
-- =====================================================

-- Primeiro, converter colunas que usam ENUMs para TEXT temporariamente
ALTER TABLE users 
    ALTER COLUMN subscription_status TYPE TEXT,
    ALTER COLUMN subscription_plan TYPE TEXT;

-- Remover ENUMs antigos (se existirem)
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS subscription_plan CASCADE;
DROP TYPE IF EXISTS tipo_conta CASCADE;

-- =====================================================
-- PARTE 3: CRIAR ENUMs CONSOLIDADOS E CORRETOS
-- =====================================================

-- ENUM: subscription_status (consolidado)
CREATE TYPE subscription_status AS ENUM (
    'free',        -- Usuário gratuito (sem trial)
    'trial',       -- Período de teste ativo
    'active',      -- Assinatura ativa e paga
    'past_due',    -- Pagamento atrasado (grace period)
    'canceled',    -- Cancelada pelo usuário
    'suspended'    -- Suspensa por falta de pagamento
);

-- ENUM: subscription_plan_type (consolidado, removendo _v2)
CREATE TYPE subscription_plan_type AS ENUM (
    'free',            -- Plano gratuito
    'basic',           -- Plano básico
    'premium',         -- Plano premium
    'premium_ia',      -- Plano premium com IA
    'enterprise'       -- Plano enterprise
);

-- ENUM: account_type (consolidado, substituindo tipo_conta)
CREATE TYPE account_type AS ENUM (
    'corrente',        -- Conta corrente
    'poupanca',        -- Poupança
    'investimento',    -- Conta de investimento
    'carteira',        -- Carteira digital
    'digital',         -- Conta digital (Nubank, PicPay, etc)
    'outros'           -- Outros tipos
);

-- =====================================================
-- PARTE 4: MIGRAR DADOS PARA NOVOS ENUMs
-- =====================================================

-- Migrar subscription_status
-- Mapear 'trial' antigo para 'trial' novo (sem mudança)
-- Mapear 'free' antigo para 'free' novo (sem mudança)
-- Outros valores permanecem iguais

ALTER TABLE users 
    ALTER COLUMN subscription_status TYPE subscription_status 
    USING subscription_status::subscription_status;

-- Migrar subscription_plan
-- Remover sufixo _v2 se existir
ALTER TABLE users 
    ALTER COLUMN subscription_plan TYPE subscription_plan_type 
    USING (
        CASE 
            WHEN subscription_plan = 'trial' THEN 'free'::subscription_plan_type
            ELSE subscription_plan::subscription_plan_type
        END
    );

-- Migrar account.type de TEXT para ENUM
-- Primeiro, garantir que todos os valores são válidos
UPDATE accounts 
SET type = 'outros' 
WHERE type NOT IN ('corrente', 'poupanca', 'investimento', 'carteira', 'digital', 'outros');

-- Agora converter para ENUM
ALTER TABLE accounts 
    ALTER COLUMN type TYPE account_type 
    USING type::account_type;

-- =====================================================
-- PARTE 5: ATUALIZAR DEFAULTS PARA USAR NOVOS ENUMs
-- =====================================================

-- Atualizar defaults na tabela users
ALTER TABLE users 
    ALTER COLUMN subscription_status SET DEFAULT 'free'::subscription_status,
    ALTER COLUMN subscription_plan SET DEFAULT 'free'::subscription_plan_type;

-- Atualizar default na tabela accounts
ALTER TABLE accounts 
    ALTER COLUMN type SET DEFAULT 'outros'::account_type;

-- =====================================================
-- PARTE 6: VERIFICAR INTEGRIDADE DOS DADOS
-- =====================================================

-- Verificar se algum dado foi perdido na migração
DO $$
DECLARE
    v_count_before INTEGER;
    v_count_after INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count_before FROM temp_users_backup;
    SELECT COUNT(*) INTO v_count_after FROM users;
    
    IF v_count_before != v_count_after THEN
        RAISE EXCEPTION 'ERRO: Dados perdidos na migração! Antes: %, Depois: %', v_count_before, v_count_after;
    END IF;
    
    RAISE NOTICE 'Migração bem-sucedida! % registros migrados.', v_count_after;
END $$;

-- =====================================================
-- PARTE 7: ATUALIZAR FUNÇÕES QUE USAM ENUMs ANTIGOS
-- =====================================================

-- Recriar função handle_new_user com ENUMs corretos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    subscription_plan,
    subscription_status,
    is_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    'free'::subscription_plan_type,
    'free'::subscription_status,
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTE 8: ADICIONAR COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TYPE subscription_status IS 'Status consolidado de assinatura do usuário (free, trial, active, past_due, canceled, suspended)';
COMMENT ON TYPE subscription_plan_type IS 'Tipo consolidado de plano de assinatura (free, basic, premium, premium_ia, enterprise)';
COMMENT ON TYPE account_type IS 'Tipo consolidado de conta financeira (corrente, poupanca, investimento, carteira, digital, outros)';

-- =====================================================
-- PARTE 9: LIMPAR TABELAS TEMPORÁRIAS
-- =====================================================

DROP TABLE IF EXISTS temp_users_backup;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

-- Verificação final
SELECT 
    'subscription_status' as enum_name,
    enumlabel as value
FROM pg_enum
WHERE enumtypid = 'subscription_status'::regtype
ORDER BY enumsortorder;

SELECT 
    'subscription_plan_type' as enum_name,
    enumlabel as value
FROM pg_enum
WHERE enumtypid = 'subscription_plan_type'::regtype
ORDER BY enumsortorder;

SELECT 
    'account_type' as enum_name,
    enumlabel as value
FROM pg_enum
WHERE enumtypid = 'account_type'::regtype
ORDER BY enumsortorder;
