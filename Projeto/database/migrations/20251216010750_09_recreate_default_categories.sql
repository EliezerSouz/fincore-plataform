-- =====================================================
-- MIGRATION: DEFAULT CATEGORIES (FREE / DEMO USERS)
-- Seguro para produção | Sem duplicações
-- =====================================================

-- ENUM já existente: tipo_categoria ('receita', 'despesa')

-- =====================================================
-- 1. FUNÇÃO: Criar categorias padrão para um usuário
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_default_categories_free(target_user_id UUID)
RETURNS void AS $$
DECLARE
  cat_id UUID;
BEGIN
  -- ================= RECEITAS =================

  -- Salário
  IF NOT EXISTS (
    SELECT 1 FROM public.categories 
    WHERE user_id = target_user_id AND name = 'Salário'
  ) THEN
    INSERT INTO public.categories (user_id, name, type, icon, color)
    VALUES (target_user_id, 'Salário', 'receita', 'wallet', '#22c55e')
    RETURNING id INTO cat_id;

    INSERT INTO public.subcategories (user_id, category_id, name)
    VALUES
      (target_user_id, cat_id, 'Mensal'),
      (target_user_id, cat_id, '13º Salário'),
      (target_user_id, cat_id, 'Outros');
  END IF;

  -- Renda Extra
  IF NOT EXISTS (
    SELECT 1 FROM public.categories 
    WHERE user_id = target_user_id AND name = 'Renda Extra'
  ) THEN
    INSERT INTO public.categories (user_id, name, type, icon, color)
    VALUES (target_user_id, 'Renda Extra', 'receita', 'trending-up', '#16a34a')
    RETURNING id INTO cat_id;

    INSERT INTO public.subcategories (user_id, category_id, name)
    VALUES
      (target_user_id, cat_id, 'Freelance'),
      (target_user_id, cat_id, 'Bônus'),
      (target_user_id, cat_id, 'Outros');
  END IF;

  -- Investimentos
  IF NOT EXISTS (
    SELECT 1 FROM public.categories 
    WHERE user_id = target_user_id AND name = 'Investimentos'
  ) THEN
    INSERT INTO public.categories (user_id, name, type, icon, color)
    VALUES (target_user_id, 'Investimentos', 'receita', 'line-chart', '#0d9488')
    RETURNING id INTO cat_id;

    INSERT INTO public.subcategories (user_id, category_id, name)
    VALUES
      (target_user_id, cat_id, 'Dividendos'),
      (target_user_id, cat_id, 'Renda Fixa'),
      (target_user_id, cat_id, 'Outros');
  END IF;

  -- ================= DESPESAS =================

  -- Pagamento de Fatura (Categoria Especial)
  IF NOT EXISTS (
    SELECT 1 FROM public.categories 
    WHERE user_id = target_user_id AND name = 'Pagamento de Fatura'
  ) THEN
    INSERT INTO public.categories (user_id, name, type, icon, color)
    VALUES (target_user_id, 'Pagamento de Fatura', 'despesa', 'credit-card', '#8b5cf6');
  END IF;

  -- Alimentação
  IF NOT EXISTS (
    SELECT 1 FROM public.categories 
    WHERE user_id = target_user_id AND name = 'Alimentação'
  ) THEN
    INSERT INTO public.categories (user_id, name, type, icon, color)
    VALUES (target_user_id, 'Alimentação', 'despesa', 'utensils', '#f43f5e')
    RETURNING id INTO cat_id;

    INSERT INTO public.subcategories (user_id, category_id, name)
    VALUES
      (target_user_id, cat_id, 'Supermercado'),
      (target_user_id, cat_id, 'Restaurante'),
      (target_user_id, cat_id, 'Delivery'),
      (target_user_id, cat_id, 'Outros');
  END IF;

  -- Moradia
  IF NOT EXISTS (
    SELECT 1 FROM public.categories 
    WHERE user_id = target_user_id AND name = 'Moradia'
  ) THEN
    INSERT INTO public.categories (user_id, name, type, icon, color)
    VALUES (target_user_id, 'Moradia', 'despesa', 'home', '#f97316')
    RETURNING id INTO cat_id;

    INSERT INTO public.subcategories (user_id, category_id, name)
    VALUES
      (target_user_id, cat_id, 'Aluguel'),
      (target_user_id, cat_id, 'Energia'),
      (target_user_id, cat_id, 'Internet'),
      (target_user_id, cat_id, 'Outros');
  END IF;

  -- Transporte
  IF NOT EXISTS (
    SELECT 1 FROM public.categories 
    WHERE user_id = target_user_id AND name = 'Transporte'
  ) THEN
    INSERT INTO public.categories (user_id, name, type, icon, color)
    VALUES (target_user_id, 'Transporte', 'despesa', 'car', '#eab308')
    RETURNING id INTO cat_id;

    INSERT INTO public.subcategories (user_id, category_id, name)
    VALUES
      (target_user_id, cat_id, 'Combustível'),
      (target_user_id, cat_id, 'Transporte Público'),
      (target_user_id, cat_id, 'App (Uber/99)'),
      (target_user_id, cat_id, 'Outros');
  END IF;

  -- Lazer
  IF NOT EXISTS (
    SELECT 1 FROM public.categories 
    WHERE user_id = target_user_id AND name = 'Lazer'
  ) THEN
    INSERT INTO public.categories (user_id, name, type, icon, color)
    VALUES (target_user_id, 'Lazer', 'despesa', 'gamepad-2', '#8b5cf6')
    RETURNING id INTO cat_id;

    INSERT INTO public.subcategories (user_id, category_id, name)
    VALUES
      (target_user_id, cat_id, 'Viagens'),
      (target_user_id, cat_id, 'Streaming'),
      (target_user_id, cat_id, 'Hobbies'),
      (target_user_id, cat_id, 'Outros');
  END IF;

  -- Outros (Categoria solta)
  IF NOT EXISTS (
    SELECT 1 FROM public.categories 
    WHERE user_id = target_user_id AND name = 'Outros'
  ) THEN
    INSERT INTO public.categories (user_id, name, type, icon, color)
    VALUES (target_user_id, 'Outros', 'despesa', 'tag', '#94a3b8');
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. EXECUTA PARA TODOS OS USUÁRIOS EXISTENTES
-- =====================================================

DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN SELECT id FROM public.users LOOP
    PERFORM public.create_default_categories_free(u.id);
  END LOOP;
END;
$$;

-- =====================================================
-- 3. GARANTE PARA NOVOS USUÁRIOS (TRIGGER)
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_user_create_categories()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.create_default_categories_free(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_add_categories ON public.users;

CREATE TRIGGER on_user_created_add_categories
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_create_categories();
