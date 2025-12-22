-- ==============================================================================
-- FULL SCHEMA RESET (CONSOLIDATED)
-- Date: 2025-01-01
-- Description: Consolidated schema including all migrations from 001 to 064 + Missing Tables.
-- Usage: Run this script on a fresh database to set up the complete environment.
-- ==============================================================================

-- 1. SETUP & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & TYPES
DROP TYPE IF EXISTS public.tipo_transacao CASCADE;
CREATE TYPE public.tipo_transacao AS ENUM ('receita', 'despesa', 'transferencia');

DROP TYPE IF EXISTS public.investment_type CASCADE;
CREATE TYPE public.investment_type AS ENUM ('acao', 'fii', 'renda_fixa', 'cripto', 'fundo', 'tesouro', 'outros');

DROP TYPE IF EXISTS public.subscription_plan_type_v2 CASCADE;
CREATE TYPE public.subscription_plan_type_v2 AS ENUM ('free', 'basic', 'premium', 'premium_ia', 'enterprise', 'trial');

DROP TYPE IF EXISTS public.subscription_status CASCADE;
CREATE TYPE public.subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trial', 'free');

DROP TYPE IF EXISTS public.account_type CASCADE;
CREATE TYPE public.account_type AS ENUM ('corrente', 'poupanca', 'investimento', 'carteira', 'outros');

DROP TYPE IF EXISTS public.card_brand CASCADE;
CREATE TYPE public.card_brand AS ENUM ('visa', 'mastercard', 'amex', 'elo', 'hipercard', 'outros');

DROP TYPE IF EXISTS public.recurrence_period CASCADE;
CREATE TYPE public.recurrence_period AS ENUM ('diario', 'semanal', 'quinzenal', 'mensal', 'trimestral', 'semestral', 'anual');

DROP TYPE IF EXISTS public.payment_method_type CASCADE;
CREATE TYPE public.payment_method_type AS ENUM ('PIX', 'CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'BOLETO', 'AUTOMATIC', 'INTERNAL_TRANSFER', 'OTHER');

DROP TYPE IF EXISTS public.invoice_status CASCADE;
CREATE TYPE public.invoice_status AS ENUM ('open', 'closed', 'paid', 'overdue', 'partial');

DROP TYPE IF EXISTS public.payable_status CASCADE;
CREATE TYPE public.payable_status AS ENUM ('pending', 'paid', 'cancelled');

-- 3. TABLES

-- USERS
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    
    -- Subscription / Plans
    subscription_plan public.subscription_plan_type_v2 DEFAULT 'free',
    subscription_status public.subscription_status DEFAULT 'trial',
    base_plan public.subscription_plan_type_v2 DEFAULT 'free',
    billing_cycle TEXT DEFAULT 'monthly',
    
    subscription_start_date TIMESTAMPTZ DEFAULT NOW(),
    subscription_end_date TIMESTAMPTZ,
    subscription_due_date TIMESTAMPTZ,
    
    -- Promo Codes & Access
    used_promo_code TEXT,
    is_temp_access BOOLEAN DEFAULT false,
    temp_access_expires_at TIMESTAMPTZ,
    temp_access_origin TEXT,
    
    -- Primary Card (References credit_cards later)
    primary_credit_card_id UUID, 
    primary_card_locked BOOLEAN DEFAULT false,
    
    -- Stripe
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    onboarding_completed BOOLEAN DEFAULT false
);

-- ACCOUNTS
CREATE TABLE public.accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type public.account_type NOT NULL DEFAULT 'outros',
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    color TEXT DEFAULT '#3b82f6',
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    yield_rate DOUBLE PRECISION DEFAULT 0,
    last_yield_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACCOUNT BALANCE ADJUSTMENTS
CREATE TABLE public.account_balance_adjustments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    adjustment_date DATE NOT NULL,
    balance DECIMAL(15, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('initial', 'reconciliation', 'correction')),
    notes TEXT,
    starts_controlled_period BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CATEGORIES
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type public.tipo_transacao NOT NULL,
    icon TEXT DEFAULT 'tag',
    color TEXT DEFAULT '#94a3b8',
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBCATEGORIES
CREATE TABLE public.subcategories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENT METHODS
CREATE TABLE public.payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id), 
    
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    type public.payment_method_type NOT NULL,
    
    is_active BOOLEAN DEFAULT true,
    allows_income BOOLEAN DEFAULT true,
    allows_expense BOOLEAN DEFAULT true,
    allows_transfer BOOLEAN DEFAULT false,
    
    affects_balance BOOLEAN DEFAULT true,
    affects_credit_card BOOLEAN DEFAULT false,
    affects_invoice BOOLEAN DEFAULT false,
    is_internal BOOLEAN DEFAULT false,
    
    icon VARCHAR,
    sort_order INTEGER DEFAULT 0,
    requires_bank_account BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREDIT CARDS
CREATE TABLE public.credit_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    last_4_digits TEXT,
    limit_amount DECIMAL(15, 2) DEFAULT 0,
    closing_day INTEGER NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    color TEXT DEFAULT '#0f172a',
    brand public.card_brand DEFAULT 'outros',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK to users for primary card
ALTER TABLE public.users 
ADD CONSTRAINT fk_users_primary_card 
FOREIGN KEY (primary_credit_card_id) REFERENCES public.credit_cards(id) ON DELETE SET NULL;

-- CREDIT CARD INVOICES
CREATE TABLE public.credit_card_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    credit_card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
    reference_month INTEGER NOT NULL CHECK (reference_month BETWEEN 1 AND 12),
    reference_year INTEGER NOT NULL CHECK (reference_year >= 2000),
    closing_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    status public.invoice_status DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(credit_card_id, reference_month, reference_year)
);

-- PAYABLES (Contas a Pagar)
CREATE TABLE public.payables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    due_date DATE NOT NULL,
    status public.payable_status NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    transaction_id UUID,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
    payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    recurrence_strategy TEXT DEFAULT 'single' CHECK (recurrence_strategy IN ('single', 'installment', 'fixed')),
    recurrence_period public.recurrence_period,
    installment_number INTEGER,
    total_installments INTEGER,
    parent_id UUID REFERENCES public.payables(id) ON DELETE CASCADE,
    barcode TEXT,
    beneficiary TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROMO CODES
CREATE TABLE public.promo_codes (
    code VARCHAR NOT NULL PRIMARY KEY,
    plan_type VARCHAR NOT NULL,
    duration_days INTEGER NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSACTIONS
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    destination_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
    payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    
    description TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
    type public.tipo_transacao NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    is_paid BOOLEAN DEFAULT true,
    exclude_from_totals BOOLEAN DEFAULT false,
    
    credit_card_invoice_id UUID REFERENCES public.credit_card_invoices(id) ON DELETE SET NULL,
    payable_id UUID REFERENCES public.payables(id) ON DELETE SET NULL,
    related_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    
    credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL,
    
    is_installment BOOLEAN DEFAULT false,
    installment_number INTEGER,
    total_installments INTEGER,
    parent_transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    
    is_historical BOOLEAN DEFAULT false,
    is_adjustment BOOLEAN DEFAULT false,
    
    notes TEXT,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREDIT CARD TRANSACTIONS
CREATE TABLE public.credit_card_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    credit_card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.credit_card_invoices(id) ON DELETE CASCADE, 
    
    description TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
    group_id UUID,
    
    is_installment BOOLEAN DEFAULT false,
    installment_number INTEGER,
    total_installments INTEGER,
    parent_transaction_id UUID REFERENCES public.credit_card_transactions(id) ON DELETE CASCADE,
    
    transaction_type TEXT DEFAULT 'purchase' CHECK (transaction_type IN ('purchase', 'refund', 'adjustment', 'fee')),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVESTMENTS
CREATE TABLE public.investments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    ticker VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    type public.investment_type NOT NULL,
    quantity DECIMAL(15, 8) NOT NULL DEFAULT 0,
    average_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    current_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVESTMENT TRANSACTIONS
CREATE TABLE public.investment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
    type TEXT NOT NULL, 
    date DATE NOT NULL,
    quantity DECIMAL(15, 8) NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    fees DECIMAL(15, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ASSET PRICES
CREATE TABLE public.asset_prices (
    ticker VARCHAR NOT NULL,
    date DATE NOT NULL,
    close_price DECIMAL(15, 2) NOT NULL,
    PRIMARY KEY (ticker, date)
);

-- LIQUIDITY YIELDS
CREATE TABLE public.liquidity_yields (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    base_amount DECIMAL(15, 2) NOT NULL,
    yield_amount DECIMAL(15, 2) NOT NULL,
    rate_applied DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GOALS (Metas)
CREATE TABLE public.goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) DEFAULT 0,
    deadline DATE,
    color TEXT,
    icon TEXT,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BUDGETS (Orçamentos)
CREATE TABLE public.budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    period public.recurrence_period DEFAULT 'mensal',
    start_date DATE NOT NULL,
    end_date DATE,
    alert_threshold INTEGER DEFAULT 80, -- Porcentagem para alerta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TAGS
CREATE TABLE public.tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSACTION TAGS (N:N)
CREATE TABLE public.transaction_tags (
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (transaction_id, tag_id)
);

-- 4. CONSTRAINTS & FKs (Additional)
ALTER TABLE public.payables
ADD CONSTRAINT fk_payables_transaction
FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL;

-- 5. INDEXES
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date);
CREATE INDEX idx_transactions_account ON public.transactions(account_id);
CREATE INDEX idx_transactions_category ON public.transactions(category_id);
CREATE INDEX idx_invoices_card_status ON public.credit_card_invoices(credit_card_id, status);
CREATE INDEX idx_payables_due_date ON public.payables(due_date);

-- 6. FUNCTIONS & TRIGGERS

-- Timestamp Handler
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Balance Update Handler
CREATE OR REPLACE FUNCTION public.handle_balance_update()
RETURNS TRIGGER AS $$
BEGIN
    -- INSERT
    IF (TG_OP = 'INSERT') THEN
        IF NEW.is_paid = true AND NEW.account_id IS NOT NULL THEN
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
        
    -- DELETE
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.is_paid = true AND OLD.account_id IS NOT NULL THEN
            IF OLD.type = 'receita' THEN
                UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
            ELSIF OLD.type = 'despesa' THEN
                UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
            ELSIF OLD.type = 'transferencia' AND OLD.destination_account_id IS NOT NULL THEN
                UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
                UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.destination_account_id;
            END IF;
        END IF;
        RETURN OLD;
        
    -- UPDATE
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Revert OLD
        IF OLD.is_paid = true AND OLD.account_id IS NOT NULL THEN
            IF OLD.type = 'receita' THEN
                UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
            ELSIF OLD.type = 'despesa' THEN
                UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
            ELSIF OLD.type = 'transferencia' AND OLD.destination_account_id IS NOT NULL THEN
                UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
                UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.destination_account_id;
            END IF;
        END IF;
        
        -- Apply NEW
        IF NEW.is_paid = true AND NEW.account_id IS NOT NULL THEN
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

CREATE TRIGGER on_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_balance_update();

-- Setup User Defaults (RPC)
CREATE OR REPLACE FUNCTION public.setup_new_user_defaults(target_user_id UUID)
RETURNS void AS $$
DECLARE
  cat_id UUID;
BEGIN
  -- Salário
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Salário') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
    VALUES (target_user_id, 'Salário', 'receita', 'wallet', '#22c55e', true)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Mensal', true), (target_user_id, cat_id, '13º Salário', true), (target_user_id, cat_id, 'Outros', true);
  END IF;

  -- Transferência (Receita)
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Transferência' AND type = 'receita') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
    VALUES (target_user_id, 'Transferência', 'receita', 'arrow-right-left', '#3b82f6', true)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Recebida', true), (target_user_id, cat_id, 'Outros', true);
  END IF;

  -- Transferência (Despesa)
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Transferência' AND type = 'despesa') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
    VALUES (target_user_id, 'Transferência', 'despesa', 'arrow-right-left', '#3b82f6', true)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Enviada', true), (target_user_id, cat_id, 'Outros', true);
  END IF;
  
  -- Pagamento de Fatura
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Pagamento de Fatura') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
    VALUES (target_user_id, 'Pagamento de Fatura', 'despesa', 'credit-card', '#8b5cf6', true);
  END IF;

  -- Alimentação
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Alimentação') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
    VALUES (target_user_id, 'Alimentação', 'despesa', 'utensils', '#f43f5e', true)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Supermercado', true), (target_user_id, cat_id, 'Restaurante', true), (target_user_id, cat_id, 'Delivery', true);
  END IF;

  -- Moradia
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Moradia') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
    VALUES (target_user_id, 'Moradia', 'despesa', 'home', '#f97316', true)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Aluguel/Condomínio', true), (target_user_id, cat_id, 'Energia', true), (target_user_id, cat_id, 'Internet', true), (target_user_id, cat_id, 'Água', true), (target_user_id, cat_id, 'Gás', true);
  END IF;

  -- Transporte
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Transporte') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
    VALUES (target_user_id, 'Transporte', 'despesa', 'car', '#eab308', true)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Combustível', true), (target_user_id, cat_id, 'Uber/App', true), (target_user_id, cat_id, 'Manutenção', true), (target_user_id, cat_id, 'Transporte Público', true);
  END IF;

  -- Saúde
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Saúde') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
    VALUES (target_user_id, 'Saúde', 'despesa', 'heart-pulse', '#ef4444', true)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Farmácia', true), (target_user_id, cat_id, 'Consultas', true), (target_user_id, cat_id, 'Plano de Saúde', true);
  END IF;

  -- Educação
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Educação') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
    VALUES (target_user_id, 'Educação', 'despesa', 'book-open', '#3b82f6', true)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Cursos', true), (target_user_id, cat_id, 'Livros', true), (target_user_id, cat_id, 'Mensalidade', true);
  END IF;

  -- Lazer
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Lazer') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
    VALUES (target_user_id, 'Lazer', 'despesa', 'gamepad-2', '#8b5cf6', true)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Streaming', true), (target_user_id, cat_id, 'Viagens', true), (target_user_id, cat_id, 'Restaurante/Bar', true);
  END IF;

  -- Compras
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Compras') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
    VALUES (target_user_id, 'Compras', 'despesa', 'shopping-bag', '#ec4899', true)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Roupas', true), (target_user_id, cat_id, 'Eletrônicos', true), (target_user_id, cat_id, 'Casa', true);
  END IF;
  
  -- Investimentos (Receita)
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Investimentos') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
    VALUES (target_user_id, 'Investimentos', 'receita', 'line-chart', '#0d9488', true)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Dividendos', true), (target_user_id, cat_id, 'Renda Fixa', true), (target_user_id, cat_id, 'Outros', true);
  END IF;

  -- Renda Extra (Receita)
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Renda Extra') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
    VALUES (target_user_id, 'Renda Extra', 'receita', 'trending-up', '#10b981', true)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Freelance', true), (target_user_id, cat_id, 'Serviços', true), (target_user_id, cat_id, 'Outros', true);
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_balance_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidity_yields ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Accounts
CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Categories/Subcategories
CREATE POLICY "Users can view own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subcategories" ON public.subcategories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subcategories" ON public.subcategories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subcategories" ON public.subcategories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subcategories" ON public.subcategories FOR DELETE USING (auth.uid() = user_id);

-- Credit Cards
CREATE POLICY "Users can view own credit cards" ON public.credit_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credit cards" ON public.credit_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own credit cards" ON public.credit_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own credit cards" ON public.credit_cards FOR DELETE USING (auth.uid() = user_id);

-- Credit Card Invoices
CREATE POLICY "Users can view own invoices" ON public.credit_card_invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices" ON public.credit_card_invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON public.credit_card_invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON public.credit_card_invoices FOR DELETE USING (auth.uid() = user_id);

-- Credit Card Transactions
CREATE POLICY "Users can view own card transactions" ON public.credit_card_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own card transactions" ON public.credit_card_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own card transactions" ON public.credit_card_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own card transactions" ON public.credit_card_transactions FOR DELETE USING (auth.uid() = user_id);

-- Payables
CREATE POLICY "Users can view own payables" ON public.payables FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payables" ON public.payables FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payables" ON public.payables FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payables" ON public.payables FOR DELETE USING (auth.uid() = user_id);

-- Account Balance Adjustments
CREATE POLICY "Users can view own adjustments" ON public.account_balance_adjustments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own adjustments" ON public.account_balance_adjustments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own adjustments" ON public.account_balance_adjustments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own adjustments" ON public.account_balance_adjustments FOR DELETE USING (auth.uid() = user_id);

-- Investments
CREATE POLICY "Users can view own investments" ON public.investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own investments" ON public.investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own investments" ON public.investments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own investments" ON public.investments FOR DELETE USING (auth.uid() = user_id);

-- Investment Transactions
CREATE POLICY "Users can view own inv transactions" ON public.investment_transactions FOR SELECT USING (investment_id IN (SELECT id FROM public.investments WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own inv transactions" ON public.investment_transactions FOR INSERT WITH CHECK (investment_id IN (SELECT id FROM public.investments WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own inv transactions" ON public.investment_transactions FOR UPDATE USING (investment_id IN (SELECT id FROM public.investments WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own inv transactions" ON public.investment_transactions FOR DELETE USING (investment_id IN (SELECT id FROM public.investments WHERE user_id = auth.uid()));

-- Payment Methods (System + User Custom)
CREATE POLICY "Everyone can view system payment methods" ON public.payment_methods FOR SELECT USING (user_id IS NULL);
CREATE POLICY "Users can view own payment methods" ON public.payment_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own payment methods" ON public.payment_methods FOR ALL USING (auth.uid() = user_id);

-- Promo Codes (Read-only for users)
CREATE POLICY "Authenticated can view promo codes" ON public.promo_codes FOR SELECT TO authenticated USING (true);

-- Asset Prices (Read-only for users)
CREATE POLICY "Authenticated can view asset prices" ON public.asset_prices FOR SELECT TO authenticated USING (true);

-- Liquidity Yields (Linked to Account)
CREATE POLICY "Users can view own yields" ON public.liquidity_yields FOR SELECT USING (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()));

-- Goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- Budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- Tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tags" ON public.tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tags" ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tags" ON public.tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tags" ON public.tags FOR DELETE USING (auth.uid() = user_id);

-- Transaction Tags
ALTER TABLE public.transaction_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own trans tags" ON public.transaction_tags FOR SELECT USING (transaction_id IN (SELECT id FROM public.transactions WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own trans tags" ON public.transaction_tags FOR INSERT WITH CHECK (transaction_id IN (SELECT id FROM public.transactions WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own trans tags" ON public.transaction_tags FOR DELETE USING (transaction_id IN (SELECT id FROM public.transactions WHERE user_id = auth.uid()));

-- 8. SEED DATA
-- Insert Payment Methods
INSERT INTO public.payment_methods (name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, requires_bank_account) VALUES
('Dinheiro', 'dinheiro', 'CASH', true, true, false, true, false, false, false, 'cash', 1, false),
('Pix', 'pix', 'PIX', true, true, true, true, false, false, false, 'pix', 2, true),
('Cartão de Crédito', 'cartao_credito', 'CREDIT_CARD', false, true, false, false, true, true, false, 'credit-card', 3, false),
('Cartão de Débito', 'cartao_debito', 'DEBIT_CARD', false, true, false, true, false, false, false, 'credit-card', 4, true),
('Boleto', 'boleto', 'BOLETO', false, true, false, true, false, false, false, 'barcode', 5, false),
('Transferência', 'transferencia', 'BANK_TRANSFER', true, true, true, true, false, false, false, 'bank', 6, true),
('Outros', 'outros', 'OTHER', true, true, false, true, false, false, false, 'dots-horizontal', 99, false)
ON CONFLICT (slug) DO UPDATE SET 
    allows_transfer = EXCLUDED.allows_transfer,
    affects_balance = EXCLUDED.affects_balance,
    affects_credit_card = EXCLUDED.affects_credit_card,
    affects_invoice = EXCLUDED.affects_invoice,
    type = EXCLUDED.type;

-- 9. PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
