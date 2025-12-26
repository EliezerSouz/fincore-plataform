-- ============================================================================
-- MIGRATION SCRIPT: Migrar Accounts para Parent Accounts + Pockets
-- Data: 2025-12-26
-- Objetivo: Migrar dados existentes para o novo modelo SEM QUEBRAR NADA
-- Status: SAFE - Idempotente, Auditável, Reversível
-- ============================================================================

-- IMPORTANTE: Este script pode ser executado múltiplas vezes sem problemas
-- Ele verifica se os dados já foram migrados antes de processar

-- ============================================================================
-- PASSO 1: Criar tabela de auditoria da migração
-- ============================================================================
CREATE TABLE IF NOT EXISTS migration_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(100) NOT NULL,
    old_account_id UUID,
    new_parent_account_id UUID,
    new_pocket_id UUID,
    status VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(migration_name, old_account_id)
);

CREATE INDEX IF NOT EXISTS idx_migration_audit_status ON migration_audit(migration_name, status);

-- ============================================================================
-- PASSO 2: Função de Migração (Idempotente)
-- ============================================================================
CREATE OR REPLACE FUNCTION migrate_account_to_pocket(p_account_id UUID)
RETURNS TABLE(
    success BOOLEAN,
    parent_account_id UUID,
    pocket_id UUID,
    message TEXT
) AS $$
DECLARE
    v_account RECORD;
    v_parent_id UUID;
    v_pocket_id UUID;
    v_pocket_type VARCHAR(50);
    v_institution_name VARCHAR(100);
    v_already_migrated BOOLEAN;
BEGIN
    -- Verificar se já foi migrado
    SELECT EXISTS(
        SELECT 1 FROM migration_audit 
        WHERE migration_name = 'accounts_to_pockets' 
        AND old_account_id = p_account_id 
        AND status = 'SUCCESS'
    ) INTO v_already_migrated;
    
    IF v_already_migrated THEN
        -- Retornar IDs existentes
        SELECT new_parent_account_id, new_pocket_id 
        INTO v_parent_id, v_pocket_id
        FROM migration_audit
        WHERE migration_name = 'accounts_to_pockets' 
        AND old_account_id = p_account_id;
        
        RETURN QUERY SELECT true, v_parent_id, v_pocket_id, 'Already migrated'::TEXT;
        RETURN;
    END IF;
    
    -- Buscar dados da conta antiga
    SELECT * INTO v_account FROM accounts WHERE id = p_account_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, 'Account not found'::TEXT;
        RETURN;
    END IF;
    
    -- Determinar nome da instituição (usar o nome da conta como base)
    v_institution_name := v_account.name;
    
    -- Determinar tipo do pocket baseado no tipo da conta
    v_pocket_type := CASE v_account.type
        WHEN 'corrente' THEN 'CAIXA'
        WHEN 'digital' THEN 'CAIXA'
        WHEN 'carteira' THEN 'CAIXA'
        WHEN 'poupanca' THEN 'RESERVA_CDI'
        WHEN 'reserva_emergencia' THEN 'RESERVA_CDI'
        WHEN 'investimento' THEN 'INVESTIMENTO'
        WHEN 'vale_alimentacao' THEN 'CAIXA'
        WHEN 'internacional' THEN 'CAIXA'
        ELSE 'CAIXA'
    END;
    
    -- Criar ou buscar Parent Account
    INSERT INTO parent_accounts (user_id, institution_name, institution_type, color, is_active)
    VALUES (
        v_account.user_id,
        v_institution_name,
        CASE 
            WHEN v_account.type IN ('digital', 'corrente') THEN 'digital_bank'
            WHEN v_account.type = 'investimento' THEN 'broker'
            ELSE 'fintech'
        END,
        v_account.color,
        v_account.is_active
    )
    ON CONFLICT (user_id, institution_name) 
    DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_parent_id;
    
    -- Criar Pocket
    INSERT INTO pockets (
        parent_account_id,
        user_id,
        name,
        pocket_type,
        balance,
        yield_enabled,
        yield_source,
        yield_cdi_rate,
        last_yield_date,
        color,
        is_active,
        display_order
    )
    VALUES (
        v_parent_id,
        v_account.user_id,
        CASE v_pocket_type
            WHEN 'CAIXA' THEN 'Caixa'
            WHEN 'RESERVA_CDI' THEN 'Reserva'
            WHEN 'INVESTIMENTO' THEN 'Investimentos'
        END,
        v_pocket_type,
        v_account.balance,
        COALESCE(v_account.yield_enabled, false),
        v_account.yield_source,
        COALESCE(v_account.yield_cdi_rate, 0),
        v_account.last_yield_date,
        v_account.color,
        v_account.is_active,
        CASE v_pocket_type
            WHEN 'CAIXA' THEN 1
            WHEN 'RESERVA_CDI' THEN 2
            WHEN 'INVESTIMENTO' THEN 3
        END
    )
    RETURNING id INTO v_pocket_id;
    
    -- Registrar migração bem-sucedida
    INSERT INTO migration_audit (
        migration_name,
        old_account_id,
        new_parent_account_id,
        new_pocket_id,
        status
    ) VALUES (
        'accounts_to_pockets',
        p_account_id,
        v_parent_id,
        v_pocket_id,
        'SUCCESS'
    );
    
    RETURN QUERY SELECT true, v_parent_id, v_pocket_id, 'Migration successful'::TEXT;
    
EXCEPTION WHEN OTHERS THEN
    -- Registrar erro
    INSERT INTO migration_audit (
        migration_name,
        old_account_id,
        status,
        error_message
    ) VALUES (
        'accounts_to_pockets',
        p_account_id,
        'ERROR',
        SQLERRM
    );
    
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PASSO 3: Executar Migração para TODAS as contas
-- ============================================================================
DO $$
DECLARE
    v_account RECORD;
    v_result RECORD;
    v_total_accounts INT;
    v_migrated_count INT := 0;
    v_error_count INT := 0;
    v_skipped_count INT := 0;
BEGIN
    -- Contar total de contas
    SELECT COUNT(*) INTO v_total_accounts FROM accounts;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Iniciando migração de % contas...', v_total_accounts;
    RAISE NOTICE '========================================';
    
    -- Processar cada conta
    FOR v_account IN SELECT id, name, type FROM accounts ORDER BY created_at ASC
    LOOP
        -- Executar migração
        SELECT * INTO v_result FROM migrate_account_to_pocket(v_account.id);
        
        IF v_result.success THEN
            IF v_result.message = 'Already migrated' THEN
                v_skipped_count := v_skipped_count + 1;
                RAISE NOTICE '⏭️  [%/%] Conta já migrada: % (tipo: %)', 
                    v_migrated_count + v_skipped_count + v_error_count, 
                    v_total_accounts,
                    v_account.name, 
                    v_account.type;
            ELSE
                v_migrated_count := v_migrated_count + 1;
                RAISE NOTICE '✅ [%/%] Migrado: % (tipo: %) -> Parent: %, Pocket: %', 
                    v_migrated_count + v_skipped_count + v_error_count, 
                    v_total_accounts,
                    v_account.name, 
                    v_account.type,
                    v_result.parent_account_id,
                    v_result.pocket_id;
            END IF;
        ELSE
            v_error_count := v_error_count + 1;
            RAISE WARNING '❌ [%/%] Erro ao migrar %: %', 
                v_migrated_count + v_skipped_count + v_error_count,
                v_total_accounts,
                v_account.name, 
                v_result.message;
        END IF;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migração concluída!';
    RAISE NOTICE '✅ Migradas: %', v_migrated_count;
    RAISE NOTICE '⏭️  Já existentes: %', v_skipped_count;
    RAISE NOTICE '❌ Erros: %', v_error_count;
    RAISE NOTICE '📊 Total: %', v_total_accounts;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- PASSO 4: Validação da Migração
-- ============================================================================
DO $$
DECLARE
    v_accounts_count INT;
    v_pockets_count INT;
    v_success_count INT;
    v_error_count INT;
BEGIN
    SELECT COUNT(*) INTO v_accounts_count FROM accounts;
    SELECT COUNT(*) INTO v_pockets_count FROM pockets;
    SELECT COUNT(*) INTO v_success_count FROM migration_audit WHERE status = 'SUCCESS';
    SELECT COUNT(*) INTO v_error_count FROM migration_audit WHERE status = 'ERROR';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VALIDAÇÃO DA MIGRAÇÃO';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Contas antigas: %', v_accounts_count;
    RAISE NOTICE 'Pockets criados: %', v_pockets_count;
    RAISE NOTICE 'Migrações bem-sucedidas: %', v_success_count;
    RAISE NOTICE 'Migrações com erro: %', v_error_count;
    
    IF v_success_count = v_accounts_count THEN
        RAISE NOTICE '✅ SUCESSO: Todas as contas foram migradas!';
    ELSIF v_error_count > 0 THEN
        RAISE WARNING '⚠️  ATENÇÃO: % contas com erro na migração', v_error_count;
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- PASSO 5: Relatório de Migração
-- ============================================================================
SELECT 
    'RESUMO DA MIGRAÇÃO' as tipo,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) as sucesso,
    COUNT(CASE WHEN status = 'ERROR' THEN 1 END) as erros
FROM migration_audit
WHERE migration_name = 'accounts_to_pockets'

UNION ALL

SELECT 
    'PARENT ACCOUNTS CRIADOS' as tipo,
    COUNT(*) as total,
    COUNT(CASE WHEN is_active = true THEN 1 END) as ativos,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inativos
FROM parent_accounts

UNION ALL

SELECT 
    'POCKETS CRIADOS' as tipo,
    COUNT(*) as total,
    COUNT(CASE WHEN is_active = true THEN 1 END) as ativos,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inativos
FROM pockets;

-- ============================================================================
-- PASSO 6: Detalhamento por Tipo de Pocket
-- ============================================================================
SELECT 
    pocket_type,
    COUNT(*) as quantidade,
    SUM(balance) as saldo_total,
    COUNT(CASE WHEN yield_enabled = true THEN 1 END) as com_rendimento
FROM pockets
GROUP BY pocket_type
ORDER BY pocket_type;

-- ============================================================================
-- SCRIPT DE ROLLBACK (Se necessário)
-- ============================================================================
-- ATENÇÃO: Execute apenas se precisar reverter a migração
-- 
-- DELETE FROM pockets WHERE id IN (
--     SELECT new_pocket_id FROM migration_audit 
--     WHERE migration_name = 'accounts_to_pockets'
-- );
-- 
-- DELETE FROM parent_accounts WHERE id IN (
--     SELECT DISTINCT new_parent_account_id FROM migration_audit 
--     WHERE migration_name = 'accounts_to_pockets'
-- );
-- 
-- DELETE FROM migration_audit WHERE migration_name = 'accounts_to_pockets';
-- 
-- RAISE NOTICE 'Rollback executado com sucesso!';

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================
