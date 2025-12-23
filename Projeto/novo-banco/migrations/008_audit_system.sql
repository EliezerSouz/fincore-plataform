-- =====================================================
-- MIGRATION 008: AUDIT SYSTEM
-- Descrição: Sistema completo de auditoria (IMUTÁVEL)
-- Data: 23/12/2025
-- Autor: FinCore Team
-- =====================================================

-- =====================================================
-- PARTE 1: TABELA DE AUDITORIA (IMUTÁVEL)
-- =====================================================

-- Dropar tabela se já existir (para recriar limpa)
DROP TABLE IF EXISTS audit_log CASCADE;

CREATE TABLE audit_log (
    -- Identificação
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação do Registro
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    
    -- Operação
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    
    -- Dados
    old_values JSONB,  -- Valores antes da operação (NULL para INSERT)
    new_values JSONB,  -- Valores depois da operação (NULL para DELETE)
    
    -- Contexto (opcional - pode ser adicionado via application)
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint de validação (sem nome explícito para evitar conflitos)
    CHECK (
        (operation = 'INSERT' AND old_values IS NULL) OR
        (operation = 'DELETE' AND new_values IS NULL) OR
        (operation = 'UPDATE' AND old_values IS NOT NULL AND new_values IS NOT NULL)
    )
);

-- Índices para Performance
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_record_id ON audit_log(record_id);
CREATE INDEX idx_audit_log_operation ON audit_log(operation);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_user_table ON audit_log(user_id, table_name, created_at DESC);

-- =====================================================
-- PARTE 2: FUNÇÃO GENÉRICA DE AUDITORIA
-- =====================================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_old_data JSONB;
    v_new_data JSONB;
BEGIN
    -- Obter user_id do registro
    IF TG_OP = 'DELETE' THEN
        v_user_id := OLD.user_id;
    ELSE
        v_user_id := NEW.user_id;
    END IF;
    
    -- Preparar dados antigos e novos
    IF TG_OP = 'DELETE' THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := NULL;
    ELSIF TG_OP = 'INSERT' THEN
        v_old_data := NULL;
        v_new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    END IF;
    
    -- Inserir log de auditoria
    INSERT INTO audit_log (
        user_id, table_name, record_id, operation, old_values, new_values
    ) VALUES (
        v_user_id,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        v_old_data,
        v_new_data
    );
    
    -- Retornar o registro apropriado
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTE 3: ADICIONAR TRIGGERS DE AUDITORIA
-- =====================================================

-- Auditoria em TRANSACTIONS (crítico)
DROP TRIGGER IF EXISTS audit_transactions_trigger ON transactions;
CREATE TRIGGER audit_transactions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Auditoria em ACCOUNTS (crítico)
DROP TRIGGER IF EXISTS audit_accounts_trigger ON accounts;
CREATE TRIGGER audit_accounts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON accounts
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Auditoria em CREDIT_CARD_INVOICES (crítico)
DROP TRIGGER IF EXISTS audit_invoices_trigger ON credit_card_invoices;
CREATE TRIGGER audit_invoices_trigger
    AFTER INSERT OR UPDATE OR DELETE ON credit_card_invoices
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Auditoria em CREDIT_CARD_TRANSACTIONS (crítico)
DROP TRIGGER IF EXISTS audit_cc_transactions_trigger ON credit_card_transactions;
CREATE TRIGGER audit_cc_transactions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON credit_card_transactions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Auditoria em PAYABLES (crítico)
DROP TRIGGER IF EXISTS audit_payables_trigger ON payables;
CREATE TRIGGER audit_payables_trigger
    AFTER INSERT OR UPDATE OR DELETE ON payables
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Auditoria em CREDIT_CARDS (importante)
DROP TRIGGER IF EXISTS audit_credit_cards_trigger ON credit_cards;
CREATE TRIGGER audit_credit_cards_trigger
    AFTER INSERT OR UPDATE OR DELETE ON credit_cards
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Auditoria em ACCOUNT_BALANCE_ADJUSTMENTS (crítico)
DROP TRIGGER IF EXISTS audit_balance_adjustments_trigger ON account_balance_adjustments;
CREATE TRIGGER audit_balance_adjustments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON account_balance_adjustments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- PARTE 4: VIEWS ÚTEIS PARA CONSULTA
-- =====================================================

-- View: Histórico de alterações de saldo
CREATE OR REPLACE VIEW v_account_balance_history AS
SELECT 
    al.id as audit_id,
    al.user_id,
    al.record_id as account_id,
    al.operation,
    (al.old_values->>'balance')::NUMERIC as old_balance,
    (al.new_values->>'balance')::NUMERIC as new_balance,
    (al.new_values->>'balance')::NUMERIC - (al.old_values->>'balance')::NUMERIC as balance_change,
    al.created_at
FROM audit_log al
WHERE al.table_name = 'accounts'
    AND al.operation = 'UPDATE'
    AND al.old_values->>'balance' IS DISTINCT FROM al.new_values->>'balance'
ORDER BY al.created_at DESC;

-- View: Histórico de transações deletadas
CREATE OR REPLACE VIEW v_deleted_transactions AS
SELECT 
    al.id as audit_id,
    al.user_id,
    al.record_id as transaction_id,
    (al.old_values->>'description')::TEXT as description,
    (al.old_values->>'amount')::NUMERIC as amount,
    (al.old_values->>'type')::TEXT as type,
    (al.old_values->>'date')::DATE as date,
    al.created_at as deleted_at
FROM audit_log al
WHERE al.table_name = 'transactions'
    AND al.operation = 'DELETE'
ORDER BY al.created_at DESC;

-- View: Últimas alterações por usuário
CREATE OR REPLACE VIEW v_recent_user_changes AS
SELECT 
    al.user_id,
    u.full_name,
    al.table_name,
    al.operation,
    al.created_at,
    al.record_id
FROM audit_log al
JOIN users u ON u.id = al.user_id
ORDER BY al.created_at DESC
LIMIT 100;

-- =====================================================
-- PARTE 5: FUNÇÃO PARA CONSULTAR HISTÓRICO
-- =====================================================

CREATE OR REPLACE FUNCTION get_record_history(
    p_table_name TEXT,
    p_record_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    audit_id UUID,
    operation TEXT,
    old_values JSONB,
    new_values JSONB,
    changed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.operation,
        al.old_values,
        al.new_values,
        al.created_at
    FROM audit_log al
    WHERE al.table_name = p_table_name
        AND al.record_id = p_record_id
        AND al.user_id = p_user_id
    ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTE 6: ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas seus próprios logs
CREATE POLICY "Users can view own audit logs"
    ON audit_log
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Apenas sistema pode inserir logs (via triggers)
CREATE POLICY "System can insert audit logs"
    ON audit_log
    FOR INSERT
    WITH CHECK (true);

-- IMPORTANTE: Logs são IMUTÁVEIS (não podem ser editados ou deletados)
-- Não criar policies de UPDATE/DELETE = ninguém pode modificar

-- =====================================================
-- PARTE 7: GRANTS E COMENTÁRIOS
-- =====================================================

GRANT SELECT ON TABLE audit_log TO authenticated;
GRANT SELECT ON v_account_balance_history TO authenticated;
GRANT SELECT ON v_deleted_transactions TO authenticated;
GRANT SELECT ON v_recent_user_changes TO authenticated;
GRANT EXECUTE ON FUNCTION get_record_history(TEXT, UUID, UUID) TO authenticated;

COMMENT ON TABLE audit_log IS 'Tabela de auditoria IMUTÁVEL que registra todas as operações financeiras críticas';
COMMENT ON COLUMN audit_log.operation IS 'Tipo de operação: INSERT, UPDATE ou DELETE';
COMMENT ON COLUMN audit_log.old_values IS 'Valores antes da operação (NULL para INSERT)';
COMMENT ON COLUMN audit_log.new_values IS 'Valores depois da operação (NULL para DELETE)';
COMMENT ON FUNCTION audit_trigger_function() IS 'Função genérica de trigger para auditoria automática';
COMMENT ON FUNCTION get_record_history(TEXT, UUID, UUID) IS 'Retorna o histórico completo de alterações de um registro específico';

-- =====================================================
-- FIM DA MIGRATION 008
-- =====================================================
