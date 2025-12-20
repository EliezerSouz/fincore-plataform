-- Tabela de Cartões de Crédito
CREATE TABLE IF NOT EXISTS public.credit_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT 'other', -- visa, master, amex, elo, hipercentard, other
    last_4_digits TEXT,
    limit_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    closing_day INTEGER NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    color TEXT DEFAULT '#0f172a',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (apenas dono vê/edita)
DROP POLICY IF EXISTS "Users can view own cards" ON public.credit_cards;
CREATE POLICY "Users can view own cards" ON public.credit_cards
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own cards" ON public.credit_cards;
CREATE POLICY "Users can insert own cards" ON public.credit_cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cards" ON public.credit_cards;
CREATE POLICY "Users can update own cards" ON public.credit_cards
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own cards" ON public.credit_cards;
CREATE POLICY "Users can delete own cards" ON public.credit_cards
    FOR DELETE USING (auth.uid() = user_id);


-- Atualizar Transações para suportar Cartão e Parcelamento
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'credit_card_id') THEN
        ALTER TABLE public.transactions 
        ADD COLUMN credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'installment_number') THEN
        ALTER TABLE public.transactions 
        ADD COLUMN installment_number INTEGER; -- Se null, é à vista
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'total_installments') THEN
        ALTER TABLE public.transactions 
        ADD COLUMN total_installments INTEGER;
    END IF;
END $$;
