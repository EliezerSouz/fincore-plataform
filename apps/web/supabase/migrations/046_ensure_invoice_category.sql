-- =====================================================
-- MIGRATION: Ensure 'Pagamento de Fatura' Category
-- 1. Create function to add the category safely
-- 2. Run for all existing users
-- 3. Update the default categories trigger for FUTURE users
-- =====================================================

-- 1. Função para adicionar categoria de Fatura se não existir
CREATE OR REPLACE FUNCTION public.ensure_invoice_category(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Verificar se já existe (Case insensitive par nome)
  IF NOT EXISTS (
    SELECT 1 FROM public.categories 
    WHERE user_id = target_user_id 
    AND name = 'Pagamento de Fatura' -- Must match app code logic
    AND type = 'despesa'
  ) THEN
    INSERT INTO public.categories (user_id, name, type, icon, color)
    VALUES (target_user_id, 'Pagamento de Fatura', 'despesa', 'credit-card', '#8b5cf6'); -- Roxo
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. BLOCO ANÔNIMO: Executar para todos os usuários existentes
DO $$
DECLARE
  u record;
BEGIN
  -- Iterar sobre todos os usuários na tabela public.users (que espelha auth.users neste projeto)
  FOR u IN SELECT id FROM public.users LOOP
    PERFORM public.ensure_invoice_category(u.id);
  END LOOP;
END;
$$;

-- 3. ATUALIZAR A FUNÇÃO PADRÃO (create_default_categories)
-- Para que novos usuários já nasçam com essa categoria
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER AS $$
DECLARE
  cat_id UUID;
BEGIN
  -- ================= RECEITAS =================
  
  -- Salário
  INSERT INTO public.categories (user_id, name, type, icon, color) VALUES (NEW.id, 'Salário', 'receita', 'wallet', '#22c55e') RETURNING id INTO cat_id;
  INSERT INTO public.subcategories (user_id, category_id, name) VALUES 
  (NEW.id, cat_id, 'Mensal'), (NEW.id, cat_id, 'Adiantamento'), (NEW.id, cat_id, '13º Salário'), (NEW.id, cat_id, 'Outros');

  -- Investimentos
  INSERT INTO public.categories (user_id, name, type, icon, color) VALUES (NEW.id, 'Investimentos', 'receita', 'trending-up', '#10b981') RETURNING id INTO cat_id;
  INSERT INTO public.subcategories (user_id, category_id, name) VALUES 
  (NEW.id, cat_id, 'Dividendos'), (NEW.id, cat_id, 'Renda Fixa'), (NEW.id, cat_id, 'Venda de Ativos'), (NEW.id, cat_id, 'Outros');

  -- ================= DESPESAS =================

  -- Pagamento de Fatura (NOVO PADRÃO)
  -- Não precisa de subcategorias obrigatoriamente, mas evita Null check
  INSERT INTO public.categories (user_id, name, type, icon, color) VALUES (NEW.id, 'Pagamento de Fatura', 'despesa', 'credit-card', '#8b5cf6');

  -- Alimentação
  INSERT INTO public.categories (user_id, name, type, icon, color) VALUES (NEW.id, 'Alimentação', 'despesa', 'utensils', '#f43f5e') RETURNING id INTO cat_id;
  INSERT INTO public.subcategories (user_id, category_id, name) VALUES 
  (NEW.id, cat_id, 'Supermercado'), (NEW.id, cat_id, 'Restaurante'), (NEW.id, cat_id, 'Delivery/iFood'), (NEW.id, cat_id, 'Padaria'), (NEW.id, cat_id, 'Outros');

  -- Moradia
  INSERT INTO public.categories (user_id, name, type, icon, color) VALUES (NEW.id, 'Moradia', 'despesa', 'home', '#f97316') RETURNING id INTO cat_id;
  INSERT INTO public.subcategories (user_id, category_id, name) VALUES 
  (NEW.id, cat_id, 'Aluguel/Condomínio'), (NEW.id, cat_id, 'Energia'), (NEW.id, cat_id, 'Internet'), (NEW.id, cat_id, 'Manutenção'), (NEW.id, cat_id, 'Outros');

  -- Transporte
  INSERT INTO public.categories (user_id, name, type, icon, color) VALUES (NEW.id, 'Transporte', 'despesa', 'car', '#eab308') RETURNING id INTO cat_id;
  INSERT INTO public.subcategories (user_id, category_id, name) VALUES 
  (NEW.id, cat_id, 'Combustível'), (NEW.id, cat_id, 'Uber/99'), (NEW.id, cat_id, 'IPVA/Seguro'), (NEW.id, cat_id, 'Transporte Público'), (NEW.id, cat_id, 'Outros');
  
  -- Lazer
  INSERT INTO public.categories (user_id, name, type, icon, color) VALUES (NEW.id, 'Lazer', 'despesa', 'gamepad-2', '#8b5cf6') RETURNING id INTO cat_id;
  INSERT INTO public.subcategories (user_id, category_id, name) VALUES 
  (NEW.id, cat_id, 'Cinema/Streamings'), (NEW.id, cat_id, 'Viagens'), (NEW.id, cat_id, 'Hobbies'), (NEW.id, cat_id, 'Outros');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
