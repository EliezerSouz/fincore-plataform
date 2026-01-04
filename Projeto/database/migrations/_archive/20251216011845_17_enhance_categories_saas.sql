-- Adicionar coluna 'is_system' se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'is_system') THEN
        ALTER TABLE public.categories ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcategories' AND column_name = 'is_system') THEN
        ALTER TABLE public.subcategories ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- Atualizar categorias existentes para serem consideradas de sistema (já que foram criadas pelo seed anterior)
-- Presumindo que tudo criado até agora foi setup inicial. Se o usuário criou manual, vai virar sistema também, mas ok para dev.
UPDATE public.categories SET is_system = true WHERE is_system = false;
UPDATE public.subcategories SET is_system = true WHERE is_system = false;

-- Atualizar Função de Seed para o Novo Padrão SaaS
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER AS $$
DECLARE
  cat_id UUID;
BEGIN
  -- ================= RECEITAS =================

  INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
  VALUES (NEW.id, 'Salário', 'receita', 'wallet', '#22c55e', true)
  RETURNING id INTO cat_id;

  INSERT INTO public.subcategories (user_id, category_id, name, is_system) VALUES 
  (NEW.id, cat_id, 'Mensal', true),
  (NEW.id, cat_id, '13º', true),
  (NEW.id, cat_id, 'Bônus', true),
  (NEW.id, cat_id, 'Outros', true);

  INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
  VALUES (NEW.id, 'Renda Extra', 'receita', 'trending-up', '#10b981', true)
  RETURNING id INTO cat_id;

  INSERT INTO public.subcategories (user_id, category_id, name, is_system) VALUES 
  (NEW.id, cat_id, 'Freelance', true),
  (NEW.id, cat_id, 'Serviços', true),
  (NEW.id, cat_id, 'Outros', true);

  -- ================= DESPESAS =================

  INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
  VALUES (NEW.id, 'Alimentação', 'despesa', 'utensils', '#f43f5e', true)
  RETURNING id INTO cat_id;

  INSERT INTO public.subcategories (user_id, category_id, name, is_system) VALUES 
  (NEW.id, cat_id, 'Supermercado', true),
  (NEW.id, cat_id, 'Restaurante', true),
  (NEW.id, cat_id, 'Delivery', true),
  (NEW.id, cat_id, 'Outros', true);

  INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
  VALUES (NEW.id, 'Moradia', 'despesa', 'home', '#f97316', true)
  RETURNING id INTO cat_id;

  INSERT INTO public.subcategories (user_id, category_id, name, is_system) VALUES 
  (NEW.id, cat_id, 'Aluguel', true),
  (NEW.id, cat_id, 'Condomínio', true),
  (NEW.id, cat_id, 'Energia', true),
  (NEW.id, cat_id, 'Internet', true),
  (NEW.id, cat_id, 'Outros', true);

  INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
  VALUES (NEW.id, 'Transporte', 'despesa', 'car', '#eab308', true)
  RETURNING id INTO cat_id;

  INSERT INTO public.subcategories (user_id, category_id, name, is_system) VALUES 
  (NEW.id, cat_id, 'Combustível', true),
  (NEW.id, cat_id, 'Uber/99', true),
  (NEW.id, cat_id, 'Transporte Público', true),
  (NEW.id, cat_id, 'Outros', true);

  INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
  VALUES (NEW.id, 'Lazer', 'despesa', 'gamepad-2', '#8b5cf6', true)
  RETURNING id INTO cat_id;

  INSERT INTO public.subcategories (user_id, category_id, name, is_system) VALUES 
  (NEW.id, cat_id, 'Streaming', true),
  (NEW.id, cat_id, 'Viagens', true),
  (NEW.id, cat_id, 'Hobbies', true),
  (NEW.id, cat_id, 'Outros', true);

  -- ================= CATEGORIA OUTROS (FREE) =================
  -- SEM SUBCATEGORIAS
  INSERT INTO public.categories (user_id, name, type, icon, color, is_system)
  VALUES (NEW.id, 'Outros', 'despesa', 'tag', '#64748b', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
