-- Adicionar colunas de configuração de visibilidade por tipo
ALTER TABLE public.payment_methods 
ADD COLUMN IF NOT EXISTS allows_income BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS allows_expense BOOLEAN DEFAULT TRUE;

-- Atualizar os métodos padrão com as configurações corretas (Baseado na lógica de negócio comum)
-- Dinheiro, Pix, Transferência, Outros -> Aceitam ambos (Receita e Despesa)
UPDATE public.payment_methods 
SET allows_income = TRUE, allows_expense = TRUE 
WHERE slug IN ('dinheiro', 'pix', 'transferencia', 'outros');

-- Cartão de Crédito, Débito, Boleto, Cheque -> Geralmente associados a pagamentos (Despesas) no contexto pessoal
-- (Embora um logista receba por cartão, num app de finanças pessoais, cartão é saída. Mas vamos deixar flexível se necessário.
--  Pela imagem do user, 'Credito' estava só em Despesa (Fixas?)).
--  Vamos configurar inicialmente como focados em Despesa para simplificar, mas o usuário poderá editar se for Premium.
UPDATE public.payment_methods 
SET allows_income = FALSE, allows_expense = TRUE 
WHERE slug IN ('cartao_credito', 'cartao_debito', 'boleto', 'cheque');


-- Adicionar a coluna de chave estrangeira na tabela de transações
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES public.payment_methods(id);

-- Migrar os dados existentes: Tenta encontrar o ID baseado no slug salvo na coluna de texto antiga
UPDATE public.transactions t
SET payment_method_id = pm.id
FROM public.payment_methods pm
WHERE t.payment_method = pm.slug;

-- Para garantir integridade, transações que não deram match (ex: slugs antigos não mapeados) ficarão com NULL ou 'Outros'.
-- Vamos forçar 'Outros' para quem ficou NULL se houver dados.
UPDATE public.transactions t
SET payment_method_id = (SELECT id FROM public.payment_methods WHERE slug = 'outros' LIMIT 1)
WHERE t.payment_method_id IS NULL AND t.payment_method IS NOT NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method_id ON public.transactions(payment_method_id);
