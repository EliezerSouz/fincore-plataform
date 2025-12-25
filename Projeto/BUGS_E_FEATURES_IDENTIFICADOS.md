# 🐛 BUGS IDENTIFICADOS - TESTE E2E AVANÇADO

**Data**: 24/12/2025  
**Status**: 🔴 BUGS CRÍTICOS ENCONTRADOS

---

## 🔴 BUG CRÍTICO #1: Exclusão de Categoria com Subcategoria

### Problema:
O sistema está permitindo excluir categorias que possuem subcategorias vinculadas, violando regra de negócio fundamental.

### Comportamento Esperado:
- Tentar excluir categoria com subcategorias → **BLOQUEADO**
- Mensagem de erro clara: "Não é possível excluir categoria com subcategorias vinculadas"

### Comportamento Atual:
- Exclusão é permitida ✅
- Subcategorias são excluídas em cascata (provavelmente)
- Nenhuma validação é feita

### Causa Raiz:
**Arquivo**: `backend/internal/infra/repository/category_repository.go`  
**Linha**: 164-175

```go
func (r *CategoryRepository) Delete(ctx context.Context, id, userID string) error {
    // HOTFIX: Allow deleting system categories for testing
    query := `DELETE FROM categories WHERE id = $1 AND user_id = $2::uuid`
    cmdTag, err := r.db.Exec(ctx, query, id, userID)
    // ... sem validação de subcategorias
}
```

### Solução Proposta:

```go
func (r *CategoryRepository) Delete(ctx context.Context, id, userID string) error {
    // 1. Verificar se há subcategorias
    var count int
    checkQuery := `
        SELECT COUNT(*)
        FROM subcategories
        WHERE category_id = $1 AND user_id = $2::uuid
    `
    err := r.db.QueryRow(ctx, checkQuery, id, userID).Scan(&count)
    if err != nil {
        return fmt.Errorf("failed to check subcategories: %w", err)
    }
    
    if count > 0 {
        return fmt.Errorf("não é possível excluir categoria com %d subcategoria(s) vinculada(s)", count)
    }
    
    // 2. Verificar se há transações usando esta categoria
    var txCount int
    txCheckQuery := `
        SELECT COUNT(*)
        FROM transactions
        WHERE category_id = $1 AND deleted_at IS NULL
    `
    err = r.db.QueryRow(ctx, txCheckQuery, id).Scan(&txCount)
    if err != nil {
        return fmt.Errorf("failed to check transactions: %w", err)
    }
    
    if txCount > 0 {
        return fmt.Errorf("não é possível excluir categoria com %d transação(ões) vinculada(s)", txCount)
    }
    
    // 3. Prosseguir com exclusão
    query := `DELETE FROM categories WHERE id = $1 AND user_id = $2::uuid`
    cmdTag, err := r.db.Exec(ctx, query, id, userID)
    if err != nil {
        return fmt.Errorf("failed to delete category: %w", err)
    }
    if cmdTag.RowsAffected() == 0 {
        return fmt.Errorf("category not found or unauthorized")
    }
    return nil
}
```

### Prioridade: 🔴 CRÍTICA
### Impacto: ALTO - Perda de dados, inconsistência
### Esforço: 1-2 horas

---

## ⚠️ FEATURE FALTANTE #1: Pagamento Parcial de Contas a Pagar

### Requisito do Usuário:
> "precisamos do teste de contas a pagar parcial, pra termos uma forma de pagar só parcial, nao sei se é interessantes gerar uma nova ou ter o lançamento lançado em transação como pagamento parcial e manter uma unica contas a pagar com o que falta"

### Análise de Opções:

#### Opção 1: Manter Única Conta a Pagar (Recomendado)
**Vantagens**:
- Histórico completo em um único lugar
- Rastreabilidade total de pagamentos parciais
- Saldo devedor sempre visível
- Alinhado com sistemas financeiros reais

**Implementação**:
```go
type Payable struct {
    // ... campos existentes
    OriginalAmount  float64  `json:"original_amount"`  // Valor original
    PaidAmount      float64  `json:"paid_amount"`      // Total já pago
    RemainingAmount float64  `json:"remaining_amount"` // Saldo devedor
    IsPaid          bool     `json:"is_paid"`          // true quando remaining = 0
    PaymentHistory  []Payment `json:"payment_history"` // Histórico de pagamentos
}

type Payment struct {
    ID          string    `json:"id"`
    PayableID   string    `json:"payable_id"`
    Amount      float64   `json:"amount"`
    Date        time.Time `json:"date"`
    AccountID   string    `json:"account_id"`
    CreatedAt   time.Time `json:"created_at"`
}
```

**Fluxo**:
1. Criar conta a pagar: R$ 500,00
2. Pagar parcial: R$ 200,00 → `paid_amount = 200`, `remaining = 300`
3. Pagar parcial: R$ 150,00 → `paid_amount = 350`, `remaining = 150`
4. Pagar final: R$ 150,00 → `paid_amount = 500`, `remaining = 0`, `is_paid = true`

#### Opção 2: Criar Nova Conta a Pagar
**Desvantagens**:
- Histórico fragmentado
- Difícil rastrear origem
- Pode gerar confusão

### Recomendação: **Opção 1**

### Teste E2E Proposto:

```powershell
# Criar conta a pagar de R$ 500,00
$payablePayload = @{
    description = "ALUGUEL"
    amount = 500.00
    due_date = "2025-12-25T00:00:00Z"
    recurrence_strategy = "single"
}

# Pagamento parcial #1: R$ 200,00
$partialPayment1 = @{
    account_id = $accountId
    date = "2025-12-20T00:00:00Z"
    amount = 200.00  # Parcial
}
# Validar: paid_amount = 200, remaining = 300, is_paid = false

# Pagamento parcial #2: R$ 150,00
$partialPayment2 = @{
    account_id = $accountId
    date = "2025-12-22T00:00:00Z"
    amount = 150.00  # Parcial
}
# Validar: paid_amount = 350, remaining = 150, is_paid = false

# Pagamento final: R$ 150,00
$finalPayment = @{
    account_id = $accountId
    date = "2025-12-24T00:00:00Z"
    amount = 150.00  # Completa
}
# Validar: paid_amount = 500, remaining = 0, is_paid = true

# Estorno de pagamento parcial
# Deve reverter apenas o pagamento específico
# remaining volta para o valor anterior
```

### Prioridade: 🟡 ALTA
### Impacto: MÉDIO - Feature importante para usabilidade
### Esforço: 4-6 horas

---

## 📊 RESUMO

### Bugs Críticos: 1
- ❌ Exclusão de categoria com subcategoria

### Features Faltantes: 1
- ⚠️ Pagamento parcial de contas a pagar

### Próximos Passos:
1. **Imediato**: Corrigir bug de exclusão de categoria
2. **Curto Prazo**: Implementar pagamento parcial
3. **Médio Prazo**: Testes E2E completos de ambos

---

**Documentado por**: Antigravity AI  
**Data**: 24/12/2025 21:25
