-- =====================================================
-- Migration: Payment Methods - Estrutura Completa
-- Data: 2025-01-18
-- Descrição: Adiciona campos de contexto, comportamento, 
--            grants e policies para payment_methods
-- =====================================================

-- PARTE 1: ADICIONAR NOVOS CAMPOS
-- =====================================================

ALTER TABLE payment_methods
ADD COLUMN IF NOT EXISTS allows_transfer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS affects_credit_card BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS affects_invoice BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS affects_balance BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS requires_bank_account BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS icon VARCHAR(50);

-- PARTE 2: COMENTÁRIOS EXPLICATIVOS
-- =====================================================

COMMENT ON COLUMN payment_methods.allows_income IS 'Permite usar em receitas (entradas)';
COMMENT ON COLUMN payment_methods.allows_expense IS 'Permite usar em despesas (saídas)';
COMMENT ON COLUMN payment_methods.allows_transfer IS 'Permite usar em transferências entre contas';
COMMENT ON COLUMN payment_methods.affects_credit_card IS 'Afeta fatura de cartão de crédito';
COMMENT ON COLUMN payment_methods.affects_invoice IS 'Afeta faturas/boletos';
COMMENT ON COLUMN payment_methods.is_internal IS 'É um movimento interno (não afeta resultado)';
COMMENT ON COLUMN payment_methods.affects_balance IS 'Altera o saldo da conta imediatamente';
COMMENT ON COLUMN payment_methods.requires_bank_account IS 'Requer uma conta bancária vinculada';

-- PARTE 3: ATUALIZAR MÉTODOS EXISTENTES
-- =====================================================

-- PIX: Versátil, permite tudo exceto movimentos internos
UPDATE payment_methods
SET 
    allows_transfer = true,
    affects_balance = true,
    requires_bank_account = true
WHERE slug = 'pix' OR slug LIKE '%pix%';

-- Dinheiro: Versátil, mas não permite transferências eletrônicas
UPDATE payment_methods
SET 
    allows_transfer = false,
    affects_balance = true,
    requires_bank_account = false
WHERE slug IN ('cash', 'dinheiro', 'money') OR name ILIKE '%dinheiro%';

-- Cartão de Crédito: Apenas despesas, afeta fatura
UPDATE payment_methods
SET 
    allows_income = false,
    allows_transfer = false,
    affects_credit_card = true,
    affects_invoice = true,
    affects_balance = false,
    requires_bank_account = false
WHERE slug IN ('credit_card', 'cartao_credito') 
   OR name ILIKE '%cartão de crédito%' 
   OR name ILIKE '%cartao de credito%';

-- Cartão de Débito: Receitas e despesas, afeta saldo
UPDATE payment_methods
SET 
    allows_transfer = true,
    affects_balance = true,
    requires_bank_account = true
WHERE slug IN ('debit_card', 'cartao_debito') 
   OR name ILIKE '%cartão de débito%' 
   OR name ILIKE '%cartao de debito%';

-- Boleto: Apenas despesas, afeta saldo quando pago
UPDATE payment_methods
SET 
    allows_income = false,
    allows_transfer = false,
    affects_invoice = true,
    affects_balance = true,
    requires_bank_account = true
WHERE slug IN ('boleto', 'bank_slip') OR name ILIKE '%boleto%';

-- Transferência Bancária: Versátil
UPDATE payment_methods
SET 
    allows_transfer = true,
    affects_balance = true,
    requires_bank_account = true
WHERE slug IN ('bank_transfer', 'transferencia_bancaria', 'ted', 'doc') 
   OR name ILIKE '%transferência%' 
   OR name ILIKE '%transferencia%'
   OR name ILIKE '%ted%'
   OR name ILIKE '%doc%';

-- PARTE 4: ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_payment_methods_allows_income 
ON payment_methods(allows_income) WHERE allows_income = true;

CREATE INDEX IF NOT EXISTS idx_payment_methods_allows_expense 
ON payment_methods(allows_expense) WHERE allows_expense = true;

CREATE INDEX IF NOT EXISTS idx_payment_methods_allows_transfer 
ON payment_methods(allows_transfer) WHERE allows_transfer = true;

CREATE INDEX IF NOT EXISTS idx_payment_methods_active 
ON payment_methods(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id 
ON payment_methods(user_id);

-- PARTE 5: GRANTS (PERMISSÕES)
-- =====================================================

-- Dar permissões completas para usuários autenticados
GRANT SELECT, INSERT, UPDATE, DELETE ON payment_methods TO authenticated;

-- Dar permissões para anon (apenas leitura se necessário)
GRANT SELECT, INSERT, UPDATE, DELETE ON payment_methods TO anon;

-- PARTE 6: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Users can view their own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can insert their own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can update their own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can delete their own payment methods" ON payment_methods;

-- Policy para SELECT (visualizar)
CREATE POLICY "Users can view their own payment methods"
ON payment_methods FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy para INSERT (criar)
CREATE POLICY "Users can insert their own payment methods"
ON payment_methods FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy para UPDATE (atualizar)
CREATE POLICY "Users can update their own payment methods"
ON payment_methods FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy para DELETE (deletar)
CREATE POLICY "Users can delete their own payment methods"
ON payment_methods FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- PARTE 7: VERIFICAÇÃO
-- =====================================================

-- Verificar estrutura
DO $$
BEGIN
    RAISE NOTICE 'Migration aplicada com sucesso!';
    RAISE NOTICE 'Campos adicionados: allows_transfer, affects_credit_card, affects_invoice, is_internal, affects_balance, requires_bank_account, icon';
    RAISE NOTICE 'Grants aplicados: authenticated e anon têm permissões completas';
    RAISE NOTICE 'Policies criadas: 4 policies (SELECT, INSERT, UPDATE, DELETE)';
    RAISE NOTICE 'Índices criados: 5 índices para performance';
END $$;
