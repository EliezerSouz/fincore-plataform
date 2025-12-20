-- Forçando permissões para o role 'anon' e 'authenticated'
-- Às vezes o DISABLE RLS não é suficiente se o GRANT não existir

GRANT SELECT ON payment_methods TO anon;
GRANT SELECT ON payment_methods TO authenticated;
GRANT SELECT ON payment_methods TO service_role;

-- Garante que RLS está desabilitado
ALTER TABLE payment_methods DISABLE ROW LEVEL SECURITY;
