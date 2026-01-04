-- =====================================================
-- MIGRAÇÃO: Corrigir Tipo de Transferências Existentes
-- Data: 26/12/2025
-- Descrição: Atualiza transações que são transferências
--            mas estão marcadas como 'receita' ou 'despesa'
-- =====================================================

BEGIN;

-- 1. Backup das transações antes da migração (opcional, mas recomendado)
-- CREATE TABLE IF NOT EXISTS transactions_backup_20251226 AS 
-- SELECT * FROM transactions WHERE related_transaction_id IS NOT NULL;

-- 2. Identificar quantas transferências existem
SELECT 
    COUNT(*) as total_transferencias,
    COUNT(CASE WHEN type = 'receita' THEN 1 END) as marcadas_como_receita,
    COUNT(CASE WHEN type = 'despesa' THEN 1 END) as marcadas_como_despesa,
    COUNT(CASE WHEN type = 'transferencia' THEN 1 END) as ja_corretas
FROM transactions
WHERE related_transaction_id IS NOT NULL
  AND deleted_at IS NULL;

-- 3. Atualizar tipo de transferências
-- Todas as transações que têm related_transaction_id são transferências
UPDATE transactions
SET 
    type = 'transferencia',
    updated_at = NOW()
WHERE related_transaction_id IS NOT NULL
  AND type != 'transferencia'
  AND deleted_at IS NULL;

-- 4. Verificar resultado
SELECT 
    COUNT(*) as total_transferencias_atualizadas
FROM transactions
WHERE related_transaction_id IS NOT NULL
  AND type = 'transferencia'
  AND deleted_at IS NULL;

-- 5. Mostrar algumas transferências atualizadas (para validação)
SELECT 
    id,
    account_id,
    description,
    amount,
    type,
    date,
    related_transaction_id,
    updated_at
FROM transactions
WHERE related_transaction_id IS NOT NULL
  AND type = 'transferencia'
  AND deleted_at IS NULL
ORDER BY updated_at DESC
LIMIT 10;

COMMIT;

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Este script NÃO recalcula saldos automaticamente
--    Os saldos já estão corretos pois foram calculados
--    na criação das transações
--
-- 2. Se você quiser recalcular saldos (não recomendado):
--    - Use a funcionalidade de "Recalcular Saldo" no frontend
--    - Ou execute o script de recálculo separadamente
--
-- 3. Para reverter (se necessário):
--    UPDATE transactions
--    SET type = CASE 
--        WHEN description LIKE '%para%' THEN 'despesa'
--        WHEN description LIKE '%de%' THEN 'receita'
--        ELSE type
--    END
--    WHERE related_transaction_id IS NOT NULL
--      AND type = 'transferencia';
-- =====================================================
