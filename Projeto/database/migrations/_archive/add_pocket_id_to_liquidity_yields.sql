-- =====================================================
-- MIGRATION: Adicionar pocket_id à tabela liquidity_yields
-- Data: 26/12/2025
-- Descrição: Permite que yields sejam calculados por pocket
--            em vez de apenas por account
-- =====================================================

BEGIN;

-- 1. Adicionar coluna pocket_id (nullable para compatibilidade)
ALTER TABLE liquidity_yields
ADD COLUMN pocket_id UUID REFERENCES pockets(id) ON DELETE CASCADE;

-- 2. Criar índice para pocket_id
CREATE INDEX idx_liquidity_yields_pocket_id ON liquidity_yields(pocket_id);

-- 3. Atualizar constraint unique para incluir pocket_id
-- Remover constraint antigo
ALTER TABLE liquidity_yields
DROP CONSTRAINT IF EXISTS unique_yield_per_account_date;

-- Adicionar novo constraint que permite yield por account OU por pocket
ALTER TABLE liquidity_yields
ADD CONSTRAINT unique_yield_per_entity_date 
CHECK (
    (account_id IS NOT NULL AND pocket_id IS NULL) OR
    (account_id IS NULL AND pocket_id IS NOT NULL)
);

-- Adicionar constraint de unicidade por pocket/data
ALTER TABLE liquidity_yields
ADD CONSTRAINT unique_yield_per_pocket_date 
UNIQUE (pocket_id, date);

-- 4. Atualizar RLS policy para incluir pockets
DROP POLICY IF EXISTS "Users can view own yields" ON liquidity_yields;

CREATE POLICY "Users can view own yields" ON liquidity_yields FOR SELECT
USING (
    (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid() AND deleted_at IS NULL))
    OR
    (pocket_id IN (SELECT id FROM pockets WHERE user_id = auth.uid() AND deleted_at IS NULL))
);

-- 5. Comentário
COMMENT ON COLUMN liquidity_yields.pocket_id IS 'ID do pocket (subconta) - mutuamente exclusivo com account_id';

COMMIT;

-- =====================================================
-- NOTAS:
-- =====================================================
-- 1. Yields antigos continuam funcionando (account_id)
-- 2. Novos yields podem usar pocket_id
-- 3. Não pode ter ambos (account_id E pocket_id) ao mesmo tempo
-- 4. Deve ter pelo menos um (account_id OU pocket_id)
-- =====================================================
