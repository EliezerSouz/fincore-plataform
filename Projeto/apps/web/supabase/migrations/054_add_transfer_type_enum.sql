-- Migration para suportar oficialmente o tipo 'transferencia'

-- 1. Adicionar o valor 'transferencia' ao ENUM (se existir)
-- O nome do enum varia, mas geralmente é 'transaction_type' ou inferido
DO $$
BEGIN
    -- Tenta adicionar ao type se for um enum conhecido
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'transferencia';
    END IF;
END $$;

-- 2. Atualizar a Check Constraint (se a coluna for TEXT com validação)
-- Removemos a constraint antiga e adicionamos uma nova que permite 'transferencia'
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.transactions'::regclass 
        AND confrelid = 0 
        AND conname LIKE '%type%' -- Procura constraints na coluna type
    LOOP
        EXECUTE 'ALTER TABLE public.transactions DROP CONSTRAINT ' || r.conname;
    END LOOP;
END $$;

-- Recria a constraint aceitando 'transferencia'
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('receita', 'despesa', 'transferencia'));


-- 3. Data Migration: Converter transações antigas para o novo tipo
-- Procura transações categorizadas como "Transferência" e atualiza seu tipo real
UPDATE public.transactions
SET type = 'transferencia'
WHERE category_id IN (
    SELECT id FROM public.categories WHERE name ILIKE 'Transferência'
);

-- Opcional: Atualizar descrições ou metadados se necessário
