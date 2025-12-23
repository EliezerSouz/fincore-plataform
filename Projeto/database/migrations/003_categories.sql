-- =====================================================
-- MIGRATION 003: CATEGORIES AND SUBCATEGORIES
-- Descrição: Sistema de categorização de transações
-- Data: 23/12/2025
-- Autor: FinCore Team
-- =====================================================

-- =====================================================
-- PARTE 1: TABELA DE CATEGORIAS
-- =====================================================

CREATE TABLE categories (
    -- Identificação
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Dados da Categoria
    name TEXT NOT NULL,
    type category_type NOT NULL,
    
    -- Personalização
    icon TEXT DEFAULT 'tag',
    color TEXT DEFAULT '#94a3b8',
    
    -- Flags
    is_system BOOLEAN DEFAULT false,  -- Categoria criada pelo sistema
    is_active BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false,  -- Requer plano premium
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,  -- Soft delete
    
    -- Constraints
    CONSTRAINT unique_category_per_user UNIQUE (user_id, name, type)
);

-- Índices
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_deleted_at ON categories(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_user_type ON categories(user_id, type) WHERE deleted_at IS NULL;

-- =====================================================
-- PARTE 2: TABELA DE SUBCATEGORIAS
-- =====================================================

CREATE TABLE subcategories (
    -- Identificação
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    
    -- Dados da Subcategoria
    name TEXT NOT NULL,
    
    -- Flags
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,  -- Soft delete
    
    -- Constraints
    CONSTRAINT unique_subcategory_per_category UNIQUE (category_id, name)
);

-- Índices
CREATE INDEX idx_subcategories_user_id ON subcategories(user_id);
CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX idx_subcategories_deleted_at ON subcategories(deleted_at) WHERE deleted_at IS NULL;

-- =====================================================
-- PARTE 3: ADICIONAR FOREIGN KEYS EM TRANSACTIONS
-- =====================================================

ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_category
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_subcategory
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL;

-- =====================================================
-- PARTE 4: FUNÇÃO DE CRIAÇÃO DE CATEGORIAS PADRÃO
-- =====================================================

CREATE OR REPLACE FUNCTION create_default_categories(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cat_id UUID;
BEGIN
    -- ================= RECEITAS =================
    
    -- Salário
    IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = target_user_id AND name = 'Salário' AND deleted_at IS NULL) THEN
        INSERT INTO categories (user_id, name, type, icon, color, is_system)
        VALUES (target_user_id, 'Salário', 'receita', 'wallet', '#22c55e', true)
        RETURNING id INTO cat_id;
        
        INSERT INTO subcategories (user_id, category_id, name, is_system)
        VALUES
            (target_user_id, cat_id, 'Mensal', true),
            (target_user_id, cat_id, '13º Salário', true),
            (target_user_id, cat_id, 'Outros', true);
    END IF;

    -- Renda Extra
    IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = target_user_id AND name = 'Renda Extra' AND deleted_at IS NULL) THEN
        INSERT INTO categories (user_id, name, type, icon, color, is_system)
        VALUES (target_user_id, 'Renda Extra', 'receita', 'trending-up', '#16a34a', true)
        RETURNING id INTO cat_id;
        
        INSERT INTO subcategories (user_id, category_id, name, is_system)
        VALUES
            (target_user_id, cat_id, 'Freelance', true),
            (target_user_id, cat_id, 'Bônus', true),
            (target_user_id, cat_id, 'Outros', true);
    END IF;

    -- Investimentos
    IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = target_user_id AND name = 'Investimentos' AND deleted_at IS NULL) THEN
        INSERT INTO categories (user_id, name, type, icon, color, is_system)
        VALUES (target_user_id, 'Investimentos', 'receita', 'line-chart', '#0d9488', true)
        RETURNING id INTO cat_id;
        
        INSERT INTO subcategories (user_id, category_id, name, is_system)
        VALUES
            (target_user_id, cat_id, 'Dividendos', true),
            (target_user_id, cat_id, 'Renda Fixa', true),
            (target_user_id, cat_id, 'Outros', true);
    END IF;

    -- ================= DESPESAS =================

    -- Pagamento de Fatura (Categoria Especial)
    IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = target_user_id AND name = 'Pagamento de Fatura' AND deleted_at IS NULL) THEN
        INSERT INTO categories (user_id, name, type, icon, color, is_system)
        VALUES (target_user_id, 'Pagamento de Fatura', 'despesa', 'credit-card', '#8b5cf6', true);
    END IF;

    -- Alimentação
    IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = target_user_id AND name = 'Alimentação' AND deleted_at IS NULL) THEN
        INSERT INTO categories (user_id, name, type, icon, color, is_system)
        VALUES (target_user_id, 'Alimentação', 'despesa', 'utensils', '#f43f5e', true)
        RETURNING id INTO cat_id;
        
        INSERT INTO subcategories (user_id, category_id, name, is_system)
        VALUES
            (target_user_id, cat_id, 'Supermercado', true),
            (target_user_id, cat_id, 'Restaurante', true),
            (target_user_id, cat_id, 'Delivery', true),
            (target_user_id, cat_id, 'Outros', true);
    END IF;

    -- Moradia
    IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = target_user_id AND name = 'Moradia' AND deleted_at IS NULL) THEN
        INSERT INTO categories (user_id, name, type, icon, color, is_system)
        VALUES (target_user_id, 'Moradia', 'despesa', 'home', '#f97316', true)
        RETURNING id INTO cat_id;
        
        INSERT INTO subcategories (user_id, category_id, name, is_system)
        VALUES
            (target_user_id, cat_id, 'Aluguel', true),
            (target_user_id, cat_id, 'Energia', true),
            (target_user_id, cat_id, 'Internet', true),
            (target_user_id, cat_id, 'Outros', true);
    END IF;

    -- Transporte
    IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = target_user_id AND name = 'Transporte' AND deleted_at IS NULL) THEN
        INSERT INTO categories (user_id, name, type, icon, color, is_system)
        VALUES (target_user_id, 'Transporte', 'despesa', 'car', '#eab308', true)
        RETURNING id INTO cat_id;
        
        INSERT INTO subcategories (user_id, category_id, name, is_system)
        VALUES
            (target_user_id, cat_id, 'Combustível', true),
            (target_user_id, cat_id, 'Transporte Público', true),
            (target_user_id, cat_id, 'App (Uber/99)', true),
            (target_user_id, cat_id, 'Outros', true);
    END IF;

    -- Lazer
    IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = target_user_id AND name = 'Lazer' AND deleted_at IS NULL) THEN
        INSERT INTO categories (user_id, name, type, icon, color, is_system)
        VALUES (target_user_id, 'Lazer', 'despesa', 'gamepad-2', '#8b5cf6', true)
        RETURNING id INTO cat_id;
        
        INSERT INTO subcategories (user_id, category_id, name, is_system)
        VALUES
            (target_user_id, cat_id, 'Viagens', true),
            (target_user_id, cat_id, 'Streaming', true),
            (target_user_id, cat_id, 'Hobbies', true),
            (target_user_id, cat_id, 'Outros', true);
    END IF;

    -- Outros
    IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = target_user_id AND name = 'Outros' AND deleted_at IS NULL) THEN
        INSERT INTO categories (user_id, name, type, icon, color, is_system)
        VALUES (target_user_id, 'Outros', 'despesa', 'tag', '#94a3b8', true);
    END IF;
END;
$$;

-- =====================================================
-- PARTE 5: TRIGGERS
-- =====================================================

-- Trigger: Atualizar updated_at em categories
CREATE TRIGGER set_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Trigger: Atualizar updated_at em subcategories
CREATE TRIGGER set_subcategories_updated_at
    BEFORE UPDATE ON subcategories
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- =====================================================
-- PARTE 6: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories"
    ON categories FOR SELECT
    USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own categories"
    ON categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
    ON categories FOR UPDATE
    USING (auth.uid() = user_id AND deleted_at IS NULL)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
    ON categories FOR DELETE
    USING (auth.uid() = user_id);

-- Subcategories
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subcategories"
    ON subcategories FOR SELECT
    USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own subcategories"
    ON subcategories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subcategories"
    ON subcategories FOR UPDATE
    USING (auth.uid() = user_id AND deleted_at IS NULL)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subcategories"
    ON subcategories FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- PARTE 7: GRANTS
-- =====================================================

GRANT ALL ON TABLE categories TO authenticated;
GRANT ALL ON TABLE subcategories TO authenticated;

-- =====================================================
-- PARTE 8: COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE categories IS 'Categorias de transações (receitas e despesas)';
COMMENT ON TABLE subcategories IS 'Subcategorias para organização detalhada';
COMMENT ON FUNCTION create_default_categories(UUID) IS 'Cria categorias padrão para novo usuário';

-- =====================================================
-- FIM DA MIGRATION 003
-- =====================================================
