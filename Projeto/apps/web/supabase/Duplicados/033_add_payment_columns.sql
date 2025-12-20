
-- Adiciona colunas para rastreamento de pagamento na tabela payables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payables' AND column_name = 'paid_at') THEN
        ALTER TABLE payables ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payables' AND column_name = 'transaction_id') THEN
        ALTER TABLE payables ADD COLUMN transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;
    END IF;
END $$;
