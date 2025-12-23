-- =====================================================
-- MIGRATION: Adicionar Locks em Trigger de Atualização de Saldo
-- OBJETIVO: Prevenir Race Conditions em operações concorrentes
-- PRIORIDADE: CRÍTICA
-- =====================================================

-- =====================================================
-- PROBLEMA IDENTIFICADO:
-- O trigger handle_balance_update() atualiza o saldo sem lock,
-- permitindo que duas transações simultâneas leiam o mesmo saldo
-- e sobrescrevam uma à outra, causando perda de dados.
-- =====================================================

-- =====================================================
-- SOLUÇÃO:
-- Usar SELECT ... FOR UPDATE para lock pessimista antes de atualizar
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_balance_update()
RETURNS TRIGGER AS $$
DECLARE
    v_account_balance NUMERIC;
    v_dest_account_balance NUMERIC;
BEGIN
  -- ---------------------------------------------------
  -- CENÁRIO 1: INSERT (Nova Transação)
  -- ---------------------------------------------------
  IF (TG_OP = 'INSERT') THEN
    IF NEW.is_paid = true THEN
      
      -- Receita: Soma na conta
      IF NEW.type = 'receita' THEN
        -- LOCK da conta antes de atualizar
        SELECT balance INTO v_account_balance 
        FROM public.accounts 
        WHERE id = NEW.account_id 
        FOR UPDATE;
        
        -- Atualiza com valor locked
        UPDATE public.accounts 
        SET balance = balance + NEW.amount 
        WHERE id = NEW.account_id;
      
      -- Despesa: Subtrai da conta
      ELSIF NEW.type = 'despesa' THEN
        -- LOCK da conta antes de atualizar
        SELECT balance INTO v_account_balance 
        FROM public.accounts 
        WHERE id = NEW.account_id 
        FOR UPDATE;
        
        -- Validar saldo suficiente (opcional, mas recomendado)
        IF v_account_balance < NEW.amount THEN
          RAISE EXCEPTION 'Saldo insuficiente. Saldo atual: %, Valor da despesa: %', v_account_balance, NEW.amount;
        END IF;
        
        -- Atualiza com valor locked
        UPDATE public.accounts 
        SET balance = balance - NEW.amount 
        WHERE id = NEW.account_id;
      
      -- Transferência: Tira da origem, Põe no destino
      ELSIF NEW.type = 'transferencia' AND NEW.destination_account_id IS NOT NULL THEN
        -- LOCK de AMBAS as contas (ordem alfabética por ID para evitar deadlock)
        IF NEW.account_id < NEW.destination_account_id THEN
          SELECT balance INTO v_account_balance 
          FROM public.accounts 
          WHERE id = NEW.account_id 
          FOR UPDATE;
          
          SELECT balance INTO v_dest_account_balance 
          FROM public.accounts 
          WHERE id = NEW.destination_account_id 
          FOR UPDATE;
        ELSE
          SELECT balance INTO v_dest_account_balance 
          FROM public.accounts 
          WHERE id = NEW.destination_account_id 
          FOR UPDATE;
          
          SELECT balance INTO v_account_balance 
          FROM public.accounts 
          WHERE id = NEW.account_id 
          FOR UPDATE;
        END IF;
        
        -- Validar saldo suficiente na conta de origem
        IF v_account_balance < NEW.amount THEN
          RAISE EXCEPTION 'Saldo insuficiente para transferência. Saldo atual: %, Valor da transferência: %', v_account_balance, NEW.amount;
        END IF;
        
        -- Atualiza ambas as contas
        UPDATE public.accounts 
        SET balance = balance - NEW.amount 
        WHERE id = NEW.account_id;
        
        UPDATE public.accounts 
        SET balance = balance + NEW.amount 
        WHERE id = NEW.destination_account_id;
      END IF;

    END IF;
    RETURN NEW;

  -- ---------------------------------------------------
  -- CENÁRIO 2: DELETE (Remover Transação)
  -- ---------------------------------------------------
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.is_paid = true THEN
      
      -- Receita removida: Subtrai o valor que tinha entrado
      IF OLD.type = 'receita' THEN
        -- LOCK da conta antes de atualizar
        SELECT balance INTO v_account_balance 
        FROM public.accounts 
        WHERE id = OLD.account_id 
        FOR UPDATE;
        
        UPDATE public.accounts 
        SET balance = balance - OLD.amount 
        WHERE id = OLD.account_id;
      
      -- Despesa removida: Devolve o valor para a conta
      ELSIF OLD.type = 'despesa' THEN
        -- LOCK da conta antes de atualizar
        SELECT balance INTO v_account_balance 
        FROM public.accounts 
        WHERE id = OLD.account_id 
        FOR UPDATE;
        
        UPDATE public.accounts 
        SET balance = balance + OLD.amount 
        WHERE id = OLD.account_id;
      
      -- Transferência removida: Devolve para origem, tira do destino
      ELSIF OLD.type = 'transferencia' AND OLD.destination_account_id IS NOT NULL THEN
        -- LOCK de AMBAS as contas (ordem alfabética por ID)
        IF OLD.account_id < OLD.destination_account_id THEN
          SELECT balance INTO v_account_balance 
          FROM public.accounts 
          WHERE id = OLD.account_id 
          FOR UPDATE;
          
          SELECT balance INTO v_dest_account_balance 
          FROM public.accounts 
          WHERE id = OLD.destination_account_id 
          FOR UPDATE;
        ELSE
          SELECT balance INTO v_dest_account_balance 
          FROM public.accounts 
          WHERE id = OLD.destination_account_id 
          FOR UPDATE;
          
          SELECT balance INTO v_account_balance 
          FROM public.accounts 
          WHERE id = OLD.account_id 
          FOR UPDATE;
        END IF;
        
        -- Atualiza ambas as contas
        UPDATE public.accounts 
        SET balance = balance + OLD.amount 
        WHERE id = OLD.account_id;
        
        UPDATE public.accounts 
        SET balance = balance - OLD.amount 
        WHERE id = OLD.destination_account_id;
      END IF;

    END IF;
    RETURN OLD;

  -- ---------------------------------------------------
  -- CENÁRIO 3: UPDATE (Editar Transação)
  -- ---------------------------------------------------
  ELSIF (TG_OP = 'UPDATE') THEN
    -- A lógica simples é: Reverte o OLD e Aplica o NEW
    -- Isso cobre mudança de valor, de conta, de tipo e de status (is_paid)

    -- 1. Reverter OLD (se estava pago)
    IF OLD.is_paid = true THEN
      IF OLD.type = 'receita' THEN
        -- LOCK da conta antes de atualizar
        SELECT balance INTO v_account_balance 
        FROM public.accounts 
        WHERE id = OLD.account_id 
        FOR UPDATE;
        
        UPDATE public.accounts 
        SET balance = balance - OLD.amount 
        WHERE id = OLD.account_id;
        
      ELSIF OLD.type = 'despesa' THEN
        -- LOCK da conta antes de atualizar
        SELECT balance INTO v_account_balance 
        FROM public.accounts 
        WHERE id = OLD.account_id 
        FOR UPDATE;
        
        UPDATE public.accounts 
        SET balance = balance + OLD.amount 
        WHERE id = OLD.account_id;
        
      ELSIF OLD.type = 'transferencia' AND OLD.destination_account_id IS NOT NULL THEN
        -- LOCK de AMBAS as contas (ordem alfabética por ID)
        IF OLD.account_id < OLD.destination_account_id THEN
          SELECT balance INTO v_account_balance 
          FROM public.accounts 
          WHERE id = OLD.account_id 
          FOR UPDATE;
          
          SELECT balance INTO v_dest_account_balance 
          FROM public.accounts 
          WHERE id = OLD.destination_account_id 
          FOR UPDATE;
        ELSE
          SELECT balance INTO v_dest_account_balance 
          FROM public.accounts 
          WHERE id = OLD.destination_account_id 
          FOR UPDATE;
          
          SELECT balance INTO v_account_balance 
          FROM public.accounts 
          WHERE id = OLD.account_id 
          FOR UPDATE;
        END IF;
        
        UPDATE public.accounts 
        SET balance = balance + OLD.amount 
        WHERE id = OLD.account_id;
        
        UPDATE public.accounts 
        SET balance = balance - OLD.amount 
        WHERE id = OLD.destination_account_id;
      END IF;
    END IF;

    -- 2. Aplicar NEW (se está pago)
    IF NEW.is_paid = true THEN
      IF NEW.type = 'receita' THEN
        -- LOCK da conta antes de atualizar
        SELECT balance INTO v_account_balance 
        FROM public.accounts 
        WHERE id = NEW.account_id 
        FOR UPDATE;
        
        UPDATE public.accounts 
        SET balance = balance + NEW.amount 
        WHERE id = NEW.account_id;
        
      ELSIF NEW.type = 'despesa' THEN
        -- LOCK da conta antes de atualizar
        SELECT balance INTO v_account_balance 
        FROM public.accounts 
        WHERE id = NEW.account_id 
        FOR UPDATE;
        
        -- Validar saldo suficiente
        IF v_account_balance < NEW.amount THEN
          RAISE EXCEPTION 'Saldo insuficiente. Saldo atual: %, Valor da despesa: %', v_account_balance, NEW.amount;
        END IF;
        
        UPDATE public.accounts 
        SET balance = balance - NEW.amount 
        WHERE id = NEW.account_id;
        
      ELSIF NEW.type = 'transferencia' AND NEW.destination_account_id IS NOT NULL THEN
        -- LOCK de AMBAS as contas (ordem alfabética por ID)
        IF NEW.account_id < NEW.destination_account_id THEN
          SELECT balance INTO v_account_balance 
          FROM public.accounts 
          WHERE id = NEW.account_id 
          FOR UPDATE;
          
          SELECT balance INTO v_dest_account_balance 
          FROM public.accounts 
          WHERE id = NEW.destination_account_id 
          FOR UPDATE;
        ELSE
          SELECT balance INTO v_dest_account_balance 
          FROM public.accounts 
          WHERE id = NEW.destination_account_id 
          FOR UPDATE;
          
          SELECT balance INTO v_account_balance 
          FROM public.accounts 
          WHERE id = NEW.account_id 
          FOR UPDATE;
        END IF;
        
        -- Validar saldo suficiente
        IF v_account_balance < NEW.amount THEN
          RAISE EXCEPTION 'Saldo insuficiente para transferência. Saldo atual: %, Valor da transferência: %', v_account_balance, NEW.amount;
        END IF;
        
        UPDATE public.accounts 
        SET balance = balance - NEW.amount 
        WHERE id = NEW.account_id;
        
        UPDATE public.accounts 
        SET balance = balance + NEW.amount 
        WHERE id = NEW.destination_account_id;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION public.handle_balance_update() IS 
'Trigger function que atualiza o saldo das contas automaticamente quando transações são criadas/editadas/deletadas.
IMPORTANTE: Usa SELECT ... FOR UPDATE para prevenir race conditions.
VALIDAÇÃO: Verifica saldo suficiente antes de criar despesas/transferências.';

-- =====================================================
-- VERIFICAÇÃO DE INTEGRIDADE
-- =====================================================

-- Verificar se o trigger está ativo
SELECT 
    tgname as trigger_name,
    tgtype as trigger_type,
    tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'on_transaction_change';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
