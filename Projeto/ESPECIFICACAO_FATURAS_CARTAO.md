# 🏦 ESPECIFICAÇÃO TÉCNICA - CICLO DE VIDA DE FATURAS

**Sistema**: FinCore  
**Módulo**: Cartões de Crédito e Faturas  
**Data**: 24/12/2025  
**Versão**: 1.0  
**Status**: 📋 ESPECIFICAÇÃO COMPLETA

---

## 🎯 OBJETIVO

Definir regras completas, obrigatórias e auditáveis para todo o ciclo de vida de faturas de cartão de crédito, garantindo comportamento equivalente a um banco digital real.

---

## 📊 MODELO DE DADOS

### Entidades Principais:

#### 1. CreditCard
```go
type CreditCard struct {
    ID              string    `json:"id"`
    UserID          string    `json:"user_id"`
    AccountID       string    `json:"account_id"`        // Conta vinculada para pagamento
    Name            string    `json:"name"`
    Brand           string    `json:"brand"`             // visa, mastercard, etc
    LastDigits      string    `json:"last_digits"`
    CreditLimit     float64   `json:"credit_limit"`
    AvailableLimit  float64   `json:"available_limit"`   // Calculado dinamicamente
    ClosingDay      int       `json:"closing_day"`       // Dia do fechamento (1-31)
    DueDay          int       `json:"due_day"`           // Dia do vencimento (1-31)
    IsActive        bool      `json:"is_active"`
    CreatedAt       time.Time `json:"created_at"`
    UpdatedAt       time.Time `json:"updated_at"`
}
```

#### 2. Invoice (Fatura)
```go
type InvoiceStatus string

const (
    InvoiceStatusOpen      InvoiceStatus = "ABERTA"
    InvoiceStatusClosed    InvoiceStatus = "FECHADA"
    InvoiceStatusPaid      InvoiceStatus = "QUITADA"
    InvoiceStatusOverdue   InvoiceStatus = "VENCIDA"
    InvoiceStatusReverted  InvoiceStatus = "ESTORNADA"
)

type Invoice struct {
    ID                  string        `json:"id"`
    UserID              string        `json:"user_id"`
    CreditCardID        string        `json:"credit_card_id"`
    ReferenceMonth      int           `json:"reference_month"`    // 1-12
    ReferenceYear       int           `json:"reference_year"`
    ClosingDate         time.Time     `json:"closing_date"`
    DueDate             time.Time     `json:"due_date"`
    Status              InvoiceStatus `json:"status"`
    
    // Valores
    TotalAmount         float64       `json:"total_amount"`       // Soma de lançamentos
    PaidAmount          float64       `json:"paid_amount"`        // Total já pago
    RemainingAmount     float64       `json:"remaining_amount"`   // total - paid
    
    // Créditos
    InheritedCredit     float64       `json:"inherited_credit"`   // Crédito de fatura anterior
    GeneratedCredit     float64       `json:"generated_credit"`   // Crédito gerado nesta fatura
    
    CreatedAt           time.Time     `json:"created_at"`
    UpdatedAt           time.Time     `json:"updated_at"`
}
```

#### 3. Transaction (Lançamento)
```go
type Transaction struct {
    ID                  string    `json:"id"`
    UserID              string    `json:"user_id"`
    CreditCardID        string    `json:"credit_card_id"`
    InvoiceID           string    `json:"invoice_id"`
    Description         string    `json:"description"`
    Amount              float64   `json:"amount"`
    TransactionDate     time.Time `json:"transaction_date"`
    
    // Parcelamento
    IsInstallment       bool      `json:"is_installment"`
    InstallmentNumber   *int      `json:"installment_number"`
    TotalInstallments   *int      `json:"total_installments"`
    GroupID             *string   `json:"group_id"`              // Agrupa parcelas
    
    // Categorização
    CategoryID          *string   `json:"category_id"`
    SubcategoryID       *string   `json:"subcategory_id"`
    
    // Controle
    CanEdit             bool      `json:"can_edit"`              // Calculado: fatura ABERTA
    CanDelete           bool      `json:"can_delete"`            // Calculado: fatura ABERTA
    
    Notes               *string   `json:"notes"`
    CreatedAt           time.Time `json:"created_at"`
    UpdatedAt           time.Time `json:"updated_at"`
    DeletedAt           *time.Time `json:"deleted_at"`
}
```

#### 4. FinancialEvent (Evento Financeiro)
```go
type EventType string

const (
    EventTypeTransaction       EventType = "LANCAMENTO_CARTAO"
    EventTypePayment          EventType = "PAGAMENTO_FATURA"
    EventTypeAdvancedPayment  EventType = "PAGAMENTO_ANTECIPADO"
    EventTypeCredit           EventType = "CREDITO_ANTECIPADO"
    EventTypeReversal         EventType = "ESTORNO"
)

type FinancialEvent struct {
    ID              string    `json:"id"`
    UserID          string    `json:"user_id"`
    Type            EventType `json:"type"`
    InvoiceID       string    `json:"invoice_id"`
    Amount          float64   `json:"amount"`
    
    // Rastreabilidade
    OriginInvoiceID *string   `json:"origin_invoice_id"`     // Para créditos
    RelatedEventID  *string   `json:"related_event_id"`      // Para estornos
    
    // Impacto
    AccountID       *string   `json:"account_id"`            // Conta impactada
    BalanceImpact   float64   `json:"balance_impact"`        // Impacto no saldo
    
    Notes           *string   `json:"notes"`
    CreatedAt       time.Time `json:"created_at"`
    RevertedAt      *time.Time `json:"reverted_at"`
}
```

#### 5. Credit (Crédito Antecipado)
```go
type Credit struct {
    ID                  string    `json:"id"`
    UserID              string    `json:"user_id"`
    OriginInvoiceID     string    `json:"origin_invoice_id"`     // Fatura que gerou
    CurrentInvoiceID    *string   `json:"current_invoice_id"`    // Fatura atual
    OriginalAmount      float64   `json:"original_amount"`
    RemainingAmount     float64   `json:"remaining_amount"`
    IsConsumed          bool      `json:"is_consumed"`           // remaining = 0
    CreatedAt           time.Time `json:"created_at"`
    UpdatedAt           time.Time `json:"updated_at"`
}
```

---

## 🔁 REGRAS DE NEGÓCIO

### 1️⃣ LANÇAMENTO EM CARTÃO

#### Regras:
```
PERMITIDO SE:
- Fatura.Status = ABERTA
- CreditCard.IsActive = true
- Amount > 0

AO LANÇAR:
1. Criar Transaction
2. Atualizar Invoice.TotalAmount += Amount
3. Atualizar Invoice.RemainingAmount = TotalAmount - PaidAmount
4. Atualizar CreditCard.AvailableLimit -= Amount
5. Criar FinancialEvent(LANCAMENTO_CARTAO)

PROIBIDO SE:
- Fatura.Status IN (QUITADA, ESTORNADA)
- CreditCard.AvailableLimit < Amount
```

#### Validações:
- ✅ Data do lançamento define fatura correta
- ✅ Lançamento após fechamento vai para próxima fatura
- ✅ Limite disponível sempre >= 0

---

### 2️⃣ EDIÇÃO DE LANÇAMENTO

#### Regras:
```
PERMITIDO SE:
- Fatura.Status = ABERTA
- Transaction.DeletedAt IS NULL
- NÃO existe Payment relacionado

AO EDITAR:
1. Reverter valores antigos:
   - Invoice.TotalAmount -= OldAmount
   - CreditCard.AvailableLimit += OldAmount
2. Aplicar novos valores:
   - Invoice.TotalAmount += NewAmount
   - CreditCard.AvailableLimit -= NewAmount
3. Atualizar Transaction
4. Recalcular Invoice.RemainingAmount

BLOQUEADO SE:
- Fatura.Status IN (FECHADA, QUITADA, VENCIDA, ESTORNADA)
```

---

### 3️⃣ EXCLUSÃO DE LANÇAMENTO

#### Regras:
```
PERMITIDO SE:
- Fatura.Status = ABERTA
- Transaction.DeletedAt IS NULL
- NÃO existe Payment relacionado

AO EXCLUIR:
1. Soft delete: Transaction.DeletedAt = NOW()
2. Reverter valores:
   - Invoice.TotalAmount -= Amount
   - CreditCard.AvailableLimit += Amount
3. Recalcular Invoice.RemainingAmount

PROIBIDO SE:
- Fatura.Status IN (QUITADA, ESTORNADA)
- Existe Payment para esta fatura
```

---

### 4️⃣ PAGAMENTO DE FATURA (Normal)

#### Regras:
```
PERMITIDO SE:
- Fatura.Status IN (FECHADA, VENCIDA)
- Account.Balance >= Amount

CENÁRIOS:

A) Pagamento Exato (Amount = RemainingAmount):
   1. Account.Balance -= Amount
   2. Invoice.PaidAmount = TotalAmount
   3. Invoice.RemainingAmount = 0
   4. Invoice.Status = QUITADA
   5. CreditCard.AvailableLimit = CreditLimit
   6. Criar FinancialEvent(PAGAMENTO_FATURA)

B) Pagamento Maior (Amount > RemainingAmount):
   1. Account.Balance -= Amount
   2. Invoice.PaidAmount = TotalAmount
   3. Invoice.RemainingAmount = 0
   4. Invoice.Status = QUITADA
   5. Excedente = Amount - RemainingAmount
   6. Criar Credit:
      - OriginInvoiceID = Invoice.ID
      - OriginalAmount = Excedente
      - RemainingAmount = Excedente
   7. Invoice.GeneratedCredit = Excedente
   8. Migrar crédito para próxima fatura
   9. CreditCard.AvailableLimit = CreditLimit + Excedente
   10. Criar FinancialEvent(CREDITO_ANTECIPADO)

C) Pagamento Parcial (Amount < RemainingAmount):
   1. Account.Balance -= Amount
   2. Invoice.PaidAmount += Amount
   3. Invoice.RemainingAmount -= Amount
   4. Invoice.Status permanece (FECHADA ou VENCIDA)
   5. Criar FinancialEvent(PAGAMENTO_FATURA)

BLOQUEADO SE:
- Fatura.Status = QUITADA
- Account.Balance < Amount
```

---

### 5️⃣ PAGAMENTO ANTECIPADO

#### Regras:
```
PERMITIDO:
- Mesmo com Fatura.Status = ABERTA

FLUXO:
1. Identificar fatura atual (ABERTA ou próxima)
2. Aplicar pagamento conforme regras normais
3. Se gerar crédito:
   - Alocar para faturas futuras
   - Atualizar limite disponível

IMPORTANTE:
- Crédito antecipado tem origem rastreável
- Pode ser consumido por múltiplas faturas
```

---

### 6️⃣ CRÉDITO ANTECIPADO (Regra Fundamental)

#### Regras:
```
CRÉDITO É ENTIDADE INDEPENDENTE:

Criação:
- Sempre tem OriginInvoiceID
- OriginalAmount = valor inicial
- RemainingAmount = valor disponível

Consumo:
- Aplicado automaticamente em faturas futuras
- Credit.RemainingAmount -= AmountUsed
- Invoice.InheritedCredit += AmountUsed
- Se RemainingAmount = 0: IsConsumed = true

Migração:
1. Ao fechar fatura:
   - Créditos não consumidos migram para próxima
   - Credit.CurrentInvoiceID = NextInvoice.ID
   - NextInvoice.InheritedCredit += Credit.RemainingAmount

NUNCA:
- Apagar crédito
- Perder rastreabilidade
- Duplicar crédito
```

---

### 7️⃣ ESTORNO DE FATURA

#### Princípio:
**ESTORNO NÃO APAGA. ESTORNO CORRIGE O FUTURO.**

#### Regras por Período:

##### 🔹 Faturas ANTERIORES (antes da estornada):
```
IMUTÁVEIS
- Nenhuma alteração
- Créditos gerados permanecem válidos
- Pagamentos permanecem
```

##### 🔹 Fatura ESTORNADA:
```
1. Reverter Pagamentos:
   - Account.Balance += PaidAmount
   - Invoice.PaidAmount = 0
   - Criar FinancialEvent(ESTORNO)

2. Remover Créditos GERADOS:
   - Se Invoice.GeneratedCredit > 0:
     - Marcar Credit como reverted
     - Remover de faturas futuras

3. Manter Créditos HERDADOS:
   - Invoice.InheritedCredit permanece
   - Créditos de faturas anteriores são válidos

4. Atualizar Status:
   - Se data < ClosingDate: Status = ABERTA
   - Se data >= ClosingDate AND < DueDate: Status = FECHADA
   - Se data >= DueDate: Status = VENCIDA

5. Recalcular Valores:
   - RemainingAmount = TotalAmount - PaidAmount
```

##### 🔹 Faturas POSTERIORES:
```
REPROCESSAR:

1. Remover créditos da fatura estornada:
   - Invoice.InheritedCredit -= CreditFromRevertedInvoice

2. Recalcular valores:
   - RemainingAmount = TotalAmount - PaidAmount - InheritedCredit

3. Manter pagamentos já realizados:
   - NÃO reverter pagamentos de faturas futuras

4. Atualizar limite:
   - Recalcular baseado em todas as faturas
```

---

### 8️⃣ NOVO PAGAMENTO APÓS ESTORNO

#### Regras:
```
COMPORTAMENTO NORMAL:
- Segue todas as regras de pagamento
- Pode gerar novos créditos
- Novos créditos têm nova origem
- Reprocessa faturas futuras

VALIDAÇÕES:
- ✅ Não duplicar créditos
- ✅ Rastrear nova origem
- ✅ Recalcular limite corretamente
```

---

## 🔒 BLOQUEIOS OBRIGATÓRIOS

### Matriz de Permissões:

| Operação | ABERTA | FECHADA | QUITADA | VENCIDA | ESTORNADA |
|----------|--------|---------|---------|---------|-----------|
| Novo Lançamento | ✅ | ❌ | ❌ | ❌ | ❌ |
| Editar Lançamento | ✅ | ❌ | ❌ | ❌ | ❌ |
| Excluir Lançamento | ✅ | ❌ | ❌ | ❌ | ❌ |
| Pagar Fatura | ⚠️* | ✅ | ❌ | ✅ | ❌ |
| Estornar Fatura | ❌ | ⚠️** | ✅ | ⚠️** | ❌ |

*⚠️ Pagamento antecipado permitido  
**⚠️ Estorno permitido se houver pagamento

---

## 🔍 VALIDAÇÕES GLOBAIS

### Invariantes do Sistema:

```sql
-- 1. Soma de lançamentos = Total da fatura
SELECT 
    i.id,
    i.total_amount,
    COALESCE(SUM(t.amount), 0) as calculated_total
FROM invoices i
LEFT JOIN transactions t ON t.invoice_id = i.id AND t.deleted_at IS NULL
GROUP BY i.id
HAVING i.total_amount != COALESCE(SUM(t.amount), 0);
-- Deve retornar 0 linhas

-- 2. Saldo da conta reflete apenas pagamentos
SELECT 
    a.id,
    a.balance,
    initial_balance - COALESCE(SUM(fe.balance_impact), 0) as calculated_balance
FROM accounts a
LEFT JOIN financial_events fe ON fe.account_id = a.id
GROUP BY a.id
HAVING a.balance != calculated_balance;
-- Deve retornar 0 linhas

-- 3. Limite disponível consistente
SELECT 
    cc.id,
    cc.available_limit,
    cc.credit_limit - COALESCE(SUM(i.remaining_amount), 0) + COALESCE(SUM(c.remaining_amount), 0) as calculated_limit
FROM credit_cards cc
LEFT JOIN invoices i ON i.credit_card_id = cc.id AND i.status != 'QUITADA'
LEFT JOIN credits c ON c.current_invoice_id IN (SELECT id FROM invoices WHERE credit_card_id = cc.id)
GROUP BY cc.id
HAVING cc.available_limit != calculated_limit;
-- Deve retornar 0 linhas

-- 4. Créditos sempre rastreáveis
SELECT * FROM credits WHERE origin_invoice_id IS NULL;
-- Deve retornar 0 linhas
```

---

## ⚠️ PRINCÍPIOS FUNDAMENTAIS

### 1. Imutabilidade do Histórico
- Eventos passados nunca são apagados
- Correções são feitas para frente
- Soft delete sempre que possível

### 2. Independência de Faturas
- Cada fatura é uma entidade autônoma
- Créditos migram, mas mantêm origem
- Estorno de uma não quebra outras

### 3. Rastreabilidade Total
- Todo crédito tem origem
- Todo evento tem causa
- Auditoria completa sempre possível

### 4. Determinismo
- Mesmo input = mesmo output
- Reprocessamento gera mesmo resultado
- Sem estados ambíguos

### 5. Consistência Eventual
- Operações podem ser assíncronas
- Mas resultado final é sempre consistente
- Validações garantem integridade

---

## 📊 MÉTRICAS DE QUALIDADE

### Testes Obrigatórios:
- ✅ Lançamento em fatura aberta
- ✅ Bloqueio de lançamento em fatura fechada
- ✅ Pagamento exato
- ✅ Pagamento com crédito
- ✅ Pagamento antecipado
- ✅ Estorno sem quebrar futuro
- ✅ Reprocessamento após estorno
- ✅ Migração de créditos
- ✅ Limite sempre consistente
- ✅ Saldo sempre consistente

### Validações Contínuas:
- Soma de lançamentos = total fatura
- Saldo conta = histórico de pagamentos
- Limite = credit_limit - dívidas + créditos
- Créditos sempre rastreáveis

---

## 🚀 IMPLEMENTAÇÃO RECOMENDADA

### Fase 1: Estrutura Base
1. Criar tabelas e entidades
2. Implementar status de fatura
3. Criar sistema de eventos financeiros

### Fase 2: Operações Básicas
1. Lançamento em cartão
2. Pagamento simples
3. Validações de status

### Fase 3: Créditos
1. Geração de crédito
2. Migração entre faturas
3. Consumo automático

### Fase 4: Estornos
1. Estorno de pagamento
2. Reprocessamento de faturas
3. Validações de consistência

### Fase 5: Testes E2E
1. Ciclo completo
2. Edge cases
3. Validações globais

---

**Especificação aprovada para implementação**  
**Nível**: Banco Digital Real  
**Status**: 📋 Pronto para Desenvolvimento
