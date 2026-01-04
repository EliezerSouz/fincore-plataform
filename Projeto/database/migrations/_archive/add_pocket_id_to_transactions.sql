-- Migration: Adicionar pocket_id em transactions
-- Data: 26/12/2025
-- Objetivo: Permitir que transações atualizem o saldo do pocket específico

-- 1. Adicionar coluna pocket_id
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS pocket_id UUID REFERENCES pockets(id) ON DELETE SET NULL;

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_transactions_pocket_id ON transactions(pocket_id);

-- 3. Comentário
COMMENT ON COLUMN transactions.pocket_id IS 'ID do pocket (subconta) ao qual esta transação pertence. Se NULL, afeta apenas a account principal.';

-- 4. Atualizar RLS policy para incluir pocket_id
DROP POLICY IF EXISTS transactions_policy ON transactions;

CREATE POLICY transactions_policy ON transactions
    FOR ALL
    USING (
        user_id = current_setting('app.current_user_id', true)::uuid
        OR EXISTS (
            SELECT 1 FROM accounts 
            WHERE accounts.id = transactions.account_id 
            AND accounts.user_id = current_setting('app.current_user_id', true)::uuid
        )
        OR EXISTS (
            SELECT 1 FROM pockets
            WHERE pockets.id = transactions.pocket_id
            AND pockets.user_id = current_setting('app.current_user_id', true)::uuid
        )
    )
    WITH CHECK (
        user_id = current_setting('app.current_user_id', true)::uuid
        OR EXISTS (
            SELECT 1 FROM accounts 
            WHERE accounts.id = transactions.account_id 
            AND accounts.user_id = current_setting('app.current_user_id', true)::uuid
        )
        OR EXISTS (
            SELECT 1 FROM pockets
            WHERE pockets.id = transactions.pocket_id
            AND pockets.user_id = current_setting('app.current_user_id', true)::uuid
        )
    );

-- Sucesso!
SELECT 'Migration concluída: pocket_id adicionado em transactions' AS status;
