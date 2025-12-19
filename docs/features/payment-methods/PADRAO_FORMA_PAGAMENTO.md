# 💳 PADRÃO DE FORMA DE PAGAMENTO

**Versão:** 1.0.0  
**Data:** 2025-12-18  
**Tipo:** Especificação Técnica

---

## 🎯 OBJETIVO

Padronizar o uso da **forma de pagamento** em lançamentos financeiros, garantindo:

- ✅ Dados consistentes e enriquecidos
- ✅ UX sem fricção
- ✅ Compatibilidade com registros antigos
- ✅ Base para relatórios e IA

---

## 📋 ESPECIFICAÇÃO

### 1. Campo `payment_method`

**Características:**
- **Tipo:** ENUM (string)
- **Armazenamento:** UPPERCASE
- **Obrigatoriedade:** OPCIONAL por padrão
- **Pode ser:** NULL

**Valores Válidos:**
```
PIX
CASH
CREDIT_CARD
DEBIT_CARD
BANK_TRANSFER
BOLETO
AUTOMATIC
OTHER
```

**Banco de Dados:**
```sql
payment_method VARCHAR(50) NULL
CHECK (payment_method IN (
  'PIX', 'CASH', 'CREDIT_CARD', 'DEBIT_CARD',
  'BANK_TRANSFER', 'BOLETO', 'AUTOMATIC', 'OTHER'
))
```

---

## 🎨 UX - CRIAÇÃO DE LANÇAMENTO

### Comportamento

1. **Campo Visível:**
   - ✅ Deve aparecer no formulário de criação
   - ✅ Posicionado após valor e tipo
   - ✅ Antes de descrição/categoria

2. **Label:**
   ```
   Forma de pagamento (opcional)
   ```

3. **Placeholder:**
   ```
   Selecione a forma de pagamento
   ```

4. **Estado Inicial:**
   - Campo vazio (não selecionado)
   - Sem valor padrão
   - Não obrigatório

5. **Validação:**
   - ❌ NÃO bloquear salvamento se vazio
   - ✅ Aceitar NULL
   - ✅ Validar apenas se preenchido

---

## ✏️ UX - EDIÇÃO DE LANÇAMENTO

### Comportamento

1. **Campo Editável:**
   - ✅ Pode ser preenchido posteriormente
   - ✅ Pode ser alterado
   - ✅ Pode ser removido (NULL)

2. **Sugestão Contextual (Opcional):**
   ```
   💡 Dica: Adicione a forma de pagamento para relatórios mais detalhados
   ```

3. **Sem Obrigatoriedade Retroativa:**
   - ❌ NÃO forçar preenchimento
   - ❌ NÃO mostrar como erro
   - ✅ Sugerir como melhoria

---

## 🔒 CONTEXTOS OBRIGATÓRIOS

A forma de pagamento **DEVE SER OBRIGATÓRIA** apenas quando:

### 1. Pagamento de Fatura
```
Contexto: Pagamento de fatura de cartão
Obrigatório: SIM
Motivo: Há pagamento real
```

### 2. Pagamento de Conta a Pagar
```
Contexto: Baixa de payable
Obrigatório: SIM
Motivo: Há pagamento real
```

### 3. Conciliação Bancária
```
Contexto: Importação de extrato
Obrigatório: SIM
Motivo: Sistema conhece a origem
```

### 4. Lançamento Simples
```
Contexto: Registro manual de despesa/receita
Obrigatório: NÃO
Motivo: Usuário pode não saber ou não importar
```

---

## 📊 MAPEAMENTO DE CONTEXTOS

| Contexto | Obrigatório? | Valor Sugerido |
|----------|--------------|----------------|
| Lançamento manual | ❌ Não | - |
| Pagamento de fatura | ✅ Sim | Conforme escolha |
| Pagamento de payable | ✅ Sim | Conforme escolha |
| Transferência entre contas | ❌ Não | BANK_TRANSFER |
| Importação bancária | ✅ Sim | Conforme extrato |
| Lançamento retroativo | ❌ Não | - |

---

## 🎨 COMPONENTE UI

### Select de Forma de Pagamento

```tsx
interface PaymentMethodSelectProps {
  value: string | null
  onChange: (value: string | null) => void
  required?: boolean
  label?: string
  helperText?: string
}

export function PaymentMethodSelect({
  value,
  onChange,
  required = false,
  label = "Forma de pagamento",
  helperText,
}: PaymentMethodSelectProps) {
  const options = [
    { value: "PIX", label: "PIX", icon: "⚡" },
    { value: "CASH", label: "Dinheiro", icon: "💵" },
    { value: "CREDIT_CARD", label: "Cartão de Crédito", icon: "💳" },
    { value: "DEBIT_CARD", label: "Cartão de Débito", icon: "💳" },
    { value: "BANK_TRANSFER", label: "Transferência Bancária", icon: "🏦" },
    { value: "BOLETO", label: "Boleto", icon: "📄" },
    { value: "AUTOMATIC", label: "Débito Automático", icon: "🔄" },
    { value: "OTHER", label: "Outro", icon: "📝" },
  ]

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {!required && <span className="text-muted-foreground ml-1">(opcional)</span>}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione a forma de pagamento" />
        </SelectTrigger>
        <SelectContent>
          {!required && (
            <SelectItem value="">
              <span className="text-muted-foreground">Nenhuma</span>
            </SelectItem>
          )}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="flex items-center gap-2">
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {helperText && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  )
}
```

---

## 🔄 MIGRAÇÃO DE DADOS

### Dados Existentes

**Situação:**
- Lançamentos antigos sem `payment_method`
- Campo NULL no banco

**Ação:**
- ❌ NÃO preencher automaticamente
- ❌ NÃO forçar atualização
- ✅ Manter NULL
- ✅ Permitir preenchimento manual posterior

**Script de Verificação:**
```sql
-- Verificar lançamentos sem forma de pagamento
SELECT COUNT(*) 
FROM transactions 
WHERE payment_method IS NULL;

-- Não executar UPDATE automático!
-- Deixar o usuário preencher quando quiser
```

---

## 📊 RELATÓRIOS E ANÁLISES

### Com Forma de Pagamento
```
Relatório: Despesas por forma de pagamento
- PIX: R$ 5.000
- Cartão de Crédito: R$ 3.000
- Dinheiro: R$ 1.000
- Não informado: R$ 2.000
```

### Sugestões de IA
```
💡 Você tem R$ 2.000 em lançamentos sem forma de pagamento.
   Adicione essa informação para análises mais precisas.
```

---

## ✅ VALIDAÇÕES

### Backend (Go)

```go
// Validação do payment_method
func ValidatePaymentMethod(method *string) error {
    if method == nil {
        return nil // NULL é válido
    }
    
    validMethods := []string{
        "PIX", "CASH", "CREDIT_CARD", "DEBIT_CARD",
        "BANK_TRANSFER", "BOLETO", "AUTOMATIC", "OTHER",
    }
    
    methodUpper := strings.ToUpper(*method)
    for _, valid := range validMethods {
        if methodUpper == valid {
            return nil
        }
    }
    
    return fmt.Errorf("invalid payment method: %s", *method)
}
```

### Frontend (TypeScript)

```typescript
const PAYMENT_METHODS = [
  "PIX",
  "CASH",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "BANK_TRANSFER",
  "BOLETO",
  "AUTOMATIC",
  "OTHER",
] as const

type PaymentMethod = typeof PAYMENT_METHODS[number] | null

function validatePaymentMethod(method: string | null): boolean {
  if (method === null) return true
  return PAYMENT_METHODS.includes(method as any)
}
```

---

## 🎯 CASOS DE USO

### Caso 1: Lançamento Manual Simples
```
Usuário: Registra "Almoço - R$ 50"
Sistema: NÃO exige forma de pagamento
Resultado: Salvo com payment_method = NULL ✅
```

### Caso 2: Pagamento de Fatura
```
Usuário: Paga fatura do cartão
Sistema: Exige forma de pagamento
Usuário: Seleciona "PIX"
Resultado: Salvo com payment_method = "PIX" ✅
```

### Caso 3: Edição Posterior
```
Usuário: Edita lançamento antigo
Sistema: Mostra campo vazio (opcional)
Usuário: Pode adicionar ou deixar vazio
Resultado: Flexibilidade mantida ✅
```

---

## 🚫 ANTI-PADRÕES (NÃO FAZER)

### ❌ Forçar Preenchimento
```typescript
// ERRADO
if (!paymentMethod) {
  throw new Error("Forma de pagamento obrigatória")
}
```

### ❌ Preencher Automaticamente
```typescript
// ERRADO
if (!paymentMethod) {
  paymentMethod = "OTHER" // Não assumir!
}
```

### ❌ Validar Retroativamente
```typescript
// ERRADO
if (transaction.createdAt < today && !paymentMethod) {
  showError("Adicione forma de pagamento")
}
```

---

## ✅ BOAS PRÁTICAS

### ✅ Sugerir, Não Forçar
```typescript
// CORRETO
if (!paymentMethod && context === "invoice_payment") {
  showSuggestion("Adicione a forma de pagamento para melhor controle")
}
```

### ✅ Aceitar NULL
```typescript
// CORRETO
const paymentMethod: string | null = formData.paymentMethod || null
```

### ✅ Enriquecer Gradualmente
```typescript
// CORRETO
function suggestPaymentMethodImprovement() {
  const transactionsWithoutMethod = transactions.filter(t => !t.paymentMethod)
  if (transactionsWithoutMethod.length > 10) {
    showNotification("💡 Melhore seus dados adicionando formas de pagamento")
  }
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Backend
- [ ] Verificar se campo `payment_method` existe no banco
- [ ] Garantir que aceita NULL
- [ ] Adicionar validação de enum (se preenchido)
- [ ] Converter para UPPERCASE ao salvar
- [ ] Não forçar obrigatoriedade

### Frontend
- [ ] Criar componente `PaymentMethodSelect`
- [ ] Adicionar campo no formulário de criação
- [ ] Marcar como opcional
- [ ] Adicionar campo no formulário de edição
- [ ] Permitir limpar valor (NULL)
- [ ] Adicionar ícones visuais

### UX
- [ ] Label clara: "Forma de pagamento (opcional)"
- [ ] Placeholder: "Selecione a forma de pagamento"
- [ ] Opção "Nenhuma" disponível
- [ ] Não bloquear salvamento
- [ ] Sugestão contextual (não erro)

---

## 🎉 RESULTADO ESPERADO

### Antes ❌
```
Criação: Campo não aparece
Edição: Campo aparece (inconsistente)
Dados: Incompletos
UX: Confusa
```

### Depois ✅
```
Criação: Campo opcional visível
Edição: Campo opcional visível
Dados: Enriquecidos gradualmente
UX: Consistente e sem fricção
```

---

> **Próxima Ação:** Verificar estado atual e implementar componente
