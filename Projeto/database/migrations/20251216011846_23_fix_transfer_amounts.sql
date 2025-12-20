-- Migration para corrigir o sinal dos valores de transferência
-- O sistema armazenava valores absolutos (positivos) e confiava no tipo 'despesa' para inverter.
-- Com a mudança para 'transferencia', perdemos essa inversão automática na UI.
-- Vamos gravar o sinal explicitamente no valor (amount) para que 'transferencia' funcione corretamente (negativo = saída, positivo = entrada).

-- 1. Transações de SAÍDA (baseado na categoria original 'despesa') devem ser NEGATIVAS
UPDATE public.transactions t
SET amount = -ABS(t.amount)
FROM public.categories c
WHERE t.category_id = c.id
  AND t.type = 'transferencia'
  AND c.type = 'despesa'
  AND t.amount > 0; -- Corrige apenas se estiver positivo

-- 2. Transações de ENTRADA (baseado na categoria original 'receita') devem ser POSITIVAS
UPDATE public.transactions t
SET amount = ABS(t.amount)
FROM public.categories c
WHERE t.category_id = c.id
  AND t.type = 'transferencia'
  AND c.type = 'receita'
  AND t.amount < 0; -- Corrige apenas se estiver negativo

-- Nota: Isso assume que as transações ainda estão ligadas às categorias originais de Transferência (receita/despesa).
