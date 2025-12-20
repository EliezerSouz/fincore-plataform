# 🔍 ANÁLISE: Problema com Lançamentos Retroativos

**Data:** 2025-12-18  
**Prioridade:** 🔴 CRÍTICA  
**Status:** 🔧 EM CORREÇÃO

---

## 📋 PROBLEMA IDENTIFICADO

### Cenário Reproduzido

1. **Criação de Conta:**
   - Usuário cria conta com saldo inicial de R$ 1.000,00
   - Data: 18/12/2025 (hoje)
   
2. **Lançamento Retroativo:**
   - Usuário lança despesa de R$ 500,00
   - Data: 18/11/2025 (30 dias atrás)
   
3. **Resultado Incorreto:**
   - ❌ Saldo atual: R$ 500,00 (deveria ser R$ 1.000,00)
   - ❌ Saldo inicial não foi registrado em `account_balance_adjustments`
   - ❌ Transação retroativa impactou o saldo atual

---

## 🎯 COMPORTAMENTO ESPERADO

### Lógica Correta de Saldos

```
Saldo Inicial (18/12/2025): R$ 1.000,00
  ↓
Transação Retroativa (18/11/2025): -R$ 500,00
  ↓
Saldo em 18/11/2025: R$ 500,00 (histórico)
Saldo em 18/12/2025: R$ 1.000,00 (atual - não afetado)
```

### Regras de Negócio

1. **Saldo Inicial:**
   - Deve ser registrado em `account_balance_adjustments`
   - Tipo: `'initial'`
   - Data: Data de criação da conta
   - `starts_controlled_period = true`

2. **Transações Retroativas:**
   - Data < Data do último ajuste de saldo
   - Devem ser marcadas como `is_historical = true`
   - **NÃO** devem afetar o saldo atual da conta
   - Afetam apenas saldos históricos (para relatórios)

3. **Transações Normais:**
   - Data >= Data do último ajuste de saldo
   - `is_historical = false`
   - Afetam o saldo atual da conta

---

## 🔍 ANÁLISE DO CÓDIGO ATUAL

### ❌ Problema 1: Criação de Conta

**Arquivo:** `account_repository.go` (linha 218-234)

```go
func (r *AccountRepository) Create(...) (*entity.Account, error) {
    query := `
        INSERT INTO accounts (user_id, name, type, balance, ...)
        VALUES ($1::uuid, $2, $3, $4, ...)
        RETURNING ...
    `
    
    // ❌ PROBLEMA: Saldo inicial não é registrado em account_balance_adjustments
    err := r.db.QueryRow(ctx, query, userID, input.Name, input.Type, input.Balance, ...)
    
    return &acc, nil
}
```

**O que está faltando:**
- Não cria registro em `account_balance_adjustments`
- Não define o "ponto de partida" para cálculos retroativos

---

### ❌ Problema 2: Criação de Transação

**Arquivo:** `transaction_repository.go` (linha 187-244)

```go
func (r *TransactionRepository) Create(...) (*entity.Transaction, error) {
    // Insert transaction
    query := `INSERT INTO transactions (...) VALUES (...)`
    
    // ❌ PROBLEMA: Sempre atualiza o saldo atual, independente da data
    updateBalanceQuery := `
        UPDATE accounts
        SET balance = balance + $1, updated_at = NOW()
        WHERE id = $2 AND user_id = $3
    `
    
    _, err = tx.Exec(ctx, updateBalanceQuery, balanceChange, input.AccountID, userID)
    
    return &transaction, nil
}
```

**O que está faltando:**
- Não verifica se a transação é retroativa
- Não marca transação como `is_historical`
- Sempre impacta o saldo atual

---

## ✅ SOLUÇÃO PROPOSTA

### 1. Corrigir Criação de Conta

**Ao criar conta, deve:**

```go
func (r *AccountRepository) Create(...) (*entity.Account, error) {
    tx, _ := r.db.Begin(ctx)
    defer tx.Rollback(ctx)
    
    // 1. Criar a conta
    query := `INSERT INTO accounts (...) VALUES (...) RETURNING ...`
    err := tx.QueryRow(ctx, query, ...).Scan(...)
    
    // 2. ✅ NOVO: Registrar saldo inicial em account_balance_adjustments
    adjustmentQuery := `
        INSERT INTO account_balance_adjustments 
        (account_id, user_id, adjustment_date, balance, type, starts_controlled_period, notes)
        VALUES ($1, $2, CURRENT_DATE, $3, 'initial', true, 'Saldo inicial da conta')
    `
    _, err = tx.Exec(ctx, adjustmentQuery, acc.ID, userID, input.Balance)
    
    tx.Commit(ctx)
    return &acc, nil
}
```

---

### 2. Corrigir Criação de Transação

**Ao criar transação, deve:**

```go
func (r *TransactionRepository) Create(...) (*entity.Transaction, error) {
    tx, _ := r.db.Begin(ctx)
    defer tx.Rollback(ctx)
    
    // 1. Buscar último ajuste de saldo da conta
    var lastAdjustmentDate *time.Time
    adjustmentQuery := `
        SELECT adjustment_date 
        FROM account_balance_adjustments
        WHERE account_id = $1
        ORDER BY adjustment_date DESC
        LIMIT 1
    `
    tx.QueryRow(ctx, adjustmentQuery, input.AccountID).Scan(&lastAdjustmentDate)
    
    // 2. Determinar se é transação retroativa
    transactionDate, _ := time.Parse("2006-01-02", input.Date)
    isHistorical := false
    
    if lastAdjustmentDate != nil && transactionDate.Before(*lastAdjustmentDate) {
        isHistorical = true
    }
    
    // 3. Inserir transação com flag is_historical
    query := `
        INSERT INTO transactions (..., is_historical)
        VALUES (..., $12)
        RETURNING ...
    `
    err = tx.QueryRow(ctx, query, ..., isHistorical).Scan(...)
    
    // 4. ✅ NOVO: Só atualiza saldo se NÃO for histórica
    if !isHistorical {
        balanceChange := input.Amount
        if input.Type == "despesa" {
            balanceChange = -balanceChange
        }
        
        updateBalanceQuery := `
            UPDATE accounts
            SET balance = balance + $1, updated_at = NOW()
            WHERE id = $2 AND user_id = $3
        `
        _, err = tx.Exec(ctx, updateBalanceQuery, balanceChange, input.AccountID, userID)
    }
    
    tx.Commit(ctx)
    return &transaction, nil
}
```

---

### 3. Corrigir Update de Transação

**Ao atualizar transação, deve:**

- Reverter impacto no saldo (se não era histórica)
- Aplicar novo impacto (se não é histórica)
- Recalcular flag `is_historical` se a data mudou

---

### 4. Corrigir Delete de Transação

**Ao deletar transação, deve:**

- Reverter impacto no saldo (se não era histórica)

---

## 📊 IMPACTO DA CORREÇÃO

### Antes ❌

```
Conta criada: R$ 1.000,00 (18/12/2025)
Transação retroativa: -R$ 500,00 (18/11/2025)
Saldo atual: R$ 500,00 ❌ INCORRETO
```

### Depois ✅

```
Conta criada: R$ 1.000,00 (18/12/2025)
  → Registrado em account_balance_adjustments ✅
  
Transação retroativa: -R$ 500,00 (18/11/2025)
  → Marcada como is_historical = true ✅
  → NÃO afeta saldo atual ✅
  
Saldo atual: R$ 1.000,00 ✅ CORRETO
Saldo em 18/11/2025: R$ 500,00 ✅ (histórico)
```

---

## 🧪 CASOS DE TESTE

### Teste 1: Criação de Conta
```
✅ Conta criada com saldo inicial
✅ Registro em account_balance_adjustments
✅ Type = 'initial'
✅ starts_controlled_period = true
```

### Teste 2: Transação Retroativa
```
✅ Data da transação < Data do ajuste
✅ is_historical = true
✅ Saldo atual NÃO alterado
```

### Teste 3: Transação Normal
```
✅ Data da transação >= Data do ajuste
✅ is_historical = false
✅ Saldo atual alterado corretamente
```

### Teste 4: Update de Transação
```
✅ Mudança de data recalcula is_historical
✅ Saldo ajustado corretamente
```

### Teste 5: Delete de Transação
```
✅ Saldo revertido se não era histórica
✅ Saldo não alterado se era histórica
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Atualizar `account_repository.go` - Create
- [ ] Atualizar `transaction_repository.go` - Create
- [ ] Atualizar `transaction_repository.go` - Update
- [ ] Atualizar `transaction_repository.go` - Delete
- [ ] Criar testes unitários
- [ ] Testar manualmente
- [ ] Documentar mudanças
- [ ] Fazer commit

---

## 🚨 ATENÇÃO

Esta é uma **correção crítica** que afeta a integridade dos dados financeiros.

**Dados Existentes:**
- Contas já criadas não terão registro em `account_balance_adjustments`
- Pode ser necessário criar script de migração de dados
- Transações existentes não têm flag `is_historical`

**Recomendação:**
- Implementar correção
- Criar script de migração para dados existentes
- Testar extensivamente antes de deploy

---

> **Próxima Ação:** Implementar correções no código
