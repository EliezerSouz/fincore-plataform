-- FORCE UPDATE: Execute este script no seu banco de dados para garantir que as tabelas e colunas existam.

-- 1. Garante colunas na tabela users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS base_plan VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS is_temp_access BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS temp_access_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS temp_access_origin VARCHAR(50),
ADD COLUMN IF NOT EXISTS used_promo_code VARCHAR(50);

-- 2. Cria tabela de códigos promocionais
CREATE TABLE IF NOT EXISTS public.promo_codes (
    code VARCHAR(50) PRIMARY KEY,
    plan_type VARCHAR(20) NOT NULL,
    duration_days INT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Insere códigos obrigatórios
INSERT INTO public.promo_codes (code, plan_type, duration_days, active) VALUES
('PREMIUM7', 'premium', 7, TRUE),
('IA5', 'premium_ia', 5, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 4. Confirmação (opcional)
SELECT count(*) as total_users FROM public.users;
