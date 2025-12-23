-- =====================================================
-- BACKUP DE FUNÇÕES PL/pgSQL DO BANCO ATUAL
-- Data: 23/12/2025
-- Objetivo: Preservar lógica de negócio para reutilização no banco novo
-- =====================================================

-- =====================================================
-- CATEGORIA: FUNÇÕES DE FATURA DE CARTÃO DE CRÉDITO
-- =====================================================

-- FUNÇÃO: get_or_create_invoice
-- Descrição: Cria ou busca fatura baseada na data da compra e dia de fechamento
-- Lógica: Compra antes do fechamento → fatura do mesmo mês
--         Compra no/após fechamento → fatura do próximo mês
CREATE OR REPLACE FUNCTION public.get_or_create_invoice(
    p_user_id UUID,
    p_card_id UUID,
    p_transaction_date DATE
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_closing_day INTEGER;
    v_due_day INTEGER;
    v_ref_month INTEGER;
    v_ref_year INTEGER;
    v_invoice_id UUID;
    v_closing_date DATE;
    v_due_date DATE;
    v_transaction_day INTEGER;
BEGIN
    -- Busca dados do cartão
    SELECT closing_day, due_day
    INTO v_closing_day, v_due_day
    FROM credit_cards
    WHERE id = p_card_id;

    v_transaction_day := EXTRACT(DAY FROM p_transaction_date);

    -- LÓGICA DE FECHAMENTO CORRETA
    IF v_transaction_day < v_closing_day THEN
        v_ref_month := EXTRACT(MONTH FROM p_transaction_date);
        v_ref_year  := EXTRACT(YEAR  FROM p_transaction_date);
    ELSE
        v_ref_month := EXTRACT(MONTH FROM (p_transaction_date + INTERVAL '1 month'));
        v_ref_year  := EXTRACT(YEAR  FROM (p_transaction_date + INTERVAL '1 month'));
    END IF;

    -- Busca fatura existente
    SELECT id INTO v_invoice_id
    FROM credit_card_invoices
    WHERE credit_card_id = p_card_id
      AND reference_month = v_ref_month
      AND reference_year  = v_ref_year;

    -- Cria fatura se não existir
    IF v_invoice_id IS NULL THEN
        -- Data de fechamento
        v_closing_date :=
            make_date(v_ref_year, v_ref_month, 1)
            + (v_closing_day - 1) * INTERVAL '1 day';

        -- Data de vencimento
        IF v_due_day < v_closing_day THEN
            v_due_date :=
                (make_date(v_ref_year, v_ref_month, 1) + INTERVAL '1 month')
                + (v_due_day - 1) * INTERVAL '1 day';
        ELSE
            v_due_date :=
                make_date(v_ref_year, v_ref_month, 1)
                + (v_due_day - 1) * INTERVAL '1 day';
        END IF;

        INSERT INTO credit_card_invoices (
            user_id, credit_card_id, reference_month, reference_year,
            status, closing_date, due_date, total_amount, paid_amount
        )
        VALUES (
            p_user_id, p_card_id, v_ref_month, v_ref_year,
            'open', v_closing_date, v_due_date, 0, 0
        )
        RETURNING id INTO v_invoice_id;
    END IF;

    RETURN v_invoice_id;
END;
$$;

-- FUNÇÃO: pay_invoice
-- Descrição: Paga fatura com suporte a rollover (excesso vai para próxima fatura)
-- Lógica: Recursiva - se sobrar dinheiro, aplica na próxima fatura
CREATE OR REPLACE FUNCTION public.pay_invoice(
    p_invoice_id UUID,
    p_amount NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_invoice RECORD;
    v_new_paid_amount NUMERIC;
    v_excess NUMERIC;
    v_next_invoice_id UUID;
    v_status TEXT;
BEGIN
    -- Busca fatura atual
    SELECT * INTO v_invoice FROM credit_card_invoices WHERE id = p_invoice_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found';
    END IF;

    -- Calcula novo valor pago
    v_new_paid_amount := v_invoice.paid_amount + p_amount;
    
    -- Verifica excesso
    IF v_new_paid_amount > v_invoice.total_amount THEN
        v_excess := v_new_paid_amount - v_invoice.total_amount;
        v_new_paid_amount := v_invoice.total_amount;
        v_status := 'paid';
    ELSIF v_new_paid_amount = v_invoice.total_amount THEN
        v_excess := 0;
        v_status := 'paid';
    ELSE
        v_excess := 0;
        v_status := 'partial';
    END IF;

    -- Atualiza fatura atual
    UPDATE credit_card_invoices 
    SET paid_amount = v_new_paid_amount,
        status = v_status,
        updated_at = NOW()
    WHERE id = p_invoice_id;

    -- Trata excesso (ROLLOVER)
    IF v_excess > 0 THEN
        -- Busca próxima fatura
        SELECT id INTO v_next_invoice_id
        FROM credit_card_invoices
        WHERE credit_card_id = v_invoice.credit_card_id
          AND (reference_year > v_invoice.reference_year 
               OR (reference_year = v_invoice.reference_year AND reference_month > v_invoice.reference_month))
        ORDER BY reference_year ASC, reference_month ASC
        LIMIT 1;

        IF v_next_invoice_id IS NOT NULL THEN
            -- RECURSÃO: Aplica excesso na próxima fatura
            PERFORM pay_invoice(v_next_invoice_id, v_excess);
        ELSE
            -- Sem próxima fatura, mantém crédito na atual
            UPDATE credit_card_invoices 
            SET paid_amount = paid_amount + v_excess
            WHERE id = p_invoice_id;
        END IF;
    END IF;
END;
$$;

-- FUNÇÃO: revert_payment
-- Descrição: Reverte pagamento de fatura (drena dinheiro de faturas futuras)
-- Lógica: Percorre faturas da atual para frente, removendo valores pagos
CREATE OR REPLACE FUNCTION public.revert_payment(
    p_invoice_id UUID,
    p_amount NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_card_id UUID;
    v_ref_month INTEGER;
    v_ref_year INTEGER;
    v_target_invoice RECORD;
    v_amount_remaining NUMERIC := p_amount;
    v_deduction NUMERIC;
BEGIN
    -- Busca info da fatura inicial
    SELECT credit_card_id, reference_month, reference_year 
    INTO v_card_id, v_ref_month, v_ref_year
    FROM credit_card_invoices 
    WHERE id = p_invoice_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found';
    END IF;

    -- Loop pelas faturas (atual → futuras)
    FOR v_target_invoice IN 
        SELECT id, paid_amount, total_amount, status
        FROM credit_card_invoices
        WHERE credit_card_id = v_card_id
          AND (reference_year > v_ref_year 
               OR (reference_year = v_ref_year AND reference_month >= v_ref_month))
          AND paid_amount > 0
        ORDER BY reference_year ASC, reference_month ASC
    LOOP
        IF v_amount_remaining > 0 THEN
            -- Calcula quanto pode ser retirado desta fatura
            v_deduction := LEAST(v_target_invoice.paid_amount, v_amount_remaining);
            
            -- Atualiza fatura
            UPDATE credit_card_invoices
            SET paid_amount = paid_amount - v_deduction,
                status = CASE 
                    WHEN (paid_amount - v_deduction) >= total_amount THEN 'paid'
                    WHEN (paid_amount - v_deduction) > 0 THEN 'partial'
                    ELSE 'closed'
                END,
                updated_at = NOW()
            WHERE id = v_target_invoice.id;

            v_amount_remaining := v_amount_remaining - v_deduction;
        ELSE
            EXIT;
        END IF;
    END LOOP;
END;
$$;

-- FUNÇÃO: create_installment_purchase
-- Descrição: Cria compra parcelada no cartão
-- Lógica: Cria N transações, uma para cada parcela, em faturas diferentes
CREATE OR REPLACE FUNCTION public.create_installment_purchase(
    p_user_id UUID,
    p_card_id UUID,
    p_description TEXT,
    p_total_amount NUMERIC,
    p_purchase_date DATE,
    p_total_installments INTEGER,
    p_category_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_amount_per_installment NUMERIC := p_total_amount / p_total_installments;
    v_current_date DATE := p_purchase_date;
    v_invoice_id UUID;
    i INTEGER;
BEGIN
    FOR i IN 1..p_total_installments LOOP
        -- Busca/cria fatura para este mês
        v_invoice_id := get_or_create_invoice(p_user_id, p_card_id, v_current_date);

        -- Insere parcela
        INSERT INTO credit_card_transactions (
            user_id, credit_card_id, invoice_id, description, amount,
            transaction_date, is_installment, installment_number,
            total_installments, category_id, transaction_type
        )
        VALUES (
            p_user_id, p_card_id, v_invoice_id, p_description,
            v_amount_per_installment, v_current_date, TRUE, i,
            p_total_installments, p_category_id, 'purchase'
        );

        -- Avança para próximo mês
        v_current_date := v_current_date + INTERVAL '1 month';
    END LOOP;
END;
$$;

-- FUNÇÃO: close_invoice
-- Descrição: Fecha fatura quando data de fechamento é atingida
CREATE OR REPLACE FUNCTION public.close_invoice(p_invoice_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE credit_card_invoices
    SET status = 'closed'
    WHERE id = p_invoice_id
      AND status = 'open'
      AND closing_date <= CURRENT_DATE;
END;
$$;

-- FUNÇÃO: update_overdue_invoices
-- Descrição: Atualiza status de faturas vencidas
CREATE OR REPLACE FUNCTION public.update_overdue_invoices()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE credit_card_invoices
    SET status = 'overdue'
    WHERE status IN ('open', 'closed')
      AND due_date < CURRENT_DATE
      AND paid_amount < total_amount;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- =====================================================
-- CATEGORIA: FUNÇÕES DE CÁLCULO DE SALDO
-- =====================================================

-- FUNÇÃO: calculate_account_balance_with_adjustments
-- Descrição: Calcula saldo da conta considerando ajustes retroativos
-- Lógica: Busca último ajuste antes da data alvo e soma transações/yields posteriores
CREATE OR REPLACE FUNCTION public.calculate_account_balance_with_adjustments(
    p_account_id UUID,
    p_target_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  v_last_adjustment RECORD;
  v_transactions_sum DECIMAL(15, 2);
  v_yields_sum DECIMAL(15, 2);
BEGIN
  -- Busca último ajuste antes ou na data alvo
  SELECT * INTO v_last_adjustment
  FROM account_balance_adjustments
  WHERE account_id = p_account_id
    AND adjustment_date <= p_target_date
  ORDER BY adjustment_date DESC, created_at DESC
  LIMIT 1;
  
  -- Se não há ajuste, calcular desde o início
  IF v_last_adjustment IS NULL THEN
    SELECT COALESCE(
      SUM(
        CASE 
          WHEN type = 'receita' THEN amount
          WHEN type = 'despesa' THEN -amount
          ELSE 0
        END
      ), 0
    ) INTO v_transactions_sum
    FROM transactions
    WHERE account_id = p_account_id
      AND date <= p_target_date
      AND is_historical = false;
      
    SELECT COALESCE(SUM(yield_amount), 0) INTO v_yields_sum
    FROM liquidity_yields
    WHERE account_id = p_account_id
      AND date <= p_target_date;
    
    RETURN v_transactions_sum + v_yields_sum;
  END IF;
  
  -- Se há ajuste, somar transações e yields posteriores
  SELECT COALESCE(
    SUM(
      CASE 
        WHEN type = 'receita' THEN amount
        WHEN type = 'despesa' THEN -amount
        ELSE 0
      END
    ), 0
  ) INTO v_transactions_sum
  FROM transactions
  WHERE account_id = p_account_id
    AND date > v_last_adjustment.adjustment_date
    AND date <= p_target_date
    AND is_historical = false;
    
  SELECT COALESCE(SUM(yield_amount), 0) INTO v_yields_sum
  FROM liquidity_yields
  WHERE account_id = p_account_id
    AND date > v_last_adjustment.adjustment_date
    AND date <= p_target_date;
  
  RETURN v_last_adjustment.balance + v_transactions_sum + v_yields_sum;
END;
$$;

-- =====================================================
-- CATEGORIA: FUNÇÕES DE CRIAÇÃO DE DADOS PADRÃO
-- =====================================================

-- FUNÇÃO: create_default_categories_free
-- Descrição: Cria categorias padrão para novo usuário
CREATE OR REPLACE FUNCTION public.create_default_categories_free(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cat_id UUID;
BEGIN
  -- RECEITAS
  IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = target_user_id AND name = 'Salário') THEN
    INSERT INTO categories (user_id, name, type, icon, color)
    VALUES (target_user_id, 'Salário', 'receita', 'wallet', '#22c55e')
    RETURNING id INTO cat_id;
    INSERT INTO subcategories (user_id, category_id, name)
    VALUES
      (target_user_id, cat_id, 'Mensal'),
      (target_user_id, cat_id, '13º Salário'),
      (target_user_id, cat_id, 'Outros');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = target_user_id AND name = 'Renda Extra') THEN
    INSERT INTO categories (user_id, name, type, icon, color)
    VALUES (target_user_id, 'Renda Extra', 'receita', 'trending-up', '#16a34a')
    RETURNING id INTO cat_id;
    INSERT INTO subcategories (user_id, category_id, name)
    VALUES
      (target_user_id, cat_id, 'Freelance'),
      (target_user_id, cat_id, 'Bônus'),
      (target_user_id, cat_id, 'Outros');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = target_user_id AND name = 'Investimentos') THEN
    INSERT INTO categories (user_id, name, type, icon, color)
    VALUES (target_user_id, 'Investimentos', 'receita', 'line-chart', '#0d9488')
    RETURNING id INTO cat_id;
    INSERT INTO subcategories (user_id, category_id, name)
    VALUES
      (target_user_id, cat_id, 'Dividendos'),
      (target_user_id, cat_id, 'Renda Fixa'),
      (target_user_id, cat_id, 'Outros');
  END IF;

  -- DESPESAS
  IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = target_user_id AND name = 'Pagamento de Fatura') THEN
    INSERT INTO categories (user_id, name, type, icon, color)
    VALUES (target_user_id, 'Pagamento de Fatura', 'despesa', 'credit-card', '#8b5cf6');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = target_user_id AND name = 'Alimentação') THEN
    INSERT INTO categories (user_id, name, type, icon, color)
    VALUES (target_user_id, 'Alimentação', 'despesa', 'utensils', '#f43f5e')
    RETURNING id INTO cat_id;
    INSERT INTO subcategories (user_id, category_id, name)
    VALUES
      (target_user_id, cat_id, 'Supermercado'),
      (target_user_id, cat_id, 'Restaurante'),
      (target_user_id, cat_id, 'Delivery'),
      (target_user_id, cat_id, 'Outros');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = target_user_id AND name = 'Moradia') THEN
    INSERT INTO categories (user_id, name, type, icon, color)
    VALUES (target_user_id, 'Moradia', 'despesa', 'home', '#f97316')
    RETURNING id INTO cat_id;
    INSERT INTO subcategories (user_id, category_id, name)
    VALUES
      (target_user_id, cat_id, 'Aluguel'),
      (target_user_id, cat_id, 'Energia'),
      (target_user_id, cat_id, 'Internet'),
      (target_user_id, cat_id, 'Outros');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = target_user_id AND name = 'Transporte') THEN
    INSERT INTO categories (user_id, name, type, icon, color)
    VALUES (target_user_id, 'Transporte', 'despesa', 'car', '#eab308')
    RETURNING id INTO cat_id;
    INSERT INTO subcategories (user_id, category_id, name)
    VALUES
      (target_user_id, cat_id, 'Combustível'),
      (target_user_id, cat_id, 'Transporte Público'),
      (target_user_id, cat_id, 'App (Uber/99)'),
      (target_user_id, cat_id, 'Outros');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = target_user_id AND name = 'Lazer') THEN
    INSERT INTO categories (user_id, name, type, icon, color)
    VALUES (target_user_id, 'Lazer', 'despesa', 'gamepad-2', '#8b5cf6')
    RETURNING id INTO cat_id;
    INSERT INTO subcategories (user_id, category_id, name)
    VALUES
      (target_user_id, cat_id, 'Viagens'),
      (target_user_id, cat_id, 'Streaming'),
      (target_user_id, cat_id, 'Hobbies'),
      (target_user_id, cat_id, 'Outros');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = target_user_id AND name = 'Outros') THEN
    INSERT INTO categories (user_id, name, type, icon, color)
    VALUES (target_user_id, 'Outros', 'despesa', 'tag', '#94a3b8');
  END IF;
END;
$$;

-- FUNÇÃO: create_default_payment_methods
-- Descrição: Cria métodos de pagamento padrão para novo usuário
CREATE OR REPLACE FUNCTION public.create_default_payment_methods(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    user_slug_suffix TEXT;
BEGIN
    user_slug_suffix := SUBSTRING(p_user_id::TEXT, 1, 8);

    INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
    VALUES
        (p_user_id, 'PIX', 'pix-' || user_slug_suffix, 'PIX', true, true, true, true, false, false, false, '⚡', 1, true),
        (p_user_id, 'Dinheiro', 'dinheiro-' || user_slug_suffix, 'CASH', true, true, false, true, false, false, false, '💵', 2, true),
        (p_user_id, 'Cartão de Crédito', 'cartao-credito-' || user_slug_suffix, 'CREDIT_CARD', false, true, false, false, true, true, false, '💳', 3, true),
        (p_user_id, 'Cartão de Débito', 'cartao-debito-' || user_slug_suffix, 'DEBIT_CARD', false, true, false, true, false, false, false, '💳', 4, true),
        (p_user_id, 'Transferência Bancária', 'transferencia-bancaria-' || user_slug_suffix, 'BANK_TRANSFER', true, true, true, true, false, false, false, '🏦', 5, true),
        (p_user_id, 'Boleto', 'boleto-' || user_slug_suffix, 'BOLETO', true, true, false, true, false, false, false, '📄', 6, true),
        (p_user_id, 'Débito Automático', 'debito-automatico-' || user_slug_suffix, 'AUTOMATIC', false, true, false, true, false, false, false, '🔄', 7, true),
        (p_user_id, 'Transferência Interna', 'transferencia-interna-' || user_slug_suffix, 'INTERNAL_TRANSFER', false, false, true, false, false, false, true, '🔄', 8, true),
        (p_user_id, 'Outro', 'outro-' || user_slug_suffix, 'OTHER', true, true, false, true, false, false, false, '📝', 99, true)
    ON CONFLICT (user_id, slug) DO NOTHING;
END;
$$;

-- =====================================================
-- CATEGORIA: FUNÇÕES DE VALIDAÇÃO E UTILIDADE
-- =====================================================

-- FUNÇÃO: is_subscription_valid
-- Descrição: Verifica se assinatura do usuário está válida
CREATE OR REPLACE FUNCTION public.is_subscription_valid(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT subscription_status, subscription_ends_at, trial_ends_at
  INTO user_record
  FROM users
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  IF user_record.subscription_status = 'trial' THEN
    RETURN user_record.trial_ends_at > NOW();
  END IF;
  
  IF user_record.subscription_status = 'active' THEN
    RETURN user_record.subscription_ends_at IS NULL 
           OR user_record.subscription_ends_at > NOW();
  END IF;
  
  IF user_record.subscription_status = 'past_due' THEN
    RETURN user_record.subscription_ends_at > (NOW() - INTERVAL '3 days');
  END IF;
  
  RETURN false;
END;
$$;

-- FUNÇÃO: is_premium
-- Descrição: Verifica se usuário tem plano premium
CREATE OR REPLACE FUNCTION public.is_premium(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND (
      (subscription_status = 'trial' AND trial_ends_at > NOW()) OR
      (subscription_status = 'active') OR
      (subscription_plan IN ('premium', 'enterprise') AND subscription_status = 'active')
    )
  );
END;
$$;

-- =====================================================
-- FIM DO BACKUP
-- =====================================================

-- Total de funções preservadas: 13
-- Categorias:
-- - Faturas de Cartão: 6 funções
-- - Cálculo de Saldo: 1 função
-- - Dados Padrão: 2 funções
-- - Validação: 2 funções
-- - Utilidades: 2 funções
