# 🚀 GUIA RÁPIDO - APLICAR ATUALIZAÇÃO

## ⚠️ ERRO ATUAL

```
{code: "42501", details: Null, hint: ..., message: ...}
```

**Causa:** Faltam as policies de RLS (Row Level Security) na tabela `payment_methods`.

---

## ✅ SOLUÇÃO

### Opção 1: Script Consolidado (RECOMENDADO)

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo do arquivo:
   ```
   supabase/migrations/APPLY_PAYMENT_METHODS_UPDATE.sql
   ```
4. Clique em **Run**
5. Aguarde a confirmação de sucesso

---

### Opção 2: Migrations Individuais

Execute na ordem:

#### 1️⃣ Adicionar Campos
```sql
-- Arquivo: 20250118_payment_methods_flags.sql
```

#### 2️⃣ Adicionar Policies
```sql
-- Arquivo: 20250118_payment_methods_policies.sql
```

---

## 🔍 VERIFICAÇÃO

Após executar, rode este comando para verificar:

```sql
-- Verificar se as policies foram criadas
SELECT 
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'payment_methods';
```

**Resultado esperado:**
```
policyname                                    | cmd
----------------------------------------------|--------
Users can view their own payment methods      | SELECT
Users can insert their own payment methods    | INSERT
Users can update their own payment methods    | UPDATE
Users can delete their own payment methods    | DELETE
```

---

## 🧪 TESTAR

1. Acesse `/sistema/payment-methods`
2. Clique em **Nova Modalidade**
3. Preencha os dados:
   - Nome: `Teste PIX`
   - Slug: `teste_pix`
   - Marque: Receitas ✅, Despesas ✅
4. Clique em **Criar Modalidade**
5. ✅ Deve salvar com sucesso

---

## 🔧 SE AINDA DER ERRO

### Verificar se a tabela existe
```sql
SELECT * FROM payment_methods LIMIT 1;
```

### Verificar se o RLS está ativo
```sql
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'payment_methods';
```

### Verificar se user_id existe
```sql
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'payment_methods'
  AND column_name = 'user_id';
```

---

## 📞 TROUBLESHOOTING

### Erro: "column user_id does not exist"

**Solução:**
```sql
ALTER TABLE payment_methods
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Atualizar registros existentes
UPDATE payment_methods
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;

-- Tornar obrigatório
ALTER TABLE payment_methods
ALTER COLUMN user_id SET NOT NULL;
```

### Erro: "permission denied for table payment_methods"

**Solução:**
```sql
-- Garantir que o RLS está ativo
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Recriar policies
-- (copie do arquivo APPLY_PAYMENT_METHODS_UPDATE.sql)
```

---

## ✅ CHECKLIST

- [ ] Executei o script SQL no Supabase
- [ ] Verifiquei que as policies foram criadas
- [ ] Testei criar uma nova modalidade
- [ ] Testei editar uma modalidade existente
- [ ] Testei deletar uma modalidade
- [ ] Todas as operações funcionam ✅

---

## 🎯 APÓS APLICAR

Você poderá:
- ✅ Criar novas formas de pagamento
- ✅ Editar formas existentes
- ✅ Deletar formas de pagamento
- ✅ Configurar todos os contextos e comportamentos
- ✅ Sistema funcionando 100%

---

**Tempo estimado:** 2-5 minutos  
**Dificuldade:** ⭐ Fácil  
**Impacto:** 🚀 Crítico
