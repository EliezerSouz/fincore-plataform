# 🔄 GUIA: Migração de Transferências Existentes

**Data**: 26/12/2025  
**Objetivo**: Corrigir tipo de transferências que estão marcadas como 'receita' ou 'despesa'

---

## 📋 PROBLEMA

Transferências criadas antes da implementação do tipo `'transferencia'` estão marcadas como:
- `type = 'receita'` (transação de entrada)
- `type = 'despesa'` (transação de saída)

Isso causa:
- ❌ Transferências aparecem em relatórios de receitas/despesas
- ❌ Saldo total incorreto
- ❌ Filtros não funcionam corretamente

---

## ✅ SOLUÇÃO

Executar script de migração que:
1. Identifica transferências (transações com `related_transaction_id`)
2. Atualiza tipo para `'transferencia'`
3. Mantém saldos inalterados (já estão corretos)

---

## 🛠️ OPÇÕES DE EXECUÇÃO

### **Opção A: Script Go (Recomendado)** ⭐

**Vantagens:**
- ✅ Interativo (pede confirmação)
- ✅ Mostra progresso
- ✅ Validação automática
- ✅ Mais seguro

**Como executar:**

```powershell
# 1. Ir para a pasta do backend
cd f:\Antigravity\FinCore\Projeto\backend

# 2. Executar o script
go run migrate_transferencias.go
```

**O que vai acontecer:**
```
🔄 MIGRAÇÃO: Corrigir Tipo de Transferências
==================================================

📊 Verificando transferências existentes...
   Total de transferências: 10
   ❌ Marcadas como receita: 5
   ❌ Marcadas como despesa: 5
   ✅ Já corretas: 0

⚠️  Será necessário atualizar 10 transações.
   Deseja continuar? (s/N): s

🔄 Executando migração...
   ✅ 10 transações atualizadas

✅ Migração concluída com sucesso!

📊 Verificando resultado...
   Total de transferências: 10
   ❌ Marcadas como receita: 0
   ❌ Marcadas como despesa: 0
   ✅ Corretas: 10

📋 Últimas transferências atualizadas:
   - Transferência para Banco 04: R$ 50.00 (05/12/2025) - transferencia
   - Transferência de Banco 01: R$ 50.00 (05/12/2025) - transferencia
   ...

🎉 Migração concluída!
```

---

### **Opção B: SQL Direto**

**Vantagens:**
- ✅ Mais rápido
- ✅ Pode executar no Supabase Dashboard

**Como executar:**

1. Abra o Supabase Dashboard
2. Vá em SQL Editor
3. Cole o conteúdo de `database/migrations/migrate_transferencias_tipo.sql`
4. Execute

**Ou via psql:**
```bash
psql $DATABASE_URL -f database/migrations/migrate_transferencias_tipo.sql
```

---

## ⚠️ IMPORTANTE

### **Antes de Executar:**

1. ✅ **Backup**: O script cria backup automático (opcional)
2. ✅ **Teste**: Execute primeiro em ambiente de desenvolvimento
3. ✅ **Horário**: Execute em horário de baixo uso

### **Após Executar:**

1. ✅ **Verificar**: Confira que transferências estão com tipo correto
2. ✅ **Testar**: Crie uma nova transferência para validar
3. ✅ **Relatórios**: Verifique que relatórios estão corretos

### **Saldos:**

- ✅ **NÃO é necessário recalcular saldos**
- ✅ Os saldos já estão corretos
- ✅ A migração apenas muda o `type`, não afeta saldos

---

## 🧪 VALIDAÇÃO

### Verificar se migração funcionou:

```sql
-- Contar transferências por tipo
SELECT 
    type,
    COUNT(*) as total
FROM transactions
WHERE related_transaction_id IS NOT NULL
  AND deleted_at IS NULL
GROUP BY type;
```

**Resultado esperado:**
```
type          | total
--------------|------
transferencia | 10
```

### Verificar transferências específicas:

```sql
-- Buscar transferências recentes
SELECT 
    id,
    description,
    amount,
    type,
    date,
    related_transaction_id
FROM transactions
WHERE related_transaction_id IS NOT NULL
  AND deleted_at IS NULL
ORDER BY date DESC
LIMIT 10;
```

---

## 🔄 REVERTER (Se Necessário)

Se precisar reverter a migração:

```sql
UPDATE transactions
SET type = CASE 
    WHEN description ILIKE '%para%' THEN 'despesa'
    WHEN description ILIKE '%de%' THEN 'receita'
    ELSE type
END,
updated_at = NOW()
WHERE related_transaction_id IS NOT NULL
  AND type = 'transferencia';
```

**⚠️ Atenção**: Isso vai quebrar a nova lógica! Só reverta se realmente necessário.

---

## 📊 IMPACTO

### Antes da Migração:
- ❌ 10 transferências marcadas como receita/despesa
- ❌ Relatórios incorretos
- ❌ Saldo total errado

### Depois da Migração:
- ✅ 10 transferências marcadas como transferencia
- ✅ Relatórios corretos
- ✅ Saldo total correto
- ✅ Filtros funcionando

---

## 🎯 PRÓXIMOS PASSOS

1. **Execute a migração** (Opção A ou B)
2. **Verifique o resultado** (queries de validação)
3. **Teste o sistema** (crie nova transferência)
4. **Reinicie o backend** (para garantir)

---

## 📞 SUPORTE

Se encontrar problemas:

1. **Verifique os logs** do script
2. **Confira o banco** com as queries de validação
3. **Reverta se necessário** (script de reversão acima)

---

**Pronto para executar!** 🚀

Recomendação: Use a **Opção A (Script Go)** para maior segurança e feedback visual.
