-- =====================================================
-- TABELA DE CONTAS (CARTEIRAS)
-- Onde o dinheiro está armazenado (Saldo)
-- =====================================================

-- Drop se existir para evitar conflito ao recriar
DROP TYPE IF EXISTS tipo_conta CASCADE;

-- Criar ENUM para tipos de conta (EM PORTUGUÊS)
CREATE TYPE tipo_conta AS ENUM (
  'corrente',      -- Conta Corrente
  'poupanca',      -- Poupança
  'investimento',  -- Investimentos
  'dinheiro',      -- Dinheiro Físico
  'outros'         -- Outros
);

-- Tabela de Contas
CREATE TABLE public.accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  type tipo_conta NOT NULL DEFAULT 'corrente', -- Alterado para usar o enum em PT
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00, -- Saldo atual
  
  -- Aparência
  color TEXT DEFAULT '#3b82f6', -- Cor para gráficos/UI
  icon TEXT, -- Nome do ícone (lucide-react)
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_is_active ON public.accounts(is_active);

-- Trigger para updated_at
CREATE TRIGGER set_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- RLS (SEGURANÇA)
-- =====================================================

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Política: Ver apenas minhas contas
CREATE POLICY "Users can view own accounts"
  ON public.accounts FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Criar contas para si mesmo
CREATE POLICY "Users can insert own accounts"
  ON public.accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Editar minhas contas
CREATE POLICY "Users can update own accounts"
  ON public.accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Deletar minhas contas
CREATE POLICY "Users can delete own accounts"
  ON public.accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Permissões (Isso evita o erro de permission denied)
GRANT ALL ON TABLE public.accounts TO authenticated;
GRANT ALL ON TABLE public.accounts TO service_role;
