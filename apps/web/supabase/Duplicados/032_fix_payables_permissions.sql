-- Conceder permissões básicas para o role 'authenticated' e 'service_role'
-- Necessário para que o RLS funcione corretamente para usuários logados

GRANT ALL ON TABLE public.payables TO authenticated;
GRANT ALL ON TABLE public.payables TO service_role;

-- Se houver sequências ou constraints, garantir acesso também (embora usemos UUIDs)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
