-- Converter a coluna account.type para TEXT para flexibilidade total
-- Isso permite adicionar 'digital', 'vale_alimentacao', 'internacional', etc. sem alterar o banco
ALTER TABLE public.accounts 
  ALTER COLUMN type DROP DEFAULT;

ALTER TABLE public.accounts 
  ALTER COLUMN type TYPE TEXT 
  USING type::text;

-- Se quiser, podemos redefinir um default
ALTER TABLE public.accounts 
  ALTER COLUMN type SET DEFAULT 'outros';

-- (Opcional) Remover o tipo enum antigo para limpeza
DROP TYPE IF EXISTS public.tipo_conta;
