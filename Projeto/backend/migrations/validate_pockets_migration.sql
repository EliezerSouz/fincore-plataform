-- ============================================================================
-- SCRIPT DE VALIDAÇÃO RÁPIDA - Parent Accounts + Pockets
-- Execute este script APÓS rodar as migrations
-- ============================================================================

\echo '========================================';
\echo '🧪 VALIDAÇÃO DO SISTEMA DE POCKETS';
\echo '========================================';
\echo '';

-- 1. Verificar se tabelas existem
\echo '1️⃣ Verificando tabelas...';
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parent_accounts') 
        THEN '✅ parent_accounts existe'
        ELSE '❌ parent_accounts NÃO existe'
    END as status
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pockets') 
        THEN '✅ pockets existe'
        ELSE '❌ pockets NÃO existe'
    END;

\echo '';

-- 2. Contar registros
\echo '2️⃣ Contando registros...';
SELECT 
    'Parent Accounts' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN is_active = true THEN 1 END) as ativos
FROM parent_accounts
UNION ALL
SELECT 
    'Pockets' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN is_active = true THEN 1 END) as ativos
FROM pockets
UNION ALL
SELECT 
    'Accounts (antigo)' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN is_active = true THEN 1 END) as ativos
FROM accounts;

\echo '';

-- 3. Distribuição por tipo de pocket
\echo '3️⃣ Distribuição de Pockets por tipo...';
SELECT 
    pocket_type,
    COUNT(*) as quantidade,
    ROUND(SUM(balance), 2) as saldo_total,
    COUNT(CASE WHEN yield_enabled = true THEN 1 END) as com_rendimento
FROM pockets
GROUP BY pocket_type
ORDER BY pocket_type;

\echo '';

-- 4. Status da migração
\echo '4️⃣ Status da migração...';
SELECT 
    status,
    COUNT(*) as total,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentual
FROM migration_audit
WHERE migration_name = 'accounts_to_pockets'
GROUP BY status;

\echo '';

-- 5. Comparação de saldos (antigo vs novo)
\echo '5️⃣ Comparação de saldos...';
WITH old_total AS (
    SELECT COALESCE(SUM(balance), 0) as total FROM accounts WHERE is_active = true
),
new_total AS (
    SELECT COALESCE(SUM(balance), 0) as total FROM pockets WHERE is_active = true
)
SELECT 
    'Saldo Total Antigo (accounts)' as descricao,
    ROUND(old_total.total, 2) as valor
FROM old_total
UNION ALL
SELECT 
    'Saldo Total Novo (pockets)' as descricao,
    ROUND(new_total.total, 2) as valor
FROM new_total
UNION ALL
SELECT 
    'Diferença' as descricao,
    ROUND(old_total.total - new_total.total, 2) as valor
FROM old_total, new_total;

\echo '';

-- 6. Exemplo de dados migrados
\echo '6️⃣ Exemplo de dados migrados (primeiros 5)...';
SELECT 
    pa.institution_name,
    p.name as pocket_name,
    p.pocket_type,
    ROUND(p.balance, 2) as saldo,
    CASE WHEN p.yield_enabled THEN 'Sim' ELSE 'Não' END as rendimento,
    p.yield_cdi_rate as "% CDI"
FROM parent_accounts pa
JOIN pockets p ON pa.id = p.parent_account_id
WHERE pa.is_active = true
ORDER BY pa.institution_name, p.display_order
LIMIT 5;

\echo '';

-- 7. Verificar integridade referencial
\echo '7️⃣ Verificando integridade...';
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Todos os pockets têm parent_account válido'
        ELSE '❌ ' || COUNT(*) || ' pockets órfãos encontrados!'
    END as status
FROM pockets p
LEFT JOIN parent_accounts pa ON p.parent_account_id = pa.id
WHERE pa.id IS NULL;

\echo '';

-- 8. Verificar colunas adicionadas
\echo '8️⃣ Verificando colunas adicionadas...';
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'transactions' AND column_name = 'pocket_id'
        ) 
        THEN '✅ transactions.pocket_id existe'
        ELSE '❌ transactions.pocket_id NÃO existe'
    END as status
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'liquidity_yields' AND column_name = 'pocket_id'
        ) 
        THEN '✅ liquidity_yields.pocket_id existe'
        ELSE '❌ liquidity_yields.pocket_id NÃO existe'
    END;

\echo '';
\echo '========================================';
\echo '✅ VALIDAÇÃO COMPLETA!';
\echo '========================================';
\echo '';
\echo 'Se todos os itens estão ✅, o sistema está pronto!';
\echo 'Se houver ❌, verifique os logs de migração.';
\echo '';
