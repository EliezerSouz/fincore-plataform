-- =====================================================
-- ATUALIZAÇÃO DE TIPOS DE CONTA
-- Adiciona 'conta_digital' ao enum tipo_conta
-- =====================================================

-- NOTA: O PostgreSQL não permite IF NOT EXISTS em ADD VALUE
-- Se 'conta_digital' já existir, esse comando pode falhar, o que é seguro ignorar.
ALTER TYPE tipo_conta ADD VALUE IF NOT EXISTS 'conta_digital';

-- Caso seu Postgres seja antigo e não suporte IF NOT EXISTS no ADD VALUE:
-- ALTER TYPE tipo_conta ADD VALUE 'conta_digital';
