-- Habilita RLS na tabela (boa prática, caso não esteja)
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Remove policy antiga se existir para evitar erro de duplicidade
DROP POLICY IF EXISTS "Leitura permitida para todos usuários autenticados" ON payment_methods;

-- Cria policy permitindo Select para qualquer usuário autenticado
CREATE POLICY "Leitura permitida para todos usuários autenticados" 
ON payment_methods 
FOR SELECT 
TO authenticated 
USING (true);

-- (Opcional) Se precisar que o usuário edite métodos, precisaria de outra policy. 
-- Mas geralmente métodos são do sistema. Assumindo apenas leitura.
