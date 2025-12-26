-- ============================================
-- SCRIPT DE TESTE AUTOMATIZADO - SISTEMA CDI
-- ============================================

-- 1. VERIFICAR E APLICAR MIGRATION
-- ============================================

-- Verificar se os campos já existem
DO $$
BEGIN
    -- Adicionar yield_enabled se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accounts' AND column_name = 'yield_enabled'
    ) THEN
        ALTER TABLE accounts ADD COLUMN yield_enabled BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Campo yield_enabled adicionado';
    ELSE
        RAISE NOTICE '⏭️  Campo yield_enabled já existe';
    END IF;

    -- Adicionar yield_source se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accounts' AND column_name = 'yield_source'
    ) THEN
        ALTER TABLE accounts ADD COLUMN yield_source VARCHAR(50) DEFAULT NULL;
        RAISE NOTICE '✅ Campo yield_source adicionado';
    ELSE
        RAISE NOTICE '⏭️  Campo yield_source já existe';
    END IF;
END $$;

-- Adicionar constraint UNIQUE se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'liquidity_yields' 
        AND constraint_name = 'unique_account_date'
    ) THEN
        ALTER TABLE liquidity_yields
        ADD CONSTRAINT unique_account_date UNIQUE (account_id, date);
        RAISE NOTICE '✅ Constraint unique_account_date adicionada';
    ELSE
        RAISE NOTICE '⏭️  Constraint unique_account_date já existe';
    END IF;
END $$;

-- Adicionar comentários
COMMENT ON COLUMN accounts.yield_enabled IS 'Indicates if the account generates liquidity yields';
COMMENT ON COLUMN accounts.yield_source IS 'Source of yield calculation (e.g., CDI, SELIC)';
COMMENT ON TABLE liquidity_yields IS 'Daily liquidity yield records - NOT financial transactions';

RAISE NOTICE '✅ Migration aplicada com sucesso!';

-- 2. CONFIGURAR CONTA DE TESTE
-- ============================================

-- Buscar primeira conta ativa do usuário para teste
DO $$
DECLARE
    v_account_id UUID;
    v_account_name TEXT;
    v_current_balance DECIMAL(15,2);
BEGIN
    -- Selecionar primeira conta ativa
    SELECT id, name, balance 
    INTO v_account_id, v_account_name, v_current_balance
    FROM accounts 
    WHERE is_active = true 
    AND type IN ('corrente', 'poupanca', 'reserva_emergencia')
    ORDER BY created_at DESC 
    LIMIT 1;

    IF v_account_id IS NULL THEN
        RAISE NOTICE '⚠️  Nenhuma conta encontrada para teste';
    ELSE
        -- Habilitar rendimento CDI
        UPDATE accounts 
        SET 
            yield_enabled = true,
            yield_source = 'CDI',
            yield_rate = 100.0,  -- 100% do CDI
            updated_at = NOW()
        WHERE id = v_account_id;

        RAISE NOTICE '✅ Conta configurada para rendimento CDI:';
        RAISE NOTICE '   ID: %', v_account_id;
        RAISE NOTICE '   Nome: %', v_account_name;
        RAISE NOTICE '   Saldo: R$ %', v_current_balance;
        RAISE NOTICE '   Taxa: 100%% do CDI';
    END IF;
END $$;

-- 3. VERIFICAR CONFIGURAÇÃO
-- ============================================

SELECT 
    '📊 CONTAS COM RENDIMENTO HABILITADO' as info;

SELECT 
    id,
    name,
    type,
    balance as saldo_operacional,
    yield_enabled as rendimento_ativo,
    yield_source as fonte,
    yield_rate as taxa_percentual,
    ROUND(balance * (13.65 / 252.0 / 100.0) * (yield_rate / 100.0), 2) as rendimento_estimado_dia
FROM accounts 
WHERE yield_enabled = true
ORDER BY balance DESC;

-- 4. SIMULAR CÁLCULO DE RENDIMENTO
-- ============================================

SELECT 
    '💰 SIMULAÇÃO DE RENDIMENTO (CDI 13.65% a.a.)' as info;

WITH yield_simulation AS (
    SELECT 
        a.id,
        a.name,
        a.balance as saldo_operacional,
        COALESCE(SUM(ly.yield_amount), 0) as rendimentos_acumulados,
        (a.balance + COALESCE(SUM(ly.yield_amount), 0)) as base_calculo,
        ROUND((a.balance + COALESCE(SUM(ly.yield_amount), 0)) * (13.65 / 252.0 / 100.0) * (a.yield_rate / 100.0), 2) as rendimento_proximo_dia,
        COUNT(ly.id) as dias_calculados
    FROM accounts a
    LEFT JOIN liquidity_yields ly ON ly.account_id = a.id
    WHERE a.yield_enabled = true
    GROUP BY a.id, a.name, a.balance, a.yield_rate
)
SELECT 
    name as conta,
    saldo_operacional,
    rendimentos_acumulados,
    base_calculo,
    rendimento_proximo_dia,
    dias_calculados,
    ROUND(base_calculo + rendimento_proximo_dia, 2) as saldo_total_apos_proximo_dia
FROM yield_simulation;

-- 5. VERIFICAR HISTÓRICO DE RENDIMENTOS
-- ============================================

SELECT 
    '📈 HISTÓRICO DE RENDIMENTOS (últimos 10)' as info;

SELECT 
    ly.date as data,
    a.name as conta,
    ly.base_amount as base,
    ly.yield_amount as rendimento,
    ly.rate_applied * 100 as taxa_aplicada_pct,
    ly.created_at as calculado_em
FROM liquidity_yields ly
JOIN accounts a ON ly.account_id = a.id
ORDER BY ly.date DESC, ly.created_at DESC
LIMIT 10;

-- 6. ESTATÍSTICAS GERAIS
-- ============================================

SELECT 
    '📊 ESTATÍSTICAS DO SISTEMA' as info;

SELECT 
    COUNT(DISTINCT a.id) as contas_com_rendimento,
    COUNT(ly.id) as total_calculos_realizados,
    COALESCE(SUM(ly.yield_amount), 0) as rendimento_total_gerado,
    MIN(ly.date) as primeiro_calculo,
    MAX(ly.date) as ultimo_calculo
FROM accounts a
LEFT JOIN liquidity_yields ly ON ly.account_id = a.id
WHERE a.yield_enabled = true;

-- 7. INSTRUÇÕES FINAIS
-- ============================================

SELECT 
    '✅ SETUP COMPLETO!' as status,
    'Use a API para calcular rendimentos: POST /api/yields/calculate' as proximos_passos;

SELECT 
    '📝 EXEMPLO DE CHAMADA API:' as info,
    $example$
    curl -X POST http://localhost:8080/api/yields/calculate \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer SEU-TOKEN" \
      -d '{
        "date": "2025-12-26",
        "cdi_rate": 13.65
      }'
    $example$ as comando;
