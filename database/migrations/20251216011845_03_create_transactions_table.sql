-- =====================================================
-- TABELA DE TRANSAÇÕES
-- Registro financeiro (Ledger)
-- =====================================================

-- Drop se existir
DROP TYPE IF EXISTS tipo_transacao CASCADE;

-- Enum para tipo de transação
CREATE TYPE tipo_transacao AS ENUM (
  'receita',
  'despesa',
  'transferencia' -- Sai de uma conta e entra em outra
);

CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Vínculos
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE, -- Conta de Origem
  destination_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL, -- Apenas para Transferência
  
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL, -- Opcional para transferências
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  
  -- Dados financeiros
  description TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0), -- Sempre positivo, o tipo define o sinal
  type tipo_transacao NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Metadados
  is_paid BOOLEAN DEFAULT true, -- Se já foi pago/recebido ou é agendamento
  notes TEXT,
  attachment_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);

-- Trigger updated_at
CREATE TRIGGER set_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

GRANT ALL ON TABLE public.transactions TO authenticated;
GRANT ALL ON TABLE public.transactions TO service_role;

-- =====================================================
-- TRIGGER INTELIGENTE: ATUALIZAÇÃO DE SALDO
-- Mantém a tabela accounts sincronizada
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_balance_update()
RETURNS TRIGGER AS $$
BEGIN
  -- ---------------------------------------------------
  -- CENÁRIO 1: INSERT (Nova Transação)
  -- ---------------------------------------------------
  IF (TG_OP = 'INSERT') THEN
    IF NEW.is_paid = true THEN
      
      -- Receita: Soma na conta
      IF NEW.type = 'receita' THEN
        UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
      
      -- Despesa: Subtrai da conta
      ELSIF NEW.type = 'despesa' THEN
        UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
      
      -- Transferência: Tira da origem, Põe no destino
      ELSIF NEW.type = 'transferencia' AND NEW.destination_account_id IS NOT NULL THEN
        UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
        UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.destination_account_id;
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
        UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
      
      -- Despesa removida: Devolve o valor para a conta
      ELSIF OLD.type = 'despesa' THEN
        UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
      
      -- Transferência removida: Devolve para origem, tira do destino
      ELSIF OLD.type = 'transferencia' AND OLD.destination_account_id IS NOT NULL THEN
        UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
        UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.destination_account_id;
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
        UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
      ELSIF OLD.type = 'despesa' THEN
        UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
      ELSIF OLD.type = 'transferencia' AND OLD.destination_account_id IS NOT NULL THEN
        UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
        UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.destination_account_id;
      END IF;
    END IF;

    -- 2. Aplicar NEW (se está pago)
    IF NEW.is_paid = true THEN
      IF NEW.type = 'receita' THEN
        UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
      ELSIF NEW.type = 'despesa' THEN
        UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
      ELSIF NEW.type = 'transferencia' AND NEW.destination_account_id IS NOT NULL THEN
        UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
        UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.destination_account_id;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_balance_update();
