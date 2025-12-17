-- =====================================================
-- FUNCTION: pay_invoice (Aprimorada com Overpayment)
-- Lógica:
-- 1. Se valor <= restante: Pagamento normal (parcial ou total)
-- 2. Se valor > restante:
--    a. Paga o restante da fatura atual (fecha como paga)
--    b. Calcula o excedente (surplus)
--    c. Busca/Cria a fatura do mês seguinte
--    d. Insere uma transação de CRÉDITO (valor negativo) na próxima fatura
-- =====================================================

CREATE OR REPLACE FUNCTION pay_invoice(p_invoice_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
    v_invoice RECORD;
    v_total NUMERIC;
    v_paid NUMERIC;
    v_remaining NUMERIC;
    v_surplus NUMERIC;
    v_next_month INT;
    v_next_year INT;
    v_next_invoice_id UUID;
    v_user_id UUID;
BEGIN
    -- 1. Buscar dados da fatura atual
    SELECT * INTO v_invoice FROM public.credit_card_invoices WHERE id = p_invoice_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Fatura não encontrada.';
    END IF;

    v_user_id := v_invoice.user_id;
    v_total := v_invoice.total_amount;
    v_paid := v_invoice.paid_amount;
    v_remaining := v_total - v_paid; -- Quanto falta pagar

    -- Validação básica
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'O valor do pagamento deve ser positivo.';
    END IF;

    -- LÓGICA DE PAGAMENTO
    IF p_amount <= v_remaining THEN
        -- CASO 1: Pagamento total ou parcial (sem excedente)
        UPDATE public.credit_card_invoices
        SET 
            paid_amount = paid_amount + p_amount,
            status = CASE 
                WHEN (paid_amount + p_amount) >= total_amount - 0.01 THEN 'paid' -- Tolerância de centavos
                ELSE 'partial'
            END,
            updated_at = NOW()
        WHERE id = p_invoice_id;
        
    ELSE
        -- CASO 2: Pagamento com excedente (Overpayment)
        v_surplus := p_amount - v_remaining;

        -- a. Quitar fatura atual totalmente
        UPDATE public.credit_card_invoices
        SET 
            paid_amount = total_amount, -- Paga apenas o necessário para zerar
            status = 'paid',
            updated_at = NOW()
        WHERE id = p_invoice_id;

        -- b. Calcular data da próxima fatura
        IF v_invoice.reference_month = 12 THEN
            v_next_month := 1;
            v_next_year := v_invoice.reference_year + 1;
        ELSE
            v_next_month := v_invoice.reference_month + 1;
            v_next_year := v_invoice.reference_year;
        END IF;

        -- c. Buscar ou Criar fatura da próxima competência
        -- Usamos uma data fictícia (dia 1 do próximo mês) para usar a função get_or_create_invoice
        -- NOTA: get_or_create_invoice espera uma data completa. Vamos construir uma.
        -- ALTERNATIVA: Inserir diretamente se não existir.
        
        -- Tenta buscar
        SELECT id INTO v_next_invoice_id 
        FROM public.credit_card_invoices
        WHERE credit_card_id = v_invoice.credit_card_id
          AND reference_month = v_next_month
          AND reference_year = v_next_year;

        -- Se não existir, cria usando a lógica do closing_day do cartão
        IF v_next_invoice_id IS NULL THEN
            -- Precisamos chamar get_or_create_invoice passando uma data que caia nessa fatura.
            -- Uma data segura é o dia do vencimento da fatura atual + 15 dias.
            -- Ou simplesmente dia 10 do mês seguinte (simplificação).
            
            -- Vamos usar function existente get_or_create_invoice
            SELECT get_or_create_invoice(
                v_user_id, 
                v_invoice.credit_card_id, 
                (make_date(v_next_year, v_next_month, 10))::DATE -- Dia 10 do próximo mês
            ) INTO v_next_invoice_id;
        END IF;

        -- d. Inserir crédito (valor negativo) na próxima fatura
        INSERT INTO public.credit_card_transactions (
            user_id,
            credit_card_id,
            invoice_id,
            description,
            amount,
            transaction_date,
            transaction_type, -- Tipo 'adjustment' ou 'payment'
            category_id
        ) VALUES (
            v_user_id,
            v_invoice.credit_card_id,
            v_next_invoice_id,
            'Crédito por Pagamento Antecipado (' || TO_CHAR(NOW(), 'DD/MM') || ')',
            -v_surplus, -- Valor negativo para abater
            CURRENT_DATE,
            'adjustment',
            (SELECT id FROM categories WHERE name = 'Ajuste' OR name = 'Outros' LIMIT 1) -- Tenta pegar uma categoria padrão
        );

    END IF;
END;
$$ LANGUAGE plpgsql;
