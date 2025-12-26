# 🚨 BUG CRÍTICO: Saldo dos Pockets Não Atualiza

**Data**: 26/12/2025 12:22  
**Severidade**: 🔴 CRÍTICA  
**Status**: 🔍 IDENTIFICADO

---

## 🐛 PROBLEMA

**Transações não estão atualizando o saldo dos pockets!**

Quando uma transação é criada/editada/deletada, o código atualiza o saldo da **account** (conta mãe), mas **NÃO atualiza o saldo do pocket** (subconta).

---

## 📍 ONDE ESTÁ O PROBLEMA

### Arquivo: `transaction_repository.go`

**Método `createWithTx` (linha ~350-380):**
```go
// Atualiza APENAS accounts, não pockets!
updateBalanceQuery := `
    UPDATE accounts
    SET balance = balance + $1, updated_at = NOW()
    WHERE id = $2 AND user_id = $3
`
```

**Métodos afetados:**
1. ✅ `createWithTx` - Criação de transação
2. ✅ `updateWithTx` - Edição de transação  
3. ✅ `deleteWithTx` - Exclusão de transação
4. ✅ `CreateTransfer` - Transferências

---

## 🎯 SOLUÇÃO NECESSÁRIA

### Precisamos atualizar AMBOS:

1. **Account** (conta mãe) - já funciona
2. **Pocket** (subconta) - **NÃO funciona** ❌

### Lógica:

```
Transação → Account → Pocket específico
```

**Problema**: Não sabemos qual pocket atualizar!

---

## 💡 ABORDAGENS POSSÍVEIS

### **Opção 1: Adicionar `pocket_id` nas Transações** ⭐ RECOMENDADO

**Vantagem**: Precisão total  
**Desvantagem**: Requer migration

```sql
ALTER TABLE transactions 
ADD COLUMN pocket_id UUID REFERENCES pockets(id);
```

Depois, ao criar transação, especificar o pocket:
```go
input.PocketID // ID do pocket específico
```

---

### **Opção 2: Recalcular Saldo Dinamicamente**

**Vantagem**: Não precisa migration  
**Desvantagem**: Mais lento, menos preciso

Calcular saldo do pocket baseado em:
- Saldo inicial
- Soma de transações da account
- Yields do pocket

---

### **Opção 3: Atualizar Todos os Pockets da Account**

**Vantagem**: Simples  
**Desvantagem**: Impreciso (não sabe qual pocket)

```go
// Atualizar proporcionalmente todos os pockets?
// Não faz sentido!
```

---

## 🎯 RECOMENDAÇÃO

### **Implementar Opção 1: Adicionar `pocket_id`**

**Passos:**

1. **Migration**: Adicionar `pocket_id` em `transactions`
2. **Backend**: Modificar `CreateTransactionInput` para incluir `pocket_id`
3. **Repository**: Atualizar saldo do pocket em vez da account
4. **Frontend**: Permitir seleção de pocket ao criar transação

---

## 📊 IMPACTO

**Atual (ERRADO):**
```
Transação R$ 100 → Account +R$ 100 ✅
                 → Pocket   R$ 0   ❌
```

**Esperado (CORRETO):**
```
Transação R$ 100 → Account +R$ 100 ✅
                 → Pocket  +R$ 100 ✅
```

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Criar migration para adicionar `pocket_id`
2. ✅ Atualizar entidade `Transaction`
3. ✅ Modificar `createWithTx` para atualizar pocket
4. ✅ Modificar `updateWithTx` para atualizar pocket
5. ✅ Modificar `deleteWithTx` para atualizar pocket
6. ✅ Atualizar frontend para selecionar pocket

---

**Quer que eu implemente a correção agora?** 🤔

Vou adicionar `pocket_id` nas transações e fazer tudo funcionar corretamente!
