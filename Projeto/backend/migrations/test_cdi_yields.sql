-- Script de Teste Rápido - Rendimentos CDI
-- Execute este script para testar o sistema de rendimentos

-- 1. Verificar se a coluna yield_cdi_rate existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'accounts' 
AND column_name IN ('yield_enabled', 'yield_source', 'yield_cdi_rate');

-- 2. Ver contas com CDI habilitado
SELECT 
    id,
    name,
    balance,
    yield_enabled,
    yield_source,
    yield_cdi_rate
FROM accounts 
WHERE yield_enabled = true;

-- 3. Inserir um rendimento de teste (AJUSTE O ACCOUNT_ID)
-- Substitua 'SEU-ACCOUNT-ID' pelo ID de uma conta real
/*
INSERT INTO liquidity_yields (
    id,
    account_id,
    date,
    base_amount,
    yield_amount,
    rate_applied,
    created_at
) VALUES (
    gen_random_uuid(),
    'SEU-ACCOUNT-ID',  -- ⚠️ TROCAR AQUI
    CURRENT_DATE,
    1000.00,           -- Base de cálculo
    0.65,              -- Rendimento do dia
    0.000542,          -- Taxa aplicada
    NOW()
) ON CONFLICT (account_id, date) DO NOTHING;
*/

-- 4. Ver rendimentos calculados
SELECT 
    a.name as conta,
    ly.date as data,
    ly.base_amount as base,
    ly.yield_amount as rendimento,
    (ly.rate_applied * 100) as taxa_pct,
    ly.created_at
FROM liquidity_yields ly
JOIN accounts a ON ly.account_id = a.id
ORDER BY ly.date DESC, ly.created_at DESC
LIMIT 10;

-- 5. Ver resumo por conta
SELECT 
    a.name as conta,
    a.balance as saldo_operacional,
    COALESCE(SUM(ly.yield_amount), 0) as rendimentos_totais,
    a.balance + COALESCE(SUM(ly.yield_amount), 0) as saldo_total
FROM accounts a
LEFT JOIN liquidity_yields ly ON a.id = ly.account_id
WHERE a.yield_enabled = true
GROUP BY a.id, a.name, a.balance;
