# 🎯 FORMA DE PAGAMENTO INTELIGENTE — Especificação Final

**Versão:** 2.0.0  
**Data:** 2025-12-18  
**Tipo:** Regra de Negócio

---

## 🚀 VISÃO

Transformar **Forma de Pagamento** de simples cadastro em **REGRA DE NEGÓCIO INTELIGENTE**.

---

## 📊 MODELO DE DADOS

### Estrutura Completa

```go
type PaymentMethod struct {
    ID                 string    // UUID
    UserID             string    // Dono do método
    Name               string    // Nome exibido
    Type               string    // Categoria técnica
    AllowsIncome       bool      // Pode receber?
    AllowsExpense      bool      // Pode gastar?
    AllowsTransfer     bool      // Pode transferir?
    AffectsBalance     bool      // Altera saldo imediato?
    AffectsCreditCard  bool      // Gera/paga fatura?
    AffectsInvoice     bool      // Aparece em fatura?
    IsInternal         bool      // Movimento neutro?
    Icon               *string   // Ícone visual
    SortOrder          int       // Ordem de exibição
    IsActive           bool      // Ativo?
}
```

---

## 🎨 MÉTODOS PADRÃO

### 1. PIX ⚡

```json
{
  "name": "PIX",
  "type": "PIX",
  "allows_income": true,      // ✅ Pode receber
  "allows_expense": true,     // ✅ Pode pagar
  "allows_transfer": true,    // ✅ Pode transferir
  "affects_balance": true,    // ✅ Saldo imediato
  "affects_credit_card": false,
  "affects_invoice": false,
  "is_internal": false,
  "icon": "⚡",
  "sort_order": 1
}
```

**Uso:** Receitas, despesas, transferências  
**Impacto:** Saldo imediato

---

### 2. Dinheiro 💵

```json
{
  "name": "Dinheiro",
  "type": "CASH",
  "allows_income": true,      // ✅ Pode receber
  "allows_expense": true,     // ✅ Pode pagar
  "allows_transfer": false,   // ❌ Não transfere
  "affects_balance": true,    // ✅ Saldo imediato
  "affects_credit_card": false,
  "affects_invoice": false,
  "is_internal": false,
  "icon": "💵",
  "sort_order": 2
}
```

**Uso:** Receitas, despesas  
**Impacto:** Saldo imediato

---

### 3. Cartão de Crédito 💳

```json
{
  "name": "Cartão de Crédito",
  "type": "CREDIT_CARD",
  "allows_income": false,     // ❌ Não recebe
  "allows_expense": true,     // ✅ Pode gastar
  "allows_transfer": false,   // ❌ Não transfere
  "affects_balance": false,   // ❌ Não afeta saldo imediato
  "affects_credit_card": true,// ✅ Gera fatura
  "affects_invoice": true,    // ✅ Aparece em fatura
  "is_internal": false,
  "icon": "💳",
  "sort_order": 3
}
```

**Uso:** Apenas despesas  
**Impacto:** Gera fatura (não afeta saldo imediato)

---

### 4. Cartão de Débito 💳

```json
{
  "name": "Cartão de Débito",
  "type": "DEBIT_CARD",
  "allows_income": false,     // ❌ Não recebe
  "allows_expense": true,     // ✅ Pode pagar
  "allows_transfer": false,   // ❌ Não transfere
  "affects_balance": true,    // ✅ Saldo imediato
  "affects_credit_card": false,
  "affects_invoice": false,
  "is_internal": false,
  "icon": "💳",
  "sort_order": 4
}
```

**Uso:** Apenas despesas  
**Impacto:** Saldo imediato

---

### 5. Transferência Interna 🔄

```json
{
  "name": "Transferência Interna",
  "type": "INTERNAL_TRANSFER",
  "allows_income": false,     // ❌ Não é receita
  "allows_expense": false,    // ❌ Não é despesa
  "allows_transfer": true,    // ✅ Só transferência
  "affects_balance": false,   // ❌ Movimento neutro
  "affects_credit_card": false,
  "affects_invoice": false,
  "is_internal": true,        // ✅ Interno
  "icon": "🔄",
  "sort_order": 8
}
```

**Uso:** Apenas transferências entre contas  
**Impacto:** Neutro (sai de uma, entra em outra)

---

## 🎯 REGRAS DE NEGÓCIO

### Filtro Inteligente

```go
// Ao criar RECEITA
paymentMethods = filter(pm => pm.AllowsIncome == true)
// Resultado: PIX, Dinheiro, Transferência Bancária, Boleto

// Ao criar DESPESA
paymentMethods = filter(pm => pm.AllowsExpense == true)
// Resultado: PIX, Dinheiro, Cartão Crédito, Cartão Débito, etc

// Ao criar TRANSFERÊNCIA
paymentMethods = filter(pm => pm.AllowsTransfer == true)
// Resultado: PIX, Transferência Bancária, Transferência Interna
```

---

### Validação Automática

```go
func ValidatePaymentMethod(transactionType string, paymentMethod *PaymentMethod) error {
    if !paymentMethod.CanBeUsedFor(transactionType) {
        return fmt.Errorf(
            "Forma de pagamento '%s' não pode ser usada para %s",
            paymentMethod.Name,
            transactionType,
        )
    }
    return nil
}
```

---

### Impacto no Saldo

```go
func ShouldAffectBalance(paymentMethod *PaymentMethod) bool {
    return paymentMethod.AffectsBalance && !paymentMethod.IsInternal
}

// Exemplo:
// PIX → true (afeta saldo)
// Crédito → false (não afeta saldo, gera fatura)
// Transferência Interna → false (neutro)
```

---

## 🎨 UX - FORMULÁRIO INTELIGENTE

### Criação de Transação

```tsx
function TransactionForm() {
  const [type, setType] = useState<"receita" | "despesa" | "transfer">()
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null)
  
  // ✅ Filtro inteligente
  const availableMethods = paymentMethods.filter(pm => {
    if (type === "receita") return pm.allows_income
    if (type === "despesa") return pm.allows_expense
    if (type === "transfer") return pm.allows_transfer
    return true
  })

  return (
    <form>
      {/* Tipo */}
      <RadioGroup value={type} onChange={setType}>
        <Radio value="receita">Receita</Radio>
        <Radio value="despesa">Despesa</Radio>
      </RadioGroup>

      {/* Forma de Pagamento - FILTRADA */}
      <PaymentMethodSelect
        value={paymentMethodId}
        onChange={setPaymentMethodId}
        methods={availableMethods} // ✅ Só métodos válidos
        required={false}
      />
    </form>
  )
}
```

---

## 📊 EXEMPLOS PRÁTICOS

### Cenário 1: Receita via PIX

```
Tipo: Receita
Forma: PIX
Resultado:
  ✅ Permitido (allows_income = true)
  ✅ Afeta saldo imediato (affects_balance = true)
  ✅ Saldo: +R$ 1.000
```

---

### Cenário 2: Despesa no Crédito

```
Tipo: Despesa
Forma: Cartão de Crédito
Resultado:
  ✅ Permitido (allows_expense = true)
  ❌ NÃO afeta saldo imediato (affects_balance = false)
  ✅ Gera fatura (affects_credit_card = true)
  ✅ Aparece na fatura (affects_invoice = true)
```

---

### Cenário 3: Transferência Interna

```
Tipo: Transferência
Forma: Transferência Interna
Resultado:
  ✅ Permitido (allows_transfer = true)
  ✅ Movimento neutro (is_internal = true)
  ✅ Sai de Conta A: -R$ 500
  ✅ Entra em Conta B: +R$ 500
  ✅ Saldo total: 0 (neutro)
```

---

### Cenário 4: Tentativa Inválida

```
Tipo: Receita
Forma: Cartão de Crédito
Resultado:
  ❌ BLOQUEADO (allows_income = false)
  ❌ Erro: "Cartão de Crédito não pode ser usado para receitas"
```

---

## 🚀 GANHOS IMEDIATOS

### 1. Redução de Erros

**Antes:**
```
Usuário tenta: Receita via Cartão de Crédito
Sistema: Aceita ❌
Resultado: Dados inconsistentes
```

**Depois:**
```
Usuário tenta: Receita via Cartão de Crédito
Sistema: Bloqueia ✅
Resultado: Dados sempre corretos
```

---

### 2. UX Inteligente

**Antes:**
```
Formulário mostra TODAS as formas de pagamento
Usuário precisa saber quais são válidas
```

**Depois:**
```
Formulário mostra APENAS formas válidas
Sistema pensa pelo usuário
```

---

### 3. Automação Futura

```
Com essas regras, você pode:
✅ Sugerir forma de pagamento automaticamente
✅ Detectar padrões de uso
✅ Criar regras de IA
✅ Gerar insights inteligentes
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Backend ✅
- [x] Migração SQL criada
- [x] Entidade Go atualizada
- [x] Método `CanBeUsedFor()` implementado
- [x] Função de população automática
- [x] Trigger para novos usuários

### Frontend (Próximo)
- [ ] Hook `usePaymentMethods`
- [ ] Componente `PaymentMethodSelect`
- [ ] Filtro inteligente por tipo
- [ ] Ícones visuais
- [ ] Validação de formulário

### Testes (Próximo)
- [ ] Teste de filtro por tipo
- [ ] Teste de validação
- [ ] Teste de impacto no saldo
- [ ] Teste de métodos padrão

---

## 🎉 RESULTADO FINAL

### Sistema Burro ❌
```
Forma de Pagamento = Campo de texto
Usuário decide tudo
Sistema só armazena
```

### Sistema Inteligente ✅
```
Forma de Pagamento = Regra de Negócio
Sistema valida e filtra
Usuário não erra
Dados sempre consistentes
Base para IA futura
```

---

> **Status:** ✅ Backend implementado  
> **Próximo:** Frontend + Testes  
> **Impacto:** 🚀 Sistema financeiro profissional
