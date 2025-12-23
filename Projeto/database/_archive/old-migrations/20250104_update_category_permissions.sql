-- ==============================================================================
-- MIGRATION: 20250104_update_category_permissions.sql
-- PURPOSE: Update category permissions and defaults.
--          1. Add is_premium column to categories.
--          2. Set "Compras", "Educação", "Saude" as premium-only.
--          3. Ensure "Pagamento de fatura" and "Transferencia" are locked (is_system=true).
--          4. Update setup_new_user_defaults to respect these rules.
-- ==============================================================================

-- 1. ADD COLUMN is_premium if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'is_premium') THEN
        ALTER TABLE public.categories ADD COLUMN is_premium BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. UPDATE FUNCTION: setup_new_user_defaults
CREATE OR REPLACE FUNCTION public.setup_new_user_defaults(target_user_id UUID)
RETURNS void AS $$
DECLARE
  cat_id UUID;
BEGIN
  -- Salário (Free)
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Salário') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system, is_premium)
    VALUES (target_user_id, 'Salário', 'receita', 'wallet', '#22c55e', true, false)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Mensal', true), (target_user_id, cat_id, '13º Salário', true), (target_user_id, cat_id, 'Outros', true);
  END IF;

  -- Transferência (Receita) - SYSTEM LOCKED (Not Editable)
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Transferência' AND type = 'receita') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system, is_premium)
    VALUES (target_user_id, 'Transferência', 'receita', 'arrow-right-left', '#3b82f6', true, false)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Recebida', true), (target_user_id, cat_id, 'Outros', true);
  END IF;

  -- Transferência (Despesa) - SYSTEM LOCKED (Not Editable)
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Transferência' AND type = 'despesa') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system, is_premium)
    VALUES (target_user_id, 'Transferência', 'despesa', 'arrow-right-left', '#3b82f6', true, false)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Enviada', true), (target_user_id, cat_id, 'Outros', true);
  END IF;
  
  -- Pagamento de Fatura - SYSTEM LOCKED (Not Editable)
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Pagamento de Fatura') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system, is_premium)
    VALUES (target_user_id, 'Pagamento de Fatura', 'despesa', 'credit-card', '#8b5cf6', true, false);
  END IF;

  -- Alimentação (Free)
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Alimentação') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system, is_premium)
    VALUES (target_user_id, 'Alimentação', 'despesa', 'utensils', '#f43f5e', true, false)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Supermercado', true), (target_user_id, cat_id, 'Restaurante', true), (target_user_id, cat_id, 'Delivery', true);
  END IF;

  -- Moradia (Free)
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Moradia') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system, is_premium)
    VALUES (target_user_id, 'Moradia', 'despesa', 'home', '#f97316', true, false)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Aluguel/Condomínio', true), (target_user_id, cat_id, 'Energia', true), (target_user_id, cat_id, 'Internet', true), (target_user_id, cat_id, 'Água', true), (target_user_id, cat_id, 'Gás', true);
  END IF;

  -- Transporte (Free)
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Transporte') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system, is_premium)
    VALUES (target_user_id, 'Transporte', 'despesa', 'car', '#eab308', true, false)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Combustível', true), (target_user_id, cat_id, 'Uber/App', true), (target_user_id, cat_id, 'Manutenção', true), (target_user_id, cat_id, 'Transporte Público', true);
  END IF;

  -- Saúde (PREMIUM)
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Saúde') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system, is_premium)
    VALUES (target_user_id, 'Saúde', 'despesa', 'heart-pulse', '#ef4444', true, true)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Farmácia', true), (target_user_id, cat_id, 'Consultas', true), (target_user_id, cat_id, 'Plano de Saúde', true);
  END IF;

  -- Educação (PREMIUM)
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Educação') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system, is_premium)
    VALUES (target_user_id, 'Educação', 'despesa', 'book-open', '#3b82f6', true, true)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Cursos', true), (target_user_id, cat_id, 'Livros', true), (target_user_id, cat_id, 'Mensalidade', true);
  END IF;

  -- Lazer (Free)
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Lazer') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system, is_premium)
    VALUES (target_user_id, 'Lazer', 'despesa', 'gamepad-2', '#8b5cf6', true, false)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Streaming', true), (target_user_id, cat_id, 'Viagens', true), (target_user_id, cat_id, 'Restaurante/Bar', true);
  END IF;

  -- Compras (PREMIUM)
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Compras') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system, is_premium)
    VALUES (target_user_id, 'Compras', 'despesa', 'shopping-bag', '#ec4899', true, true)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Roupas', true), (target_user_id, cat_id, 'Eletrônicos', true), (target_user_id, cat_id, 'Casa', true);
  END IF;
  
  -- Investimentos (Receita) - Free
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Investimentos') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system, is_premium)
    VALUES (target_user_id, 'Investimentos', 'receita', 'line-chart', '#0d9488', true, false)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Dividendos', true), (target_user_id, cat_id, 'Renda Fixa', true), (target_user_id, cat_id, 'Outros', true);
  END IF;

  -- Renda Extra (Receita) - Free
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = target_user_id AND name = 'Renda Extra') THEN
    INSERT INTO public.categories (user_id, name, type, icon, color, is_system, is_premium)
    VALUES (target_user_id, 'Renda Extra', 'receita', 'trending-up', '#10b981', true, false)
    RETURNING id INTO cat_id;
    INSERT INTO public.subcategories (user_id, category_id, name, is_system)
    VALUES (target_user_id, cat_id, 'Freelance', true), (target_user_id, cat_id, 'Serviços', true), (target_user_id, cat_id, 'Outros', true);
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. BACKFILL EXISTING DATA
-- Update existing categories to match new rules
UPDATE public.categories SET is_premium = true WHERE name IN ('Saúde', 'Educação', 'Compras');
UPDATE public.categories SET is_premium = false WHERE name NOT IN ('Saúde', 'Educação', 'Compras');

-- Ensure all are system categories (so they can be locked for Free users)
UPDATE public.categories SET is_system = true; 

-- Ensure Pagamento de Fatura and Transferência are definitely system and not premium (everyone needs them)
UPDATE public.categories SET is_system = true, is_premium = false WHERE name IN ('Pagamento de Fatura', 'Transferência');

