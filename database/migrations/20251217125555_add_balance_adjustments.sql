-- Migration 016: Add Balance Adjustments and Historical Transactions
-- Permite gerenciar saldos iniciais e transações históricas

-- 1. Criar tabela de ajustes de saldo
CREATE TABLE IF NOT EXISTS account_balance_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  adjustment_date DATE NOT NULL,
  balance DECIMAL(15, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('initial', 'reconciliation', 'correction')),
  notes TEXT,
  starts_controlled_period BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Constraint: não pode ter dois ajustes na mesma data para a mesma conta
  CONSTRAINT unique_adjustment_per_account_date UNIQUE (account_id, adjustment_date)
);

-- 2. Adicionar campo is_historical na tabela transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_historical BOOLEAN DEFAULT false;

-- 3. Adicionar campo is_adjustment na tabela transactions (para transações de conciliação)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_adjustment BOOLEAN DEFAULT false;

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_balance_adjustments_account_date 
ON account_balance_adjustments(account_id, adjustment_date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_historical 
ON transactions(account_id, is_historical, date);

CREATE INDEX IF NOT EXISTS idx_transactions_adjustment 
ON transactions(account_id, is_adjustment);

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE account_balance_adjustments ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS para account_balance_adjustments
CREATE POLICY "Users can view their own balance adjustments"
ON account_balance_adjustments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own balance adjustments"
ON account_balance_adjustments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own balance adjustments"
ON account_balance_adjustments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own balance adjustments"
ON account_balance_adjustments FOR DELETE
USING (auth.uid() = user_id);

-- 7. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_balance_adjustment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar trigger para atualizar updated_at
CREATE TRIGGER update_balance_adjustment_timestamp
BEFORE UPDATE ON account_balance_adjustments
FOR EACH ROW
EXECUTE FUNCTION update_balance_adjustment_updated_at();

-- 9. Criar função para calcular saldo de conta considerando ajustes
CREATE OR REPLACE FUNCTION calculate_account_balance_with_adjustments(
  p_account_id UUID,
  p_target_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
  v_last_adjustment RECORD;
  v_balance DECIMAL(15, 2);
  v_transactions_sum DECIMAL(15, 2);
BEGIN
  -- Buscar o último ajuste antes ou na data alvo
  SELECT * INTO v_last_adjustment
  FROM account_balance_adjustments
  WHERE account_id = p_account_id
    AND adjustment_date <= p_target_date
  ORDER BY adjustment_date DESC
  LIMIT 1;
  
  -- Se não há ajuste, calcular desde o início (apenas transações não históricas)
  IF v_last_adjustment IS NULL THEN
    SELECT COALESCE(
      SUM(
        CASE 
          WHEN type = 'income' THEN amount
          WHEN type = 'expense' THEN -amount
          ELSE 0
        END
      ), 0
    ) INTO v_transactions_sum
    FROM transactions
    WHERE account_id = p_account_id
      AND date <= p_target_date
      AND is_historical = false;
    
    RETURN v_transactions_sum;
  END IF;
  
  -- Se há ajuste, somar transações não históricas após o ajuste
  SELECT COALESCE(
    SUM(
      CASE 
        WHEN type = 'income' THEN amount
        WHEN type = 'expense' THEN -amount
        ELSE 0
      END
    ), 0
  ) INTO v_transactions_sum
  FROM transactions
  WHERE account_id = p_account_id
    AND date > v_last_adjustment.adjustment_date
    AND date <= p_target_date
    AND is_historical = false;
  
  -- Retornar saldo do ajuste + transações posteriores
  RETURN v_last_adjustment.balance + v_transactions_sum;
END;
$$ LANGUAGE plpgsql;

-- 10. Comentários para documentação
COMMENT ON TABLE account_balance_adjustments IS 'Armazena ajustes de saldo para contas, permitindo saldos iniciais e conciliações';
COMMENT ON COLUMN account_balance_adjustments.type IS 'Tipo de ajuste: initial (saldo inicial), reconciliation (conciliação/retomada), correction (correção manual)';
COMMENT ON COLUMN account_balance_adjustments.starts_controlled_period IS 'Indica se este ajuste marca o início de um período controlado';
COMMENT ON COLUMN transactions.is_historical IS 'Indica se a transação é histórica (não afeta saldo atual)';
COMMENT ON COLUMN transactions.is_adjustment IS 'Indica se a transação foi criada automaticamente para ajuste de conciliação';
COMMENT ON FUNCTION calculate_account_balance_with_adjustments IS 'Calcula o saldo de uma conta considerando ajustes de saldo e excluindo transações históricas';
