-- Migration to update balance calculation function to include liquidity yields
-- This ensures that calculated balances respect:
-- 1. Balance Adjustments (ignoring transactions prior to adjustment)
-- 2. Liquidity Yields (adding yields generated after adjustment)

CREATE OR REPLACE FUNCTION calculate_account_balance_with_adjustments(
  p_account_id UUID,
  p_target_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
  v_last_adjustment RECORD;
  v_transactions_sum DECIMAL(15, 2);
  v_yields_sum DECIMAL(15, 2);
BEGIN
  -- Buscar o último ajuste antes ou na data alvo
  -- Adicionado created_at DESC para desempate se houver múltiplos (embora unique constraint impeça mesmo dia)
  SELECT * INTO v_last_adjustment
  FROM account_balance_adjustments
  WHERE account_id = p_account_id
    AND adjustment_date <= p_target_date
  ORDER BY adjustment_date DESC, created_at DESC
  LIMIT 1;
  
  -- Se não há ajuste, calcular desde o início
  IF v_last_adjustment IS NULL THEN
    -- Soma transações não históricas
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
      
    -- Soma rendimentos (yields) de liquidez
    -- Assumindo que yields são sempre incrementos positivos
    SELECT COALESCE(SUM(yield_amount), 0) INTO v_yields_sum
    FROM liquidity_yields
    WHERE account_id = p_account_id
      AND date <= p_target_date;
    
    RETURN v_transactions_sum + v_yields_sum;
  END IF;
  
  -- Se há ajuste, somar transações e yields posteriores ao ajuste
  
  -- Transações
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
    
  -- Yields
  SELECT COALESCE(SUM(yield_amount), 0) INTO v_yields_sum
  FROM liquidity_yields
  WHERE account_id = p_account_id
    AND date > v_last_adjustment.adjustment_date
    AND date <= p_target_date;
  
  -- Retornar saldo do ajuste + transações posteriores + yields posteriores
  RETURN v_last_adjustment.balance + v_transactions_sum + v_yields_sum;
END;
$$ LANGUAGE plpgsql;
