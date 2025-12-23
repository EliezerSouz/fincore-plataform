-- ==============================================================================
-- MIGRATION: 20250103_add_category_trigger.sql
-- PURPOSE: Fix missing default categories for new users by adding a trigger
--          that calls setup_new_user_defaults on user creation.
-- ==============================================================================

-- 1. CLEANUP: Remove old conflicting triggers/functions if they exist
--    This prevents double execution or errors from legacy migrations.
DROP TRIGGER IF EXISTS on_user_created_add_categories ON public.users;
DROP TRIGGER IF EXISTS on_user_created_setup_defaults ON public.users;

-- 2. FUNCTION: Ensure the setup function is up to date
--    (Copied from 20250101_full_schema.sql to guarantee consistency)
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

-- 3. PERMISSIONS: Grant execution permissions
GRANT EXECUTE ON FUNCTION public.setup_new_user_defaults(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.setup_new_user_defaults(UUID) TO service_role;

-- 4. TRIGGER FUNCTION: Wrapper to call setup_new_user_defaults from trigger
CREATE OR REPLACE FUNCTION public.trigger_setup_new_user_defaults()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.setup_new_user_defaults(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TRIGGER: Execute on new user creation
CREATE TRIGGER on_user_created_setup_defaults
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.trigger_setup_new_user_defaults();

-- 6. BACKFILL: Ensure existing users have default categories
--    This fixes the issue for users created before this trigger was added.
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN SELECT id FROM public.users LOOP
    PERFORM public.setup_new_user_defaults(u.id);
  END LOOP;
END;
$$;
