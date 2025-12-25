# 🎯 PLANO DE IMPLEMENTAÇÃO - FATURAS DE CARTÃO

**Sistema**: FinCore  
**Módulo**: Cartões de Crédito - Ciclo Completo  
**Data**: 24/12/2025  
**Prioridade**: 🔴 CRÍTICA (Core Business)

---

## 📋 RESUMO EXECUTIVO

Este documento define o plano completo de implementação do sistema de faturas de cartão de crédito, seguindo especificações de nível bancário.

**Objetivo**: Transformar o FinCore em um sistema financeiro confiável e profissional para gestão de cartões de crédito.

---

## 🗺️ ROADMAP DE IMPLEMENTAÇÃO

### FASE 1: Estrutura Base (4-6 horas)
**Status**: ⏳ Pendente  
**Prioridade**: 🔴 CRÍTICA

#### Tarefas:
1. **Criar Tabelas de Eventos Financeiros**
   ```sql
   CREATE TABLE financial_events (
       id UUID PRIMARY KEY,
       user_id UUID NOT NULL,
       type VARCHAR(50) NOT NULL,
       invoice_id UUID NOT NULL,
       amount DECIMAL(15,2) NOT NULL,
       origin_invoice_id UUID,
       related_event_id UUID,
       account_id UUID,
       balance_impact DECIMAL(15,2),
       notes TEXT,
       created_at TIMESTAMPTZ NOT NULL,
       reverted_at TIMESTAMPTZ
   );
   ```

2. **Criar Tabela de Créditos**
   ```sql
   CREATE TABLE credits (
       id UUID PRIMARY KEY,
       user_id UUID NOT NULL,
       origin_invoice_id UUID NOT NULL,
       current_invoice_id UUID,
       original_amount DECIMAL(15,2) NOT NULL,
       remaining_amount DECIMAL(15,2) NOT NULL,
       is_consumed BOOLEAN DEFAULT false,
       created_at TIMESTAMPTZ NOT NULL,
       updated_at TIMESTAMPTZ NOT NULL
   );
   ```

3. **Atualizar Tabela de Faturas**
   - Adicionar campos: `inherited_credit`, `generated_credit`
   - Adicionar status: `ESTORNADA`
   - Criar índices apropriados

4. **Criar Entidades Go**
   - `FinancialEvent`
   - `Credit`
   - Atualizar `Invoice` com novos campos

---

### FASE 2: Operações Básicas (6-8 horas)
**Status**: ⏳ Pendente  
**Prioridade**: 🔴 CRÍTICA

#### 2.1 Lançamento em Cartão
- ✅ Validar status da fatura
- ✅ Validar limite disponível
- ✅ Criar transação
- ✅ Atualizar total da fatura
- ✅ Reduzir limite disponível
- ✅ Criar evento financeiro

#### 2.2 Edição de Lançamento
- ✅ Validar se fatura está ABERTA
- ✅ Reverter valores antigos
- ✅ Aplicar novos valores
- ✅ Recalcular totais

#### 2.3 Exclusão de Lançamento
- ✅ Soft delete
- ✅ Reverter impactos
- ✅ Validar permissões

#### 2.4 Pagamento Simples
- ✅ Validar status da fatura
- ✅ Validar saldo da conta
- ✅ Reduzir saldo
- ✅ Atualizar fatura
- ✅ Criar evento financeiro

---

### FASE 3: Créditos Antecipados (8-10 horas)
**Status**: ⏳ Pendente  
**Prioridade**: 🟡 ALTA

#### 3.1 Geração de Crédito
```go
func GenerateCredit(invoiceID string, amount float64) (*Credit, error) {
    credit := &Credit{
        ID:              uuid.New().String(),
        OriginInvoiceID: invoiceID,
        OriginalAmount:  amount,
        RemainingAmount: amount,
        IsConsumed:      false,
    }
    
    // Salvar no banco
    // Criar evento financeiro
    // Atualizar fatura origem
    
    return credit, nil
}
```

#### 3.2 Migração de Créditos
```go
func MigrateCredits(fromInvoiceID, toInvoiceID string) error {
    // Buscar créditos não consumidos
    credits := FindActiveCredits(fromInvoiceID)
    
    for _, credit := range credits {
        if credit.RemainingAmount > 0 {
            // Atualizar invoice atual
            credit.CurrentInvoiceID = toInvoiceID
            
            // Atualizar inherited_credit da próxima fatura
            UpdateInvoiceInheritedCredit(toInvoiceID, credit.RemainingAmount)
        }
    }
    
    return nil
}
```

#### 3.3 Consumo Automático
```go
func ConsumeCredits(invoiceID string) error {
    invoice := GetInvoice(invoiceID)
    credits := FindCreditsForInvoice(invoiceID)
    
    remainingDebt := invoice.RemainingAmount
    
    for _, credit := range credits {
        if remainingDebt <= 0 {
            break
        }
        
        amountToUse := min(credit.RemainingAmount, remainingDebt)
        
        // Consumir crédito
        credit.RemainingAmount -= amountToUse
        if credit.RemainingAmount == 0 {
            credit.IsConsumed = true
        }
        
        // Reduzir dívida
        remainingDebt -= amountToUse
        invoice.RemainingAmount -= amountToUse
    }
    
    return nil
}
```

---

### FASE 4: Estornos e Reprocessamento (10-12 horas)
**Status**: ⏳ Pendente  
**Prioridade**: 🟡 ALTA

#### 4.1 Estorno de Pagamento
```go
func RevertInvoicePayment(invoiceID string) error {
    invoice := GetInvoice(invoiceID)
    
    // 1. Reverter pagamentos
    payments := GetPaymentEvents(invoiceID)
    for _, payment := range payments {
        // Devolver saldo para conta
        account.Balance += payment.Amount
        
        // Marcar evento como revertido
        payment.RevertedAt = time.Now()
        
        // Criar evento de estorno
        CreateEvent(EventTypeReversal, payment.ID, payment.Amount)
    }
    
    // 2. Remover créditos GERADOS
    if invoice.GeneratedCredit > 0 {
        credits := GetGeneratedCredits(invoiceID)
        for _, credit := range credits {
            RemoveCreditFromFutureInvoices(credit)
            MarkCreditAsReverted(credit)
        }
    }
    
    // 3. Manter créditos HERDADOS
    // (não fazer nada, eles permanecem)
    
    // 4. Atualizar status
    invoice.Status = DetermineStatus(invoice)
    invoice.PaidAmount = 0
    invoice.RemainingAmount = invoice.TotalAmount - invoice.InheritedCredit
    
    // 5. Reprocessar faturas futuras
    ReprocessFutureInvoices(invoice.ReferenceMonth, invoice.ReferenceYear)
    
    return nil
}
```

#### 4.2 Reprocessamento de Faturas Futuras
```go
func ReprocessFutureInvoices(fromMonth, fromYear int) error {
    futureInvoices := GetFutureInvoices(fromMonth, fromYear)
    
    for _, invoice := range futureInvoices {
        // Recalcular créditos herdados
        credits := GetActiveCreditsForInvoice(invoice.ID)
        totalInheritedCredit := 0.0
        
        for _, credit := range credits {
            totalInheritedCredit += credit.RemainingAmount
        }
        
        invoice.InheritedCredit = totalInheritedCredit
        
        // Recalcular remaining amount
        invoice.RemainingAmount = invoice.TotalAmount - invoice.PaidAmount - invoice.InheritedCredit
        
        // Atualizar no banco
        UpdateInvoice(invoice)
    }
    
    return nil
}
```

---

### FASE 5: Testes E2E (6-8 horas)
**Status**: ⏳ Pendente  
**Prioridade**: 🔴 CRÍTICA

#### Cenários de Teste:

1. **Ciclo Básico**
   - Criar cartão
   - Lançar despesa
   - Pagar fatura
   - Validar saldo e limite

2. **Pagamento com Crédito**
   - Pagar valor maior que fatura
   - Validar geração de crédito
   - Validar migração para próxima fatura
   - Validar consumo automático

3. **Estorno Simples**
   - Pagar fatura
   - Estornar pagamento
   - Validar reversão de saldo
   - Validar status da fatura

4. **Estorno com Crédito**
   - Pagar com excedente
   - Validar crédito em fatura futura
   - Estornar pagamento
   - Validar remoção de crédito
   - Validar reprocessamento

5. **Múltiplas Faturas**
   - Criar 3 faturas consecutivas
   - Pagar primeira com excedente
   - Validar migração de crédito
   - Estornar primeira
   - Validar impacto nas outras

---

## 🔍 VALIDAÇÕES OBRIGATÓRIAS

### Validações em Tempo Real:

```go
// 1. Validar total da fatura
func ValidateInvoiceTotal(invoiceID string) error {
    invoice := GetInvoice(invoiceID)
    transactions := GetTransactions(invoiceID)
    
    calculatedTotal := 0.0
    for _, tx := range transactions {
        calculatedTotal += tx.Amount
    }
    
    if invoice.TotalAmount != calculatedTotal {
        return fmt.Errorf("inconsistência: total=%f, calculado=%f", 
            invoice.TotalAmount, calculatedTotal)
    }
    
    return nil
}

// 2. Validar limite disponível
func ValidateAvailableLimit(cardID string) error {
    card := GetCreditCard(cardID)
    invoices := GetOpenInvoices(cardID)
    credits := GetActiveCredits(cardID)
    
    totalDebt := 0.0
    for _, invoice := range invoices {
        totalDebt += invoice.RemainingAmount
    }
    
    totalCredit := 0.0
    for _, credit := range credits {
        totalCredit += credit.RemainingAmount
    }
    
    calculatedLimit := card.CreditLimit - totalDebt + totalCredit
    
    if card.AvailableLimit != calculatedLimit {
        return fmt.Errorf("inconsistência no limite")
    }
    
    return nil
}

// 3. Validar rastreabilidade de créditos
func ValidateCreditTraceability() error {
    credits := GetAllCredits()
    
    for _, credit := range credits {
        if credit.OriginInvoiceID == "" {
            return fmt.Errorf("crédito %s sem origem", credit.ID)
        }
        
        originInvoice := GetInvoice(credit.OriginInvoiceID)
        if originInvoice == nil {
            return fmt.Errorf("fatura origem %s não existe", credit.OriginInvoiceID)
        }
    }
    
    return nil
}
```

---

## 📊 MÉTRICAS DE SUCESSO

### KPIs Técnicos:
- ✅ 100% das operações com eventos financeiros
- ✅ 0 inconsistências em validações globais
- ✅ 100% de rastreabilidade de créditos
- ✅ Tempo de reprocessamento < 1s por fatura

### KPIs de Negócio:
- ✅ Usuário confia nos valores exibidos
- ✅ Estornos não geram confusão
- ✅ Créditos são aplicados corretamente
- ✅ Limite sempre correto

---

## ⚠️ RISCOS E MITIGAÇÕES

### Risco 1: Inconsistência em Estornos
**Mitigação**: 
- Usar transações de banco de dados
- Validar antes e depois
- Logs detalhados

### Risco 2: Perda de Créditos
**Mitigação**:
- Nunca apagar créditos
- Sempre rastrear origem
- Validações contínuas

### Risco 3: Limite Incorreto
**Mitigação**:
- Recalcular em tempo real
- Validar em cada operação
- Testes automatizados

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

### Semana 1:
1. ✅ Revisar especificação técnica
2. ⏳ Criar migrations para novas tabelas
3. ⏳ Implementar entidades Go
4. ⏳ Criar repositórios base

### Semana 2:
1. ⏳ Implementar operações básicas
2. ⏳ Criar testes unitários
3. ⏳ Validar com testes E2E básicos

### Semana 3:
1. ⏳ Implementar créditos
2. ⏳ Implementar estornos
3. ⏳ Testes E2E completos

### Semana 4:
1. ⏳ Validações globais
2. ⏳ Performance
3. ⏳ Documentação final
4. ⏳ Deploy em produção

---

## 📚 DOCUMENTAÇÃO RELACIONADA

1. `ESPECIFICACAO_FATURAS_CARTAO.md` - Especificação técnica completa
2. `BUGS_E_FEATURES_IDENTIFICADOS.md` - Bugs e features pendentes
3. `RESUMO_TESTES_E2E.md` - Status dos testes

---

**Plano aprovado para execução**  
**Estimativa Total**: 34-44 horas  
**Prazo Sugerido**: 3-4 semanas  
**Prioridade**: 🔴 CRÍTICA
