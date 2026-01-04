-- =====================================================
-- MIGRAÇÃO: Atualizar Constraint de Tipo de Transação
-- Data: 26/12/2025
-- Descrição: Remove constraint antigo e adiciona novo
--            que aceita 'transferencia'
-- =====================================================

BEGIN;

-- 1. Verificar constraint atual
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'transactions'::regclass
  AND conname LIKE '%transfer%' OR conname LIKE '%type%';

-- 2. Remover constraint antigo (se existir)
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_transfer_check;

ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS check_transaction_type;

-- 3. Adicionar novo constraint que aceita 'transferencia'
ALTER TABLE transactions
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('receita', 'despesa', 'transferencia'));

-- 4. Verificar novo constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'transactions'::regclass
  AND conname = 'transactions_type_check';

COMMIT;

-- =====================================================
-- Agora você pode executar a migração de dados!
-- go run migrate_transferencias.go
-- =====================================================
