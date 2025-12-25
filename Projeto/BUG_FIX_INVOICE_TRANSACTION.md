# 🔧 CORREÇÃO DO BUG #1: Erro ao Criar Transação em Fatura de Cartão

**Data**: 24/12/2025  
**Prioridade**: CRÍTICA  
**Status**: EM INVESTIGAÇÃO

---

## 🐛 PROBLEMA IDENTIFICADO

**Erro**: HTTP 400 (Bad Request) ao tentar criar transação em fatura de cartão  
**Endpoint**: `POST /api/invoices/transactions`  
**Impacto**: Impossibilita o uso completo do módulo de cartões de crédito

---

## 🔍 INVESTIGAÇÃO

### Dados Enviados pelo Frontend (Corretos):
```json
{
  "credit_card_id": "7074bdb6-6f36-47df-a2eb-229443b9d9d5",
  "description": "Teste Compra Cartão",
  "amount": 250.00,
  "transaction_date": "2025-12-24T12:00:00.000Z",
  "category_id": null,
  "subcategory_id": null,
  "notes": null,
  "installments": 1,
  "start_installment": 1,
  "installment_value": undefined
}
```

### Estrutura Esperada pelo Backend:
```go
type CreateCreditCardTransactionInput struct {
    CreditCardID     string    `json:"credit_card_id" binding:"required"`
    Description      string    `json:"description" binding:"required"`
    Amount           float64   `json:"amount" binding:"required,gt=0"`
    TransactionDate  time.Time `json:"transaction_date" binding:"required"`
    CategoryID       *string   `json:"category_id"`
    SubcategoryID    *string   `json:"subcategory_id"`
    Notes            *string   `json:"notes"`
    Installments     int       `json:"installments"`
    StartInstallment int       `json:"start_installment"`
    InstallmentValue *float64  `json:"installment_value"`
}
```

### Possíveis Causas:

1. ✅ **AuthBypass configurado corretamente** (user_id sendo injetado)
2. ✅ **Endpoint registrado** (`POST /api/invoices/transactions`)
3. ✅ **Handler existe** (`InvoiceHandler.CreateTransaction`)
4. ❓ **Validação de binding** pode estar falhando
5. ❓ **Campos null/undefined** podem estar causando problema

---

## 🔧 SOLUÇÃO PROPOSTA

### Opção 1: Adicionar Logs de Debug

Adicionar logs no handler para identificar exatamente onde está falhando:

```go
func (h *InvoiceHandler) CreateTransaction(c *gin.Context) {
    userIDStr, exists := c.Get("user_id")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }
    userID := userIDStr.(string)
    
    // LOG: Ver o que está chegando
    bodyBytes, _ := c.GetRawData()
    log.Printf("DEBUG: Request body: %s", string(bodyBytes))
    c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

    var input entity.CreateCreditCardTransactionInput
    if err := c.ShouldBindJSON(&input); err != nil {
        log.Printf("DEBUG: Binding error: %v", err)  // <-- ADICIONAR
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    log.Printf("DEBUG: Input parsed: %+v", input)  // <-- ADICIONAR

    if err := h.Service.CreateTransaction(c.Request.Context(), input, userID); err != nil {
        log.Printf("DEBUG: Service error: %v", err)  // <-- ADICIONAR
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusCreated, gin.H{"status": "success"})
}
```

### Opção 2: Corrigir Frontend (Remover undefined)

O problema pode ser o `installment_value: undefined` que o JavaScript envia. Corrigir no frontend:

```typescript
// Linha 273-284 em actions.ts
await client.post('/api/invoices/transactions', {
    credit_card_id: cardId,
    description,
    amount,
    transaction_date: date,
    category_id: categoryId,
    subcategory_id: subcategoryId,
    notes,
    installments,
    start_installment: startingInstallment,
    ...(installmentValue && { installment_value: installmentValue })  // <-- CORRIGIR
})
```

### Opção 3: Tornar Backend Mais Tolerante

Modificar o binding para aceitar valores null/undefined:

```go
// Remover validação "required" de campos opcionais
type CreateCreditCardTransactionInput struct {
    CreditCardID     string    `json:"credit_card_id" binding:"required"`
    Description      string    `json:"description" binding:"required"`
    Amount           float64   `json:"amount" binding:"required,gt=0"`
    TransactionDate  time.Time `json:"transaction_date" binding:"required"`
    CategoryID       *string   `json:"category_id"`
    SubcategoryID    *string   `json:"subcategory_id"`
    Notes            *string   `json:"notes"`
    Installments     int       `json:"installments"`      // Sem binding:required
    StartInstallment int       `json:"start_installment"` // Sem binding:required
    InstallmentValue *float64  `json:"installment_value"`
}
```

---

## 📋 PRÓXIMOS PASSOS

1. **Adicionar logs de debug** no handler (Opção 1)
2. **Reiniciar backend** e testar novamente
3. **Verificar logs** para identificar erro exato
4. **Aplicar correção** baseada no erro encontrado
5. **Testar** criação de transação
6. **Remover logs de debug** após correção
7. **Atualizar relatório de testes**

---

## ✅ CHECKLIST

- [ ] Adicionar logs de debug no handler
- [ ] Reiniciar backend
- [ ] Testar endpoint via API direta
- [ ] Identificar erro exato
- [ ] Aplicar correção
- [ ] Testar via frontend
- [ ] Remover logs de debug
- [ ] Atualizar documentação
- [ ] Marcar bug como resolvido

---

**Investigado por**: Antigravity AI  
**Próxima Ação**: Adicionar logs e reiniciar backend
