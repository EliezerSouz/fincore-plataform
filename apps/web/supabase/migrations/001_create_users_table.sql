-- =====================================================
-- TABELA DE USUÁRIOS DO SAAS
-- =====================================================

-- Criar ENUM para status de assinatura
CREATE TYPE subscription_status AS ENUM (
  'trial',           -- Período de teste (7-30 dias)
  'active',          -- Assinatura ativa e paga
  'past_due',        -- Pagamento atrasado (grace period)
  'canceled',        -- Cancelada pelo usuário
  'suspended'        -- Suspensa por falta de pagamento
);

-- Criar ENUM para planos
CREATE TYPE subscription_plan AS ENUM (
  'free',            -- Plano gratuito (limitado)
  'basic',           -- Plano básico
  'premium',         -- Plano premium
  'enterprise'       -- Plano enterprise
);

-- Tabela principal de usuários
CREATE TABLE public.users (
  -- Identificação
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados pessoais (vindos do signup)
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  
  -- Assinatura e pagamento
  subscription_plan subscription_plan NOT NULL DEFAULT 'trial',
  subscription_status subscription_status NOT NULL DEFAULT 'trial',
  subscription_started_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'), -- 14 dias de trial
  
  -- Pagamento
  last_payment_date TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  payment_method TEXT, -- 'credit_card', 'pix', 'boleto', etc.
  
  -- Metadados
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Flags de controle
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  
  -- Índices para busca rápida
  CONSTRAINT users_email_key UNIQUE (email)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX idx_users_subscription_plan ON public.users(subscription_plan);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- =====================================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- FUNÇÃO: Criar usuário automaticamente após signup
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    phone,
    subscription_started_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.raw_user_meta_data->>'phone',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa após criar usuário no auth
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FUNÇÃO: Verificar se assinatura está válida
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_subscription_valid(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT 
    subscription_status,
    subscription_ends_at,
    trial_ends_at
  INTO user_record
  FROM public.users
  WHERE id = user_id;
  
  -- Se não encontrou usuário, retorna false
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Verifica se está em trial válido
  IF user_record.subscription_status = 'trial' THEN
    RETURN user_record.trial_ends_at > NOW();
  END IF;
  
  -- Verifica se assinatura está ativa
  IF user_record.subscription_status = 'active' THEN
    RETURN user_record.subscription_ends_at IS NULL 
           OR user_record.subscription_ends_at > NOW();
  END IF;
  
  -- Permite grace period para past_due (3 dias)
  IF user_record.subscription_status = 'past_due' THEN
    RETURN user_record.subscription_ends_at > (NOW() - INTERVAL '3 days');
  END IF;
  
  -- Outros status: cancelado, suspenso = false
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO: Atualizar status de assinatura expirada
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_expired_subscriptions()
RETURNS void AS $$
BEGIN
  -- Atualizar trials expirados
  UPDATE public.users
  SET subscription_status = 'suspended'
  WHERE subscription_status = 'trial'
    AND trial_ends_at < NOW();
  
  -- Atualizar assinaturas expiradas
  UPDATE public.users
  SET subscription_status = 'past_due'
  WHERE subscription_status = 'active'
    AND subscription_ends_at < NOW();
  
  -- Suspender assinaturas com mais de 3 dias de atraso
  UPDATE public.users
  SET subscription_status = 'suspended'
  WHERE subscription_status = 'past_due'
    AND subscription_ends_at < (NOW() - INTERVAL '3 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política: Usuário pode ver apenas seus próprios dados
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Política: Usuário pode atualizar apenas seus próprios dados
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política: Apenas sistema pode inserir (via trigger)
CREATE POLICY "System can insert users"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.users IS 'Tabela principal de usuários do SaaS com informações de assinatura e pagamento';
COMMENT ON COLUMN public.users.subscription_status IS 'Status atual da assinatura do usuário';
COMMENT ON COLUMN public.users.trial_ends_at IS 'Data de término do período de trial (14 dias por padrão)';
COMMENT ON FUNCTION public.is_subscription_valid IS 'Verifica se o usuário tem acesso válido ao sistema';
