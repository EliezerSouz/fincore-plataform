-- Cria a Foreign Key para permitir o join entre transactions e payment_methods
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'transactions_payment_method_id_fkey') THEN 
    ALTER TABLE transactions 
    ADD CONSTRAINT transactions_payment_method_id_fkey 
    FOREIGN KEY (payment_method_id) 
    REFERENCES payment_methods(id) 
    ON DELETE SET NULL; 
  END IF; 
END $$;
