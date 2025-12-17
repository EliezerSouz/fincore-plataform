-- Garante a criação da Foreign Key entre transactions e payment_methods
-- Sem isso, o Supabase não permite fazer o 'join' na consulta (select ... payment_methods(name))

DO $$ 
BEGIN 
  -- Remove se existir (para garantir que recriamos certo)
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'transactions_payment_method_id_fkey') THEN
    ALTER TABLE transactions DROP CONSTRAINT transactions_payment_method_id_fkey;
  END IF;

  -- Adiciona a FK
  ALTER TABLE transactions 
  ADD CONSTRAINT transactions_payment_method_id_fkey 
  FOREIGN KEY (payment_method_id) 
  REFERENCES payment_methods(id) 
  ON DELETE SET NULL; 
  
END $$;

-- Recarregar schema cache (opcional, mas o supabase faz auto)
NOTIFY pgrst, 'reload config';
