-- =====================================================
-- MIGRATION: Criar Sistema de Auditoria (Audit Trail)
-- OBJETIVO: Rastrear todas as operações financeiras críticas
-- PRIORIDADE: CRÍTICA (Compliance e Segurança)
-- =====================================================

-- =====================================================
-- PARTE 1: CRIAR TABELA DE AUDITORIA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    
    -- Operação
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    
    -- Dados
    old_values JSONB,  -- Valores antes da operação (NULL para INSERT)
    new_values JSONB,  -- Valores depois da operação (NULL para DELETE)
    
    -- Contexto
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Índices para performance
    CONSTRAINT audit_log_operation_check CHECK (
        (operation = 'INSERT' AND old_values IS NULL) OR
        (operation = 'DELETE' AND new_values IS NULL) OR
        (operation = 'UPDATE' AND old_values IS NOT NULL AND new_values IS NOT NULL)
    )
);

-- =====================================================
-- PARTE 2: CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_table_name ON public.audit_log(table_name);
CREATE INDEX idx_audit_log_record_id ON public.audit_log(record_id);
CREATE INDEX idx_audit_log_operation ON public.audit_log(operation);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- Índice composto para queries comuns
CREATE INDEX idx_audit_log_user_table ON public.audit_log(user_id, table_name, created_at DESC);

-- =====================================================
-- PARTE 3: HABILITAR RLS
-- =====================================================

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios logs
CREATE POLICY "Users can view own audit logs"
ON public.audit_log
FOR SELECT
USING (auth.uid() = user_id);

-- Política: Apenas sistema pode inserir logs (via triggers)
CREATE POLICY "System can insert audit logs"
ON public.audit_log
FOR INSERT
WITH CHECK (true);

-- Política: Logs são imutáveis (não podem ser editados ou deletados)
-- (Não criar policies de UPDATE/DELETE = ninguém pode modificar)

-- =====================================================
-- PARTE 4: CRIAR FUNÇÃO GENÉRICA DE AUDITORIA
-- =====================================================

CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_old_data JSONB;
    v_new_data JSONB;
BEGIN
    -- Obter user_id do registro (assumindo que todas as tabelas têm user_id)
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
    INSERT INTO public.audit_log (
        user_id,
        table_name,
        record_id,
        operation,
        old_values,
        new_values
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
-- PARTE 5: ADICIONAR TRIGGERS DE AUDITORIA EM TABELAS CRÍTICAS
-- =====================================================

-- Auditoria em TRANSACTIONS (crítico)
DROP TRIGGER IF EXISTS audit_transactions_trigger ON public.transactions;
CREATE TRIGGER audit_transactions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Auditoria em ACCOUNTS (crítico)
DROP TRIGGER IF EXISTS audit_accounts_trigger ON public.accounts;
CREATE TRIGGER audit_accounts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Auditoria em CREDIT_CARD_INVOICES (crítico)
DROP TRIGGER IF EXISTS audit_invoices_trigger ON public.credit_card_invoices;
CREATE TRIGGER audit_invoices_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.credit_card_invoices
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Auditoria em CREDIT_CARD_TRANSACTIONS (crítico)
DROP TRIGGER IF EXISTS audit_cc_transactions_trigger ON public.credit_card_transactions;
CREATE TRIGGER audit_cc_transactions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.credit_card_transactions
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Auditoria em PAYABLES (crítico)
DROP TRIGGER IF EXISTS audit_payables_trigger ON public.payables;
CREATE TRIGGER audit_payables_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.payables
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Auditoria em CREDIT_CARDS (importante)
DROP TRIGGER IF EXISTS audit_credit_cards_trigger ON public.credit_cards;
CREATE TRIGGER audit_credit_cards_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.credit_cards
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Auditoria em ACCOUNT_BALANCE_ADJUSTMENTS (crítico)
DROP TRIGGER IF EXISTS audit_balance_adjustments_trigger ON public.account_balance_adjustments;
CREATE TRIGGER audit_balance_adjustments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.account_balance_adjustments
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- =====================================================
-- PARTE 6: CRIAR VIEWS ÚTEIS PARA CONSULTA DE AUDITORIA
-- =====================================================

-- View: Histórico de alterações de saldo
CREATE OR REPLACE VIEW public.v_account_balance_history AS
SELECT 
    al.id as audit_id,
    al.user_id,
    al.record_id as account_id,
    al.operation,
    (al.old_values->>'balance')::NUMERIC as old_balance,
    (al.new_values->>'balance')::NUMERIC as new_balance,
    (al.new_values->>'balance')::NUMERIC - (al.old_values->>'balance')::NUMERIC as balance_change,
    al.created_at
FROM public.audit_log al
WHERE al.table_name = 'accounts'
    AND al.operation = 'UPDATE'
    AND al.old_values->>'balance' IS DISTINCT FROM al.new_values->>'balance'
ORDER BY al.created_at DESC;

-- View: Histórico de transações deletadas
CREATE OR REPLACE VIEW public.v_deleted_transactions AS
SELECT 
    al.id as audit_id,
    al.user_id,
    al.record_id as transaction_id,
    (al.old_values->>'description')::TEXT as description,
    (al.old_values->>'amount')::NUMERIC as amount,
    (al.old_values->>'type')::TEXT as type,
    (al.old_values->>'date')::DATE as date,
    al.created_at as deleted_at
FROM public.audit_log al
WHERE al.table_name = 'transactions'
    AND al.operation = 'DELETE'
ORDER BY al.created_at DESC;

-- View: Últimas alterações por usuário
CREATE OR REPLACE VIEW public.v_recent_user_changes AS
SELECT 
    al.user_id,
    u.full_name,
    al.table_name,
    al.operation,
    al.created_at,
    al.record_id
FROM public.audit_log al
JOIN public.users u ON u.id = al.user_id
ORDER BY al.created_at DESC
LIMIT 100;

-- =====================================================
-- PARTE 7: CRIAR FUNÇÃO PARA CONSULTAR HISTÓRICO DE UM REGISTRO
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_record_history(
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
    FROM public.audit_log al
    WHERE al.table_name = p_table_name
        AND al.record_id = p_record_id
        AND al.user_id = p_user_id
    ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_record_history(TEXT, UUID, UUID) TO authenticated;

-- =====================================================
-- PARTE 8: COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.audit_log IS 'Tabela de auditoria que registra todas as operações financeiras críticas para compliance e rastreabilidade';
COMMENT ON COLUMN public.audit_log.operation IS 'Tipo de operação: INSERT, UPDATE ou DELETE';
COMMENT ON COLUMN public.audit_log.old_values IS 'Valores antes da operação (NULL para INSERT)';
COMMENT ON COLUMN public.audit_log.new_values IS 'Valores depois da operação (NULL para DELETE)';
COMMENT ON FUNCTION public.audit_trigger_function() IS 'Função genérica de trigger para auditoria automática';
COMMENT ON FUNCTION public.get_record_history(TEXT, UUID, UUID) IS 'Retorna o histórico completo de alterações de um registro específico';

-- =====================================================
-- PARTE 9: VERIFICAÇÃO DE INTEGRIDADE
-- =====================================================

-- Verificar se todos os triggers foram criados
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled
FROM pg_trigger
WHERE tgname LIKE 'audit_%'
ORDER BY tgrelid::regclass::text;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Sistema de auditoria criado com sucesso!';
    RAISE NOTICE '📊 Tabelas auditadas: transactions, accounts, credit_card_invoices, credit_card_transactions, payables, credit_cards, account_balance_adjustments';
    RAISE NOTICE '🔍 Use a função get_record_history(table_name, record_id, user_id) para consultar histórico';
END $$;
