-- Migration para corrigir a constraint que impede valores negativos em transactions
-- O erro indica violação de "transactions_amount_check". 
-- Isso acontece porque provavelmente há uma regra CHECK (amount > 0) ou similar herdada.
-- Precisamos permitir valores negativos para representar saídas de transferência.

-- 1. Descobrir e Remover a constraint problemática
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.transactions'::regclass 
        AND confrelid = 0 
        AND conname = 'transactions_amount_check'
    LOOP
        EXECUTE 'ALTER TABLE public.transactions DROP CONSTRAINT ' || r.conname;
    END LOOP;
END $$;

-- 2. Recriar a constraint (Opcional, se quisermos validar algo, mas values negativos agora são válidos para transferência/despesa dependendo da modelagem)
-- Se a ideia é que Despesa = Negativo e Receita = Positivo no banco:
--    Não precisamos de constraint de positividade.
-- Se a ideia é que Amount é sempre Positivo e o Type dita o sinal (modelo antigo):
--    Então a migration 055 estava errada ao tentar negativar.
--
-- ENTRETANTO, para facilitar Somas (SUM) no banco, usar sinais é muito melhor.
-- SE formos adotar Sinais (+/-), precisamos remover a trava de positividade.

-- Se quisermos apenas garantir que não seja zero?
-- ALTER TABLE public.transactions ADD CONSTRAINT transactions_amount_check CHECK (amount <> 0);

-- Vamos deixar sem constraint de positividade por enquanto para permitir a correção dos sinais.
