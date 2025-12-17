-- =====================================================
-- TABELAS DE CATEGORIAS E SUBCATEGORIAS
-- Estrutura hierárquica para relatórios detalhados
-- =====================================================

-- Drop se existir
DROP TYPE IF EXISTS tipo_categoria CASCADE;

-- Criar ENUM para tipo de transação
CREATE TYPE tipo_categoria AS ENUM (
  'receita',
  'despesa'
);

-- 1. TABELA CATEGORIAS (MACRO) - Ex: Alimentação
CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  type tipo_categoria NOT NULL,
  
  icon TEXT DEFAULT 'tag',
  color TEXT DEFAULT '#94a3b8',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA SUBCATEGORIAS (MICRO) - Ex: iFood, Supermercado
CREATE TABLE public.subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- Desnormalizado para facilitar RLS
  
  name TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_subcategories_category_id ON public.subcategories(category_id);
CREATE INDEX idx_subcategories_user_id ON public.subcategories(user_id);

-- Trigger de updated_at
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_subcategories_updated_at BEFORE UPDATE ON public.subcategories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- RLS (SEGURANÇA)
-- =====================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- Policies para Categorias
CREATE POLICY "Users can view own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Policies para Subcategorias
CREATE POLICY "Users can view own subcategories" ON public.subcategories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subcategories" ON public.subcategories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subcategories" ON public.subcategories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subcategories" ON public.subcategories FOR DELETE USING (auth.uid() = user_id);

-- Permissões
GRANT ALL ON TABLE public.categories TO authenticated;
GRANT ALL ON TABLE public.subcategories TO authenticated;
GRANT ALL ON TABLE public.categories TO service_role;
GRANT ALL ON TABLE public.subcategories TO service_role;

-- =====================================================
-- FUNÇÃO: CRIAR CATEGORIAS PADRÃO (HIERÁRQUICAS)
-- =====================================================

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

-- Trigger
CREATE TRIGGER on_user_created_add_categories
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_categories();
