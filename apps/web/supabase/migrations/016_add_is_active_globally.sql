-- Adiciona is_active em Categories
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Adiciona is_active em Subcategories
ALTER TABLE public.subcategories 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- (Payment Methods ja possui is_active, Accounts ja possui is_active)
-- (Users e Transactions não devem ter is_active para este propósito)

-- Indices opcionais para is_active
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_subcategories_is_active ON public.subcategories(is_active);
