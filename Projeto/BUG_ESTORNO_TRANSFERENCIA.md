# 🐛 BUG: Transferência - Saldo Não Atualizado

**Data**: 26/12/2025 09:04  
**Status**: 🔍 Em Investigação  
**Prioridade**: 🔴 CRÍTICA  
**Atualização**: Problema identificado na **CRIAÇÃO** da transferência, não no estorno!

---

## 📋 DESCRIÇÃO DO PROBLEMA (ATUALIZADA)

### Situação Real:

### Situação Real:

**Transferência criada:**
- **Banco A** (`is_historical = false`): Deveria receber +50 → **NÃO recebeu** ❌
- **Banco B** (`is_historical = true`): Deveria enviar -50 → **Não enviou** ✅ (correto, pois tem bloqueio)

**Estorno da transferência:**
- **Banco A**: Não estornou saldo → **Correto** ✅ (pois não tinha recebido mesmo)
- **Banco B**: Não fez nada → **Correto** ✅ (pois não tinha enviado)

### 🎯 Conclusão:
**O problema NÃO está no estorno, mas sim na CRIAÇÃO da transferência!**

O Banco A deveria ter recebido +50 quando a transferência foi criada, mas isso não aconteceu.

---

## 🔍 NOVA ANÁLISE TÉCNICA

### Fluxo de Criação de Transferência:

1. **Frontend** chama `POST /api/transactions/transfer`
2. **Handler** chama `CreateTransfer(sourceInput, targetInput)`
3. **CreateTransfer** chama `createWithTx()` para cada conta:
   - **Source (Banco B)**: Cria transação de despesa (-50)
   - **Target (Banco A)**: Cria transação de receita (+50)
4. **createWithTx** para cada transação:
   - Verifica se é `is_historical` baseado na conta
   - Se `is_historical = false`, atualiza o saldo
   - Se `is_historical = true`, pula a atualização

### Possíveis Causas:

#### Hipótese 1: `is_historical` Incorreto
O Banco A pode estar sendo marcado como `is_historical = true` incorretamente.

#### Hipótese 2: UPDATE Falhando
O UPDATE pode estar executando mas não afetando nenhuma linha (account_id ou user_id incorreto).

#### Hipótese 3: Transação Rollback
A transação pode estar fazendo rollback por algum erro posterior.


---

## 🔍 ANÁLISE TÉCNICA

### Como Funciona Atualmente:

1. **Criação de Transferência**:
   - Cada transação verifica se é `is_historical` baseado na conta dela
   - Conta A (com ajuste): `is_historical = true` → não afeta saldo ✅
   - Conta B (sem ajuste): `is_historical = false` → afeta saldo ✅

2. **Estorno de Transferência**:
   - O método `Delete()` pega a transação principal
   - Se tem `related_transaction_id`, adiciona à lista de exclusão
   - Chama `deleteWithTx()` para cada transação
   - **Problema**: A lógica de reversão depende do `is_historical` de cada transação

### Código Relevante:

```go
// transaction_repository.go - linha 660
func (r *TransactionRepository) deleteWithTx(ctx context.Context, tx pgx.Tx, id, userID string) error {
    // Busca a transação
    t, err := r.findByIDWithTx(ctx, tx, id, userID)
    
    // Deleta do banco
    deleteQuery := `DELETE FROM transactions WHERE id = $1 AND user_id = $2`
    tx.Exec(ctx, deleteQuery, id, userID)
    
    // Reverte o saldo SOMENTE se is_historical = false
    if !t.IsHistorical {
        balanceChange := t.Amount
        if t.Type == "despesa" {
            balanceChange = -balanceChange
        }
        
        updateBalanceQuery := `
            UPDATE accounts
            SET balance = balance - $1, updated_at = NOW()
            WHERE id = $2 AND user_id = $3
        `
        tx.Exec(ctx, updateBalanceQuery, balanceChange, t.AccountID, userID)
    }
}
```

---

## 🛠️ SOLUÇÃO IMPLEMENTADA

Adicionei **logs de debug detalhados** para identificar o problema:

```go
fmt.Printf("🔍 DELETE DEBUG - Transaction ID: %s\n", id)
fmt.Printf("   Account ID: %s\n", t.AccountID)
fmt.Printf("   Amount: %.2f\n", t.Amount)
fmt.Printf("   Type: %s\n", t.Type)
fmt.Printf("   IsHistorical: %v\n", t.IsHistorical)
fmt.Printf("   RelatedTransactionID: %v\n", t.RelatedTransactionID)

if !t.IsHistorical {
    fmt.Printf("   ✅ REVERTING BALANCE: %.2f\n", balanceChange)
    // ... código de reversão ...
    fmt.Printf("   ✅ Balance reverted successfully\n")
} else {
    fmt.Printf("   ⏭️  SKIPPING balance revert (IsHistorical = true)\n")
}
```

---

## 📝 PRÓXIMOS PASSOS PARA TESTE

### 1. Reiniciar o Backend

```powershell
# Parar o backend atual (Ctrl+C)
# Iniciar novamente
cd backend
.\fincore-api.exe
```

### 2. Reproduzir o Problema

1. **Criar Transferência**:
   - Conta A (com ajuste de saldo) → Conta B (sem ajuste)
   - Valor: R$ 100,00

2. **Estornar a Transferência**:
   - Deletar a transação de transferência
   - **Observar os logs no console do backend**

### 3. Analisar os Logs

Você verá algo assim:

```
🔍 DELETE DEBUG - Transaction ID: abc123
   Account ID: conta-a-id
   Amount: 100.00
   Type: despesa
   IsHistorical: true
   RelatedTransactionID: def456
   ⏭️  SKIPPING balance revert (IsHistorical = true)

🔍 DELETE DEBUG - Transaction ID: def456
   Account ID: conta-b-id
   Amount: 100.00
   Type: receita
   IsHistorical: false
   RelatedTransactionID: abc123
   ✅ REVERTING BALANCE: 100.00 (original amount: 100.00, type: receita)
   ✅ Balance reverted successfully for account conta-b-id
```

---

## 🎯 POSSÍVEIS CAUSAS

### Hipótese 1: `is_historical` Incorreto
- A Conta B pode estar sendo marcada como `is_historical = true` incorretamente
- **Verificar**: Logs mostrarão o valor real

### Hipótese 2: Ordem de Exclusão
- Talvez a transação relacionada não esteja sendo deletada
- **Verificar**: Logs mostrarão se ambas as transações são processadas

### Hipótese 3: Erro no UPDATE
- O UPDATE pode estar falhando silenciosamente
- **Verificar**: Logs mostrarão se há erro

---

## 🔧 CORREÇÃO DEFINITIVA (Após Identificar)

Dependendo do que os logs mostrarem, a correção pode ser:

### Se `is_historical` estiver errado:
```go
// Forçar is_historical = false para transações de transferência
// em contas sem ajuste de saldo
```

### Se a ordem estiver errada:
```go
// Garantir que ambas as transações sejam processadas
// na ordem correta
```

### Se o UPDATE estiver falhando:
```go
// Adicionar tratamento de erro mais robusto
// Verificar se a conta existe
```

---

## 📊 INFORMAÇÕES PARA DEBUG

Por favor, me envie:

1. **Logs completos** do console do backend ao fazer o estorno
2. **IDs das contas** envolvidas (Conta A e Conta B)
3. **Valor da transferência**
4. **Saldo antes e depois** do estorno em ambas as contas

---

## ✅ CHECKLIST DE TESTE

- [ ] Backend recompilado
- [ ] Backend reiniciado
- [ ] Transferência criada
- [ ] Estorno executado
- [ ] Logs coletados
- [ ] Saldos verificados

---

**Aguardando os logs para identificar a causa raiz!** 🔍
