-- ============================================
-- FINCORE - INITIAL SCHEMA (CONSOLIDATED)
-- ============================================
-- Data: 04/01/2026
-- Versão: 1.0
-- Descrição: Schema consolidado com todas as tabelas e estruturas
-- 
-- IMPORTANTE: Este arquivo substitui as 120 migrations anteriores
-- Para fresh install, execute APENAS este arquivo
-- 
-- Estrutura:
-- 1. Extensions
-- 2. Enums e Types
-- 3. Tables (Users, Accounts, Transactions, etc)
-- 4. Functions e Triggers
-- 5. RLS Policies
-- ============================================

-- ============================================
-- 1. EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. ENUMS E TYPES
-- ============================================

-- Subscription types
CREATE TYPE subscription_status AS ENUM ('free', 'trial', 'active', 'past_due', 'canceled', 'suspended');
CREATE TYPE subscription_plan_type_v2 AS ENUM ('free', 'basic', 'premium', 'premium_ia', 'enterprise');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');

-- Transaction types
CREATE TYPE tipo_transacao AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE tipo_categoria AS ENUM ('receita', 'despesa', 'transferencia');

-- Investment types
CREATE TYPE investment_type AS ENUM ('stock', 'fii', 'etf', 'crypto', 'fixed_income', 'other');

-- ============================================
-- 3. TABLES
-- ============================================

-- ============================================
-- 3.1 USERS & AUTHENTICATION
-- ============================================

CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    phone text,
    email text NOT NULL,
    subscription_plan subscription_plan_type_v2 NOT NULL DEFAULT 'free',
    subscription_status subscription_status NOT NULL DEFAULT 'free',
    subscription_started_at timestamptz,
    subscription_ends_at timestamptz,
    trial_ends_at timestamptz DEFAULT (now() + INTERVAL '14 days'),
    last_payment_date timestamptz,
    next_billing_date timestamptz,
    payment_method text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    is_active boolean NOT NULL DEFAULT true,
    email_verified boolean NOT NULL DEFAULT false,
    onboarding_completed boolean NOT NULL DEFAULT false,
    stripe_customer_id text,
    stripe_subscription_id text,
    primary_credit_card_id uuid,
    primary_card_locked boolean DEFAULT false,
    base_plan subscription_plan_type_v2 DEFAULT 'free',
    is_temp_access boolean DEFAULT false,
    temp_access_expires_at timestamptz,
    temp_access_origin varchar(255),
    used_promo_code varchar(255),
    subscription_start_date timestamptz,
    subscription_due_date timestamptz,
    subscription_end_date timestamptz,
    billing_cycle varchar(50) DEFAULT 'monthly',
    avatar_url text
);

-- Promo codes
CREATE TABLE public.promo_codes (
    code varchar(50) PRIMARY KEY,
    plan_type varchar(50) NOT NULL,
    duration_days integer NOT NULL,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- 3.2 CATEGORIES & SUBCATEGORIES
-- ============================================

CREATE TABLE public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    type tipo_categoria NOT NULL,
    icon text DEFAULT 'tag',
    color text DEFAULT '#94a3b8',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    is_system boolean NOT NULL DEFAULT false,
    is_active boolean DEFAULT true
);

CREATE TABLE public.subcategories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    is_system boolean NOT NULL DEFAULT false,
    is_active boolean DEFAULT true
);

-- ============================================
-- 3.3 PAYMENT METHODS
-- ============================================

CREATE TABLE public.payment_methods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name text NOT NULL,
    slug text NOT NULL,
    type text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    allows_income boolean DEFAULT true,
    allows_expense boolean DEFAULT true,
    allows_transfer boolean NOT NULL DEFAULT false,
    affects_balance boolean NOT NULL DEFAULT true,
    affects_credit_card boolean NOT NULL DEFAULT false,
    affects_invoice boolean NOT NULL DEFAULT false,
    is_internal boolean NOT NULL DEFAULT false,
    icon varchar(50),
    sort_order integer DEFAULT 0,
    requires_bank_account boolean DEFAULT true
);

-- ============================================
-- 3.4 PARENT ACCOUNTS & POCKETS (Multi-Account System)
-- ============================================
-- ✅ SISTEMA ATUAL - Use este para novos desenvolvimentos!
-- 
-- Arquitetura:
-- - parent_accounts = Instituições financeiras (Banco, Corretora, etc)
-- - pockets = Subcontas dentro de uma instituição
-- 
-- Exemplo:
-- Parent Account: "Nubank"
--   ├─ Pocket: "Conta Corrente"
--   ├─ Pocket: "Reserva de Emergência"
--   └─ Pocket: "Investimentos"
-- 
-- Benefícios:
-- - Organização por instituição
-- - Múltiplas subcontas por instituição
-- - Saldo consolidado por instituição
-- - Rendimento CDI por pocket
-- 
-- IMPORTANTE: Novos desenvolvimentos devem usar pockets, não accounts
-- ============================================

CREATE TABLE public.parent_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    institution text,
    type text NOT NULL DEFAULT 'bank',
    color text DEFAULT '#3b82f6',
    icon text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.pockets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_account_id uuid NOT NULL REFERENCES public.parent_accounts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL DEFAULT 'operational',
    balance numeric(15,2) NOT NULL DEFAULT 0,
    color text DEFAULT '#3b82f6',
    icon text,
    is_active boolean DEFAULT true,
    yield_enabled boolean DEFAULT false,
    yield_rate double precision DEFAULT 0,
    last_yield_date date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 3.5 TRANSACTIONS
-- ============================================
-- NOTA: Transactions agora usam pocket_id ao invés de account_id
-- O sistema migrou de accounts para parent_accounts + pockets
-- ============================================

CREATE TABLE public.transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pocket_id uuid REFERENCES public.pockets(id) ON DELETE SET NULL,
    destination_pocket_id uuid REFERENCES public.pockets(id) ON DELETE SET NULL,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    subcategory_id uuid REFERENCES public.subcategories(id) ON DELETE SET NULL,
    description text NOT NULL,
    amount numeric(15,2) NOT NULL,
    type tipo_transacao NOT NULL,
    date date NOT NULL DEFAULT CURRENT_DATE,
    is_paid boolean DEFAULT true,
    notes text,
    attachment_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    credit_card_id uuid,
    installment_number integer,
    total_installments integer,
    credit_card_invoice_id uuid,
    payable_id uuid,
    related_transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
    is_historical boolean DEFAULT false,
    is_adjustment boolean DEFAULT false,
    
    CONSTRAINT check_pocket CHECK (
        pocket_id IS NOT NULL OR 
        destination_pocket_id IS NOT NULL
    )
);

-- ============================================
-- 3.7 BALANCE ADJUSTMENTS
-- ============================================

CREATE TABLE public.pocket_balance_adjustments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pocket_id uuid NOT NULL REFERENCES public.pockets(id) ON DELETE CASCADE,
    adjustment_date date NOT NULL,
    balance numeric(15,2) NOT NULL,
    type text NOT NULL,
    notes text,
    starts_controlled_period boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
);

-- ============================================
-- 3.8 LIQUIDITY YIELDS (CDI)
-- ============================================

CREATE TABLE public.liquidity_yields (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pocket_id uuid NOT NULL REFERENCES public.pockets(id) ON DELETE CASCADE,
    date date NOT NULL,
    base_amount numeric(15,2) NOT NULL,
    yield_amount numeric(15,2) NOT NULL,
    rate_applied double precision NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- 3.9 CREDIT CARDS & INVOICES
-- ============================================

CREATE TABLE public.credit_cards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    brand text NOT NULL DEFAULT 'other',
    last_4_digits text,
    limit_amount numeric(15,2) NOT NULL DEFAULT 0,
    closing_day integer NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
    due_day integer NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    color text DEFAULT '#0f172a',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    pocket_id uuid REFERENCES public.pockets(id) ON DELETE SET NULL -- Migrado de account_id para pocket_id
);

CREATE TABLE public.credit_card_invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    credit_card_id uuid NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
    reference_month integer NOT NULL,
    reference_year integer NOT NULL,
    closing_date date NOT NULL,
    due_date date NOT NULL,
    total_amount numeric(15,2) NOT NULL DEFAULT 0,
    paid_amount numeric(15,2) NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'open',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.credit_card_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    credit_card_id uuid NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
    invoice_id uuid REFERENCES public.credit_card_invoices(id) ON DELETE SET NULL,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    description text NOT NULL,
    amount numeric(15,2) NOT NULL,
    transaction_date date NOT NULL,
    is_installment boolean DEFAULT false,
    installment_number integer,
    total_installments integer,
    parent_transaction_id uuid REFERENCES public.credit_card_transactions(id) ON DELETE CASCADE,
    transaction_type text NOT NULL DEFAULT 'purchase',
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    subcategory_id uuid REFERENCES public.subcategories(id) ON DELETE SET NULL,
    group_id uuid
);

-- ============================================
-- 3.10 PAYABLES (Contas a Pagar)
-- ============================================

CREATE TABLE public.payables (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    description text NOT NULL,
    amount numeric(15,2) NOT NULL,
    due_date date NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    paid_at timestamptz,
    transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    subcategory_id uuid REFERENCES public.subcategories(id) ON DELETE SET NULL,
    recurrence_strategy text DEFAULT 'single',
    installment_number integer,
    total_installments integer,
    parent_id uuid REFERENCES public.payables(id) ON DELETE CASCADE,
    barcode text,
    beneficiary text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL
);

-- ============================================
-- 3.11 INVESTMENTS
-- ============================================

CREATE TABLE public.investments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pocket_id uuid NOT NULL REFERENCES public.pockets(id) ON DELETE CASCADE, -- Migrado de account_id para pocket_id
    ticker varchar(20) NOT NULL,
    name varchar(255) NOT NULL,
    type investment_type NOT NULL,
    quantity numeric(15,6) NOT NULL DEFAULT 0,
    average_price numeric(15,2) NOT NULL DEFAULT 0,
    current_price numeric(15,2) NOT NULL DEFAULT 0,
    updated_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.investment_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    investment_id uuid NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
    type tipo_transacao NOT NULL,
    date date NOT NULL,
    quantity numeric(15,6) NOT NULL,
    price numeric(15,2) NOT NULL,
    total_amount numeric(15,2) NOT NULL,
    fees numeric(15,2) DEFAULT 0,
    notes text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.asset_prices (
    ticker varchar(20) NOT NULL,
    date date NOT NULL,
    close_price numeric(15,2) NOT NULL,
    PRIMARY KEY (ticker, date)
);

-- ============================================
-- 4. FUNCTIONS & TRIGGERS
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create default categories for new users
CREATE OR REPLACE FUNCTION public.create_default_categories_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_active)
    VALUES
        (NEW.id, 'Transferência', 'despesa', 'arrow-right-left', '#3b82f6', true),
        (NEW.id, 'Transferência', 'receita', 'arrow-right-left', '#3b82f6', true)
    ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create default payment methods for new users
CREATE OR REPLACE FUNCTION public.create_default_payment_methods(p_user_id uuid)
RETURNS void AS $$
DECLARE
    user_slug_suffix TEXT;
BEGIN
    user_slug_suffix := SUBSTRING(p_user_id::TEXT, 1, 8);
    
    -- PIX
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'PIX') THEN
        INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'PIX', 'pix-' || user_slug_suffix, 'PIX', true, true, true, true, false, false, false, '⚡', 1, true);
    END IF;
    
    -- Dinheiro
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'CASH') THEN
        INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'Dinheiro', 'dinheiro-' || user_slug_suffix, 'CASH', true, true, false, true, false, false, false, '💵', 2, true);
    END IF;
    
    -- Cartão de Crédito
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'CREDIT_CARD') THEN
        INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'Cartão de Crédito', 'cartao-credito-' || user_slug_suffix, 'CREDIT_CARD', false, true, false, false, true, true, false, '💳', 3, true);
    END IF;
    
    -- Cartão de Débito
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'DEBIT_CARD') THEN
        INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'Cartão de Débito', 'cartao-debito-' || user_slug_suffix, 'DEBIT_CARD', false, true, false, true, false, false, false, '💳', 4, true);
    END IF;
    
    -- Transferência Bancária
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'BANK_TRANSFER') THEN
        INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'Transferência Bancária', 'transferencia-bancaria-' || user_slug_suffix, 'BANK_TRANSFER', true, true, true, true, false, false, false, '🏦', 5, true);
    END IF;
    
    -- Boleto
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'BOLETO') THEN
        INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'Boleto', 'boleto-' || user_slug_suffix, 'BOLETO', true, true, false, true, false, false, false, '📄', 6, true);
    END IF;
    
    -- Débito Automático
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'AUTOMATIC') THEN
        INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'Débito Automático', 'debito-automatico-' || user_slug_suffix, 'AUTOMATIC', false, true, false, true, false, false, false, '🔄', 7, true);
    END IF;
    
    -- Transferência Interna
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'INTERNAL_TRANSFER') THEN
        INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'Transferência Interna', 'transferencia-interna-' || user_slug_suffix, 'INTERNAL_TRANSFER', false, false, true, false, false, false, true, '🔄', 8, true);
    END IF;
    
    -- Outro
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = p_user_id AND type = 'OTHER') THEN
        INSERT INTO payment_methods (user_id, name, slug, type, allows_income, allows_expense, allows_transfer, affects_balance, affects_credit_card, affects_invoice, is_internal, icon, sort_order, is_active)
        VALUES (p_user_id, 'Outro', 'outro-' || user_slug_suffix, 'OTHER', true, true, false, true, false, false, false, '📝', 99, true);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Auto create payment methods trigger
CREATE OR REPLACE FUNCTION public.auto_create_payment_methods()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_default_payment_methods(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Invoice management functions
CREATE OR REPLACE FUNCTION public.get_or_create_invoice(p_user_id uuid, p_card_id uuid, p_transaction_date date)
RETURNS uuid AS $$
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
    SELECT closing_day, due_day
    INTO v_closing_day, v_due_day
    FROM credit_cards
    WHERE id = p_card_id;

    v_transaction_day := EXTRACT(DAY FROM p_transaction_date);

    IF v_transaction_day < v_closing_day THEN
        v_ref_month := EXTRACT(MONTH FROM p_transaction_date);
        v_ref_year  := EXTRACT(YEAR  FROM p_transaction_date);
    ELSE
        v_ref_month := EXTRACT(MONTH FROM (p_transaction_date + INTERVAL '1 month'));
        v_ref_year  := EXTRACT(YEAR  FROM (p_transaction_date + INTERVAL '1 month'));
    END IF;

    SELECT id
    INTO v_invoice_id
    FROM credit_card_invoices
    WHERE credit_card_id = p_card_id
      AND reference_month = v_ref_month
      AND reference_year  = v_ref_year;

    IF v_invoice_id IS NULL THEN
        v_closing_date := make_date(v_ref_year, v_ref_month, 1) + (v_closing_day - 1) * INTERVAL '1 day';

        IF v_due_day < v_closing_day THEN
            v_due_date := (make_date(v_ref_year, v_ref_month, 1) + INTERVAL '1 month') + (v_due_day - 1) * INTERVAL '1 day';
        ELSE
            v_due_date := make_date(v_ref_year, v_ref_month, 1) + (v_due_day - 1) * INTERVAL '1 day';
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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_invoice_total()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE public.credit_card_invoices
        SET total_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.credit_card_transactions
            WHERE invoice_id = OLD.invoice_id
        )
        WHERE id = OLD.invoice_id;
        RETURN OLD;
    ELSE
        UPDATE public.credit_card_invoices
        SET total_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.credit_card_transactions
            WHERE invoice_id = NEW.invoice_id
        )
        WHERE id = NEW.invoice_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.pay_invoice(p_invoice_id uuid, p_amount numeric)
RETURNS void AS $$
DECLARE
    v_invoice RECORD;
    v_new_paid_amount NUMERIC;
    v_excess NUMERIC;
    v_next_invoice_id UUID;
    v_status TEXT;
BEGIN
    SELECT * INTO v_invoice FROM public.credit_card_invoices WHERE id = p_invoice_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found';
    END IF;

    v_new_paid_amount := v_invoice.paid_amount + p_amount;
    
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

    UPDATE public.credit_card_invoices 
    SET paid_amount = v_new_paid_amount,
        status = v_status,
        updated_at = NOW()
    WHERE id = p_invoice_id;

    IF v_excess > 0 THEN
        SELECT id INTO v_next_invoice_id
        FROM public.credit_card_invoices
        WHERE credit_card_id = v_invoice.credit_card_id
          AND (reference_year > v_invoice.reference_year 
               OR (reference_year = v_invoice.reference_year AND reference_month > v_invoice.reference_month))
        ORDER BY reference_year ASC, reference_month ASC
        LIMIT 1;

        IF v_next_invoice_id IS NOT NULL THEN
            PERFORM public.pay_invoice(v_next_invoice_id, v_excess);
        ELSE
            UPDATE public.credit_card_invoices 
            SET paid_amount = paid_amount + v_excess
            WHERE id = p_invoice_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function removida: calculate_account_balance_with_adjustments
-- Motivo: Usava account_id que não existe mais
-- Sistema atual: Use pockets e seus balances diretos
-- Os balances são calculados via transactions.pocket_id e liquidity_yields.pocket_id

-- ============================================
-- 5. TRIGGERS
-- ============================================

-- Updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
-- Trigger removido: accounts não existe mais
-- CREATE TRIGGER set_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_subcategories_updated_at BEFORE UPDATE ON public.subcategories FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Auth triggers
CREATE TRIGGER on_auth_user_created_categories AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION create_default_categories_for_user();
CREATE TRIGGER trigger_auto_create_payment_methods AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION auto_create_payment_methods();

-- Invoice triggers
CREATE TRIGGER trigger_update_invoice_total AFTER INSERT OR UPDATE OR DELETE ON public.credit_card_transactions FOR EACH ROW EXECUTE FUNCTION update_invoice_total();

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pockets ENABLE ROW LEVEL SECURITY;
-- RLS removido: accounts não existe mais
-- ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pocket_balance_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidity_yields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "System can insert users" ON public.users FOR INSERT WITH CHECK (true);

-- Categories policies
CREATE POLICY "Users can view own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Subcategories policies
CREATE POLICY "Users can view own subcategories" ON public.subcategories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subcategories" ON public.subcategories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subcategories" ON public.subcategories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subcategories" ON public.subcategories FOR DELETE USING (auth.uid() = user_id);

-- Payment methods policies
CREATE POLICY "Users can read system and own payment methods" ON public.payment_methods FOR SELECT USING ((user_id IS NULL) OR (user_id = auth.uid()));
CREATE POLICY "Users can insert their own payment methods" ON public.payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own payment methods" ON public.payment_methods FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own payment methods" ON public.payment_methods FOR DELETE USING (auth.uid() = user_id);

-- Parent accounts policies
CREATE POLICY "Users can view own parent accounts" ON public.parent_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own parent accounts" ON public.parent_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own parent accounts" ON public.parent_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own parent accounts" ON public.parent_accounts FOR DELETE USING (auth.uid() = user_id);

-- Pockets policies
CREATE POLICY "Users can view own pockets" ON public.pockets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pockets" ON public.pockets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pockets" ON public.pockets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pockets" ON public.pockets FOR DELETE USING (auth.uid() = user_id);

-- Accounts policies removidas: tabela accounts não existe mais
-- Sistema atual usa parent_accounts + pockets

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Pocket balance adjustments policies
CREATE POLICY "Users can view their own pocket adjustments" ON public.pocket_balance_adjustments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pocket adjustments" ON public.pocket_balance_adjustments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pocket adjustments" ON public.pocket_balance_adjustments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pocket adjustments" ON public.pocket_balance_adjustments FOR DELETE USING (auth.uid() = user_id);

-- Credit cards policies
CREATE POLICY "Users can manage own cards" ON public.credit_cards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Credit card invoices policies
CREATE POLICY "Users can view own invoices" ON public.credit_card_invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices" ON public.credit_card_invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON public.credit_card_invoices FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON public.credit_card_invoices FOR DELETE USING (auth.uid() = user_id);

-- Credit card transactions policies
CREATE POLICY "Users can view own cc transactions" ON public.credit_card_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cc transactions" ON public.credit_card_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cc transactions" ON public.credit_card_transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own cc transactions" ON public.credit_card_transactions FOR DELETE USING (auth.uid() = user_id);

-- Payables policies
CREATE POLICY "Users can view own payables" ON public.payables FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payables" ON public.payables FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payables" ON public.payables FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payables" ON public.payables FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 7. INDEXES (Performance)
-- ============================================

CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
-- Índice removido: account_id não é mais usado
-- CREATE INDEX idx_transactions_account ON transactions(account_id) WHERE is_historical = false;
CREATE INDEX idx_transactions_pocket ON transactions(pocket_id) WHERE is_historical = false;
-- Índice removido: tabela accounts não existe mais
-- CREATE INDEX idx_accounts_user ON accounts(user_id) WHERE is_active = true;
CREATE INDEX idx_pockets_user ON pockets(user_id) WHERE is_active = true;
CREATE INDEX idx_pockets_parent ON pockets(parent_account_id) WHERE is_active = true;
CREATE INDEX idx_categories_user ON categories(user_id) WHERE is_active = true;
CREATE INDEX idx_subcategories_category ON subcategories(category_id);
CREATE INDEX idx_credit_card_transactions_invoice ON credit_card_transactions(invoice_id);
CREATE INDEX idx_credit_card_invoices_card ON credit_card_invoices(credit_card_id);
-- Índice removido: account_id não é mais usado
-- CREATE INDEX idx_liquidity_yields_account ON liquidity_yields(account_id);
CREATE INDEX idx_liquidity_yields_pocket ON liquidity_yields(pocket_id);
CREATE INDEX idx_pocket_adjustments_pocket ON pocket_balance_adjustments(pocket_id);

-- ============================================
-- FIM DO SCHEMA CONSOLIDADO
-- ============================================

-- Para verificar a instalação:
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Deve retornar aproximadamente 20-25 tabelas
