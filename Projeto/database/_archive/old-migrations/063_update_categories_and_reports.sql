-- =====================================================
-- MIGRATION: 063
-- 1. Adiciona coluna exclude_from_reports na tabela transactions
-- 2. Atualiza RPC de setup para incluir categorias de Transferência
-- 3. Insere categorias de Transferência para usuários existentes
-- =====================================================

-- 1. Adicionar coluna exclude_from_reports
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS exclude_from_totals BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.transactions.exclude_from_totals IS 'Se true, não contabiliza em relatórios de Receita/Despesa (ex: transferências, ajustes)';

-- 2. Atualizar RPC setup_new_user_defaults
CREATE OR REPLACE FUNCTION public.setup_new_user_defaults(target_user_id UUID)
RETURNS void AS $$
DECLARE
  cat_id UUID;
BEGIN
  -- ================= RECEITAS =================

  -- Salário
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Salário') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
    VALUES (target_user_id, 'Salário', 'receita', 'wallet', '#22c55e', true)
    RETURNING id INTO cat_id;

    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Mensal', true), (target_user_id, cat_id, '13º Salário', true), (target_user_id, cat_id, 'Outros', true);
  END IF;

  -- Investimentos
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Investimentos') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
    VALUES (target_user_id, 'Investimentos', 'receita', 'line-chart', '#0d9488', true)
    RETURNING id INTO cat_id;

    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Dividendos', true), (target_user_id, cat_id, 'Renda Fixa', true), (target_user_id, cat_id, 'Outros', true);
  END IF;

  -- Transferência (Receita)
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Transferência' AND type = 'receita') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
    VALUES (target_user_id, 'Transferência', 'receita', 'arrow-right-left', '#3b82f6', true)
    RETURNING id INTO cat_id;

    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Recebida', true), (target_user_id, cat_id, 'Outros', true);
  END IF;

  -- ================= DESPESAS =================

  -- Pagamento de Fatura
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Pagamento de Fatura') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
    VALUES (target_user_id, 'Pagamento de Fatura', 'despesa', 'credit-card', '#8b5cf6', true);
  END IF;

  -- Transferência (Despesa)
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Transferência' AND type = 'despesa') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
    VALUES (target_user_id, 'Transferência', 'despesa', 'arrow-right-left', '#3b82f6', true)
    RETURNING id INTO cat_id;

    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Enviada', true), (target_user_id, cat_id, 'Outros', true);
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
    VALUES (target_user_id, cat_id, 'Aluguel/Condomínio', true), (target_user_id, cat_id, 'Energia', true), (target_user_id, cat_id, 'Internet', true);
  END IF;

  -- Transporte
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Transporte') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
    VALUES (target_user_id, 'Transporte', 'despesa', 'car', '#eab308', true)
    RETURNING id INTO cat_id;

    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Combustível', true), (target_user_id, cat_id, 'Uber/App', true), (target_user_id, cat_id, 'Manutenção', true);
  END IF;

  -- Lazer
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Lazer') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
    VALUES (target_user_id, 'Lazer', 'despesa', 'gamepad-2', '#8b5cf6', true)
    RETURNING id INTO cat_id;

    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Streaming', true), (target_user_id, cat_id, 'Viagens', true), (target_user_id, cat_id, 'Restaurante/Bar', true);
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Inserir para usuários existentes (Fix para quem já cadastrou)
DO $$
DECLARE
  u RECORD;
  cat_id UUID;
BEGIN
  FOR u IN SELECT id FROM public.users LOOP
    -- Transferência (Receita)
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = u.id AND name = 'Transferência' AND type = 'receita') THEN
      INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
      VALUES (u.id, 'Transferência', 'receita', 'arrow-right-left', '#3b82f6', true)
      RETURNING id INTO cat_id;
      
      INSERT INTO public.subcategories (user_id, category_id, name, is_system)
      VALUES (u.id, cat_id, 'Recebida', true), (u.id, cat_id, 'Outros', true);
    END IF;

    -- Transferência (Despesa)
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = u.id AND name = 'Transferência' AND type = 'despesa') THEN
      INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
      VALUES (u.id, 'Transferência', 'despesa', 'arrow-right-left', '#3b82f6', true)
      RETURNING id INTO cat_id;
      
      INSERT INTO public.subcategories (user_id, category_id, name, is_system)
      VALUES (u.id, cat_id, 'Enviada', true), (u.id, cat_id, 'Outros', true);
    END IF;
  END LOOP;
END;
$$;
