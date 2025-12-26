-- =====================================================
-- MIGRAÇÃO: financial_events → credit_card_transactions
-- Data: 25/12/2025
-- Objetivo: Consolidar sistema de faturas em uma única tabela
-- =====================================================

-- 1. Migrar transações de financial_events para credit_card_transactions
INSERT INTO credit_card_transactions (
    id,
    user_id,
    credit_card_id,
    invoice_id,
    description,
    amount,
    transaction_date,
    is_installment,
    installment_number,
    total_installments,
    category_id,
    subcategory_id,
    notes,
    group_id,
    transaction_type,
    created_at,
    updated_at
)
SELECT 
    fe.id,
    fe.user_id,
    cci.credit_card_id,
    fe.invoice_id,
    'Compra no Cartão' as description, -- Descrição padrão (não existe em financial_events)
    fe.amount,
    fe.created_at as transaction_date,
    false as is_installment,
    NULL as installment_number,
    NULL as total_installments,
    NULL as category_id,
    NULL as subcategory_id,
    NULL as notes,
    NULL as group_id,
    'purchase' as transaction_type,
    fe.created_at,
    fe.updated_at
FROM financial_events fe
JOIN credit_card_invoices cci ON fe.invoice_id = cci.id
WHERE fe.type = 'LANCAMENTO_CARTAO'
  AND fe.reverted_at IS NULL
  AND NOT EXISTS (
      -- Evitar duplicatas
      SELECT 1 FROM credit_card_transactions cct 
      WHERE cct.id = fe.id
  );

-- 2. Verificar migração
SELECT 
    'financial_events' as source_table,
    COUNT(*) as total_records
FROM financial_events
WHERE type = 'LANCAMENTO_CARTAO' AND reverted_at IS NULL

UNION ALL

SELECT 
    'credit_card_transactions' as source_table,
    COUNT(*) as total_records
FROM credit_card_transactions;

-- 3. Após confirmar que os dados foram migrados corretamente, 
--    executar os comandos abaixo para limpar as tabelas antigas:

-- DROP TABLE IF EXISTS financial_events CASCADE;
-- DROP TABLE IF EXISTS credits CASCADE;

-- =====================================================
-- IMPORTANTE: 
-- 1. Faça backup antes de executar!
-- 2. Execute linha por linha e verifique os resultados
-- 3. Só delete as tabelas após confirmar que tudo está OK
-- =====================================================
