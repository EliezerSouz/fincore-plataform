-- 1. Remove políticas anteriores para evitar conflitos
DROP POLICY IF EXISTS "Leitura permitida para todos usuários autenticados" ON payment_methods;
DROP POLICY IF EXISTS "Leitura publica payment_methods" ON payment_methods;

-- 2. Cria uma política totalmente permissiva para Leitura (SELECT)
-- Aplica-se a 'public' (todos os roles: anon e authenticated)
CREATE POLICY "Leitura publica payment_methods" 
ON payment_methods 
FOR SELECT 
USING (true);

-- 3. Garante que RLS está ativo (necessário para as policies funcionarem)
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- 4. Verificação de Sanidade (opcional, só pra garantir que tem dados)
-- Se a contagem for 0, insere de novo (re-seed de segurança)
INSERT INTO payment_methods (name, slug, type, allows_income, allows_expense, is_active)
SELECT 'Dinheiro', 'dinheiro', 'dinheiro', true, true, true
WHERE NOT EXISTS (SELECT 1 FROM payment_methods LIMIT 1);
-- (Insere pelo menos um pra não ficar vazio se tivesse limpado tudo)
