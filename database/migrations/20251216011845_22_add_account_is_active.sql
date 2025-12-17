-- Adiciona coluna is_active na tabela accounts
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Atualizar índice se necessário, embora is_active seja pouco seletivo para index sozinho, pode ajudar em filtros compostos
-- CREATE INDEX idx_accounts_is_active ON public.accounts(is_active);
