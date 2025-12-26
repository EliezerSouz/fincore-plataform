-- ============================================================================
-- FIX MIGRATION: Corrigir constraint check_yield_config
-- Objetivo: Permitir que contas CAIXA tenham yield habilitado (contas remuneradas)
--           e permitir RESERVA_CDI com yield desabilitado.
-- ============================================================================

-- Dropar constraint antiga
ALTER TABLE pockets DROP CONSTRAINT IF EXISTS check_yield_config;

-- Adicionar nova constraint mais flexível
-- Regra Simples: Se yield_enabled for true, tem que ter uma taxa yield_cdi_rate > 0.
-- O tipo do pocket não importa tanto para a constraint de integridade de dados.
ALTER TABLE pockets ADD CONSTRAINT check_yield_config CHECK (
    (yield_enabled = false) OR
    (yield_enabled = true AND yield_cdi_rate > 0)
);

-- Re-processar migração das contas que falharam
-- Para isso, removemos o registro de erro da tabela de auditoria para que o script tente novamente
DELETE FROM migration_audit 
WHERE migration_name = 'accounts_to_pockets' 
AND status = 'ERROR';

-- Logs de erro limpos. Pronto para rodar novamente.
