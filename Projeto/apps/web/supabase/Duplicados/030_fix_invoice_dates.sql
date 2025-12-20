-- =================================================================
-- FIX: Lógica de Calculo de Datas de Fatura e Vencimento
-- =================================================================

-- 1. Função Atualizada para Obter ou Criar Fatura
CREATE OR REPLACE FUNCTION get_or_create_invoice(
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
    v_tmp_date DATE;
BEGIN
    -- Obter dados do cartão
    SELECT closing_day, due_day INTO v_closing_day, v_due_day
    FROM credit_cards WHERE id = p_card_id;

    v_transaction_day := EXTRACT(DAY FROM p_transaction_date);

    -- LÓGICA DE REFERÊNCIA (Mês da Fatura)
    -- Se a compra foi feita ANTES do fechamento, a fatura é do mês da compra.
    -- Se foi feita NO DIA ou DEPOIS, a fatura é do mês seguinte.
    IF v_transaction_day < v_closing_day THEN
        v_ref_month := EXTRACT(MONTH FROM p_transaction_date);
        v_ref_year := EXTRACT(YEAR FROM p_transaction_date);
    ELSE
        -- Pula para o próximo mês
        v_tmp_date := p_transaction_date + interval '1 month';
        v_ref_month := EXTRACT(MONTH FROM v_tmp_date);
        v_ref_year := EXTRACT(YEAR FROM v_tmp_date);
    END IF;

    -- Tenta encontrar fatura existente para esta referência
    SELECT id INTO v_invoice_id
    FROM credit_card_invoices
    WHERE credit_card_id = p_card_id
      AND reference_month = v_ref_month
      AND reference_year = v_ref_year;

    -- Se não existe, cria
    IF v_invoice_id IS NULL THEN
        -- CALCULO DAS DATAS DA FATURA
        -- Data de Fechamento: Dia X do Mês/Ano de Referência
        -- Tratamento para datas inválidas (ex: 30 de Fevereiro)
        -- O Postgres ajusta automaticamente se usarmos aritmética de datas, mas make_date pode falhar.
        -- Vamos usar uma abordagem segura: Data do dia 1 + dias
        
        v_closing_date := make_date(v_ref_year, v_ref_month, 1) + (v_closing_day - 1) * interval '1 day';

        -- Data de Vencimento:
        -- Se Dia Vencimento < Dia Fechamento, o vencimento é no mês SEGUINTE à referência.
        -- Se Dia Vencimento >= Dia Fechamento, o vencimento é no MESMO mês da referência.
        
        IF v_due_day < v_closing_day THEN
             -- Vence no mês seguinte
             v_due_date := (make_date(v_ref_year, v_ref_month, 1) + interval '1 month') + (v_due_day - 1) * interval '1 day';
        ELSE
             -- Vence no mesmo mês
             v_due_date := make_date(v_ref_year, v_ref_month, 1) + (v_due_day - 1) * interval '1 day';
        END IF;

        INSERT INTO credit_card_invoices (
            user_id, credit_card_id, reference_month, reference_year, 
            status, closing_date, due_date, total_amount, paid_amount
        ) VALUES (
            p_user_id, p_card_id, v_ref_month, v_ref_year,
            'open', v_closing_date, v_due_date, 0, 0
        ) RETURNING id INTO v_invoice_id;
    END IF;

    RETURN v_invoice_id;
END;
$$;


-- 2. Função Atualizada para Parcelamento
CREATE OR REPLACE FUNCTION create_installment_purchase(
    p_user_id UUID,
    p_card_id UUID,
    p_description TEXT,
    p_total_amount DECIMAL,
    p_purchase_date DATE,
    p_total_installments INTEGER,
    p_category_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_installment_amount DECIMAL;
    v_current_date DATE;
    v_invoice_id UUID;
    i INTEGER;
BEGIN
    v_installment_amount := p_total_amount / p_total_installments;
    v_current_date := p_purchase_date;

    FOR i IN 1..p_total_installments LOOP
        -- Para cada parcela, calculamos a fatura correta baseada na "data da compra virtual"
        -- Para a parcela 1, é a data da compra.
        -- Para a parcela 2, é data da compra + 1 mês, etc.
        -- get_or_create_invoice vai cuidar de jogar para o mês seguinte se passar do fechamento
        
        v_invoice_id := get_or_create_invoice(p_user_id, p_card_id, v_current_date);

        INSERT INTO credit_card_transactions (
            user_id, credit_card_id, invoice_id, description,
            amount, transaction_date, is_installment, 
            installment_number, total_installments, category_id,
            transaction_type
        ) VALUES (
            p_user_id, p_card_id, v_invoice_id, p_description,
            v_installment_amount, v_current_date, TRUE,
            i, p_total_installments, p_category_id,
            'purchase'
        );

        -- Avançar 1 mês para a próxima parcela
        v_current_date := v_current_date + interval '1 month';
    END LOOP;
END;
$$;
