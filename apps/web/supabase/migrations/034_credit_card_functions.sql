-- =====================================================
-- FUNÇÕES AUXILIARES PARA GESTÃO DE CARTÕES
-- =====================================================

-- =====================================================
-- FUNCTION: Criar ou obter fatura do mês
-- =====================================================
CREATE OR REPLACE FUNCTION get_or_create_invoice(
    p_user_id UUID,
    p_card_id UUID,
    p_transaction_date DATE
)
RETURNS UUID AS $$
DECLARE
    v_invoice_id UUID;
    v_closing_day INTEGER;
    v_due_day INTEGER;
    v_ref_month INTEGER;
    v_ref_year INTEGER;
    v_closing_date DATE;
    v_due_date DATE;
BEGIN
    -- Buscar dados do cartão
    SELECT closing_day, due_day INTO v_closing_day, v_due_day
    FROM public.credit_cards
    WHERE id = p_card_id AND user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cartão não encontrado';
    END IF;

    -- Determinar mês de referência da fatura
    -- Se a compra foi feita após o fechamento, vai para a próxima fatura
    IF EXTRACT(DAY FROM p_transaction_date) > v_closing_day THEN
        v_ref_month := EXTRACT(MONTH FROM p_transaction_date + INTERVAL '1 month');
        v_ref_year := EXTRACT(YEAR FROM p_transaction_date + INTERVAL '1 month');
    ELSE
        v_ref_month := EXTRACT(MONTH FROM p_transaction_date);
        v_ref_year := EXTRACT(YEAR FROM p_transaction_date);
    END IF;

    -- Calcular datas de fechamento e vencimento
    v_closing_date := make_date(v_ref_year, v_ref_month, LEAST(v_closing_day, 28));
    
    -- Vencimento é no mês seguinte ao fechamento
    v_due_date := make_date(v_ref_year, v_ref_month, LEAST(v_due_day, 28)) + INTERVAL '1 month';

    -- Tentar buscar fatura existente
    SELECT id INTO v_invoice_id
    FROM public.credit_card_invoices
    WHERE credit_card_id = p_card_id
      AND reference_month = v_ref_month
      AND reference_year = v_ref_year;

    -- Se não existir, criar
    IF v_invoice_id IS NULL THEN
        INSERT INTO public.credit_card_invoices (
            user_id,
            credit_card_id,
            reference_month,
            reference_year,
            closing_date,
            due_date,
            status
        ) VALUES (
            p_user_id,
            p_card_id,
            v_ref_month,
            v_ref_year,
            v_closing_date,
            v_due_date,
            'open'
        ) RETURNING id INTO v_invoice_id;
    END IF;

    RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Criar compra parcelada
-- =====================================================
CREATE OR REPLACE FUNCTION create_installment_purchase(
    p_user_id UUID,
    p_card_id UUID,
    p_description TEXT,
    p_total_amount NUMERIC,
    p_purchase_date DATE,
    p_total_installments INTEGER,
    p_category_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_parent_id UUID;
    v_installment_amount NUMERIC;
    v_current_date DATE;
    v_invoice_id UUID;
    i INTEGER;
BEGIN
    -- Validar
    IF p_total_installments < 2 THEN
        RAISE EXCEPTION 'Parcelamento deve ter no mínimo 2 parcelas';
    END IF;

    -- Calcular valor da parcela
    v_installment_amount := ROUND(p_total_amount / p_total_installments, 2);

    -- Criar transação pai (registro da compra original)
    INSERT INTO public.credit_card_transactions (
        user_id,
        credit_card_id,
        description,
        amount,
        transaction_date,
        is_installment,
        total_installments,
        category_id,
        transaction_type
    ) VALUES (
        p_user_id,
        p_card_id,
        p_description || ' (Compra Original)',
        p_total_amount,
        p_purchase_date,
        TRUE,
        p_total_installments,
        p_category_id,
        'purchase'
    ) RETURNING id INTO v_parent_id;

    -- Criar cada parcela
    FOR i IN 1..p_total_installments LOOP
        -- Data da parcela (mês a mês)
        v_current_date := p_purchase_date + ((i - 1) || ' months')::INTERVAL;
        
        -- Obter ou criar fatura para esta parcela
        v_invoice_id := get_or_create_invoice(p_user_id, p_card_id, v_current_date);
        
        -- Criar parcela
        INSERT INTO public.credit_card_transactions (
            user_id,
            credit_card_id,
            invoice_id,
            description,
            amount,
            transaction_date,
            is_installment,
            installment_number,
            total_installments,
            parent_transaction_id,
            category_id,
            transaction_type
        ) VALUES (
            p_user_id,
            p_card_id,
            v_invoice_id,
            p_description || ' (' || i || '/' || p_total_installments || ')',
            v_installment_amount,
            v_current_date,
            TRUE,
            i,
            p_total_installments,
            v_parent_id,
            p_category_id,
            'purchase'
        );
    END LOOP;

    RETURN v_parent_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Atualizar status das faturas vencidas
-- =====================================================
CREATE OR REPLACE FUNCTION update_overdue_invoices()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.credit_card_invoices
    SET status = 'overdue'
    WHERE status IN ('open', 'closed')
      AND due_date < CURRENT_DATE
      AND paid_amount < total_amount;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Fechar fatura automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION close_invoice(p_invoice_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.credit_card_invoices
    SET status = 'closed'
    WHERE id = p_invoice_id
      AND status = 'open'
      AND closing_date <= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Registrar pagamento de fatura
-- =====================================================
CREATE OR REPLACE FUNCTION pay_invoice(
    p_invoice_id UUID,
    p_amount NUMERIC
)
RETURNS VOID AS $$
DECLARE
    v_total NUMERIC;
    v_paid NUMERIC;
BEGIN
    SELECT total_amount, paid_amount INTO v_total, v_paid
    FROM public.credit_card_invoices
    WHERE id = p_invoice_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Fatura não encontrada';
    END IF;

    -- Atualizar valor pago
    UPDATE public.credit_card_invoices
    SET 
        paid_amount = paid_amount + p_amount,
        status = CASE
            WHEN (paid_amount + p_amount) >= total_amount THEN 'paid'
            WHEN (paid_amount + p_amount) > 0 THEN 'partial'
            ELSE status
        END
    WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql;
