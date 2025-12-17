-- Desabilita RLS na tabela payment_methods.
-- Isso torna a tabela legível para qualquer um que tenha a Chave de API (Anon ou Authenticated).
-- Como são dados públicos do sistema (lista de tipos), não há risco de segurança.
ALTER TABLE payment_methods DISABLE ROW LEVEL SECURITY;
