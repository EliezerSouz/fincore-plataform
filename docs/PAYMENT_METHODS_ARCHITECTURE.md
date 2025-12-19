# 🏗️ ARQUITETURA DE FORMAS DE PAGAMENTO

## 📋 VISÃO GERAL

Este documento define a **FONTE ABSOLUTA DE VERDADE** para o gerenciamento de formas de pagamento no sistema.

---

## 🎯 PRINCÍPIOS FUNDAMENTAIS

### REGRA DE OURO
**A CONFIGURAÇÃO DA FORMA DE PAGAMENTO É A FONTE ABSOLUTA DE VERDADE**

Nenhuma tela pode:
- ❌ Criar regras próprias
- ❌ Reinterpretar comportamento
- ❌ Hardcodar exceções

---

## 📊 ESTRUTURA DE DADOS

### Tabela: `payment_methods`

```sql
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    icon VARCHAR(50),
    
    -- FLAGS DE CONTEXTO (Onde pode ser usado)
    allows_income BOOLEAN DEFAULT false,
    allows_expense BOOLEAN DEFAULT false,
    allows_transfer BOOLEAN DEFAULT false,
    affects_credit_card BOOLEAN DEFAULT false,
    affects_invoice BOOLEAN DEFAULT false,
    is_internal BOOLEAN DEFAULT false,
    
    -- FLAGS DE COMPORTAMENTO (Como funciona)
    affects_balance BOOLEAN DEFAULT true,
    requires_bank_account BOOLEAN DEFAULT true,
    
    -- STATUS
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 CONTEXTOS SUPORTADOS

### 1. INCOME (Receitas)
**Regra:** `allows_income = true AND is_active = true`

Exemplos:
- PIX ✅
- Dinheiro ✅
- Transferência Bancária ✅
- Cartão de Crédito ❌

---

### 2. EXPENSE (Despesas)
**Regra:** `allows_expense = true AND is_active = true`

Exemplos:
- PIX ✅
- Dinheiro ✅
- Cartão de Crédito ✅
- Boleto ✅

---

### 3. TRANSFER (Transferências)
**Regra:** `allows_transfer = true AND is_active = true`

Exemplos:
- PIX ✅
- TED/DOC ✅
- Dinheiro ❌ (não é eletrônico)

---

### 4. CREDIT_CARD_PAYMENT (Pagamento de Fatura)
**Regra:** `(affects_credit_card = true OR affects_invoice = true) AND is_active = true`

Exemplos:
- PIX ✅
- Boleto ✅
- Cartão de Crédito ❌ (não pode pagar fatura com cartão)

---

### 5. INVOICE_PAYMENT (Pagamento de Contas)
**Regra:** `(affects_invoice = true OR affects_credit_card = true) AND is_active = true`

Exemplos:
- PIX ✅
- Boleto ✅
- Dinheiro ✅

---

### 6. INTERNAL_MOVEMENT (Movimentos Internos)
**Regra:** `is_internal = true AND is_active = true`

Exemplos:
- Ajuste de Saldo ✅
- Correção Contábil ✅
- PIX ❌ (é movimento real)

---

## 🧩 COMPONENTES

### 1. PaymentMethodSelector (COMPONENTE CENTRAL)

**Localização:** `src/components/payment-method-selector.tsx`

**Uso:**
```tsx
import { PaymentMethodSelector } from '@/components/payment-method-selector'

<PaymentMethodSelector
    context="EXPENSE"
    value={paymentMethodId}
    onChange={setPaymentMethodId}
    required
/>
```

**Props:**
- `context`: Contexto da operação (INCOME, EXPENSE, etc)
- `value`: ID do método selecionado
- `onChange`: Callback quando muda
- `required`: Se é obrigatório
- `label`: Label customizado (opcional)
- `placeholder`: Placeholder customizado (opcional)

---

### 2. usePaymentMethods (HOOK CENTRAL)

**Localização:** `src/hooks/use-payment-methods.ts`

**Uso:**
```tsx
import { usePaymentMethods } from '@/hooks/use-payment-methods'

const {
    validMethods,      // Métodos válidos para o contexto
    loading,           // Estado de carregamento
    isMethodValid,     // Valida se método é válido
    getUnavailableReason, // Motivo de indisponibilidade
    getMethodWarnings  // Avisos sobre o método
} = usePaymentMethods('EXPENSE')
```

---

## 🎨 PADRÕES VISUAIS

### Badges de Status

```tsx
// Receitas
<Badge color="bg-emerald-600" icon={ArrowUpCircle} />

// Despesas
<Badge color="bg-red-600" icon={ArrowDownCircle} />

// Transferências
<Badge color="bg-blue-600" icon={ArrowLeftRight} />

// Cartão
<Badge color="bg-purple-600" icon={CreditCard} />

// Faturas
<Badge color="bg-amber-600" icon={FileText} />

// Interno
<Badge color="bg-slate-600" icon={GitBranch} />
```

---

## 📱 TELAS QUE DEVEM USAR O COMPONENTE CENTRAL

### ✅ Implementadas
- [x] Nova Transação
- [x] Editar Transação
- [x] Contas a Pagar
- [x] Lançamento de Cartão

### 🔄 Pendentes de Migração
- [ ] Pagamento de Fatura
- [ ] Transferência entre Contas
- [ ] Ajustes de Saldo
- [ ] Relatórios Financeiros

---

## ⚠️ AVISOS AUTOMÁTICOS

O sistema exibe automaticamente avisos quando:

### 1. Não Afeta Saldo
```
ℹ️ Este pagamento não altera o saldo da conta
```

**Quando:** `affects_balance = false`

---

### 2. Movimento Interno
```
ℹ️ Movimento interno - não afeta resultado financeiro
```

**Quando:** `is_internal = true`

---

### 3. Afeta Fatura
```
ℹ️ Valor será direcionado para fatura de cartão
```

**Quando:** `affects_invoice = true`

---

## 🚫 REGRAS DE VALIDAÇÃO

### Método Indisponível

Quando um método não está disponível, o sistema deve:

1. **Não exibir** na lista OU
2. **Exibir desabilitado** com tooltip explicativo

Exemplo de mensagem:
```
"PIX não está disponível para pagamento de fatura."
```

---

## 🔮 PREPARAÇÃO PARA IA (FUTURO)

A arquitetura está preparada para:

- ✅ Análise de uso por forma de pagamento
- ✅ Geração de insights financeiros
- ✅ Alertas de configurações incoerentes
- ✅ Sugestões de otimização

**NÃO IMPLEMENTAR AGORA**

---

## 📝 EXEMPLOS DE CONFIGURAÇÃO

### PIX (Versátil)
```json
{
    "name": "PIX",
    "slug": "pix",
    "allows_income": true,
    "allows_expense": true,
    "allows_transfer": true,
    "affects_credit_card": false,
    "affects_invoice": false,
    "is_internal": false,
    "affects_balance": true,
    "requires_bank_account": true
}
```

### Cartão de Crédito
```json
{
    "name": "Cartão de Crédito",
    "slug": "credit_card",
    "allows_income": false,
    "allows_expense": true,
    "allows_transfer": false,
    "affects_credit_card": true,
    "affects_invoice": true,
    "is_internal": false,
    "affects_balance": false,
    "requires_bank_account": false
}
```

### Ajuste de Saldo (Interno)
```json
{
    "name": "Ajuste de Saldo",
    "slug": "balance_adjustment",
    "allows_income": false,
    "allows_expense": false,
    "allows_transfer": false,
    "affects_credit_card": false,
    "affects_invoice": false,
    "is_internal": true,
    "affects_balance": true,
    "requires_bank_account": true
}
```

---

## 🔒 RESTRIÇÕES

### PROIBIDO

1. ❌ Criar lógica de filtragem em telas individuais
2. ❌ Hardcodar lista de métodos
3. ❌ Ignorar flags da tabela
4. ❌ Criar variações visuais do seletor
5. ❌ Duplicar lógica de validação

### OBRIGATÓRIO

1. ✅ Usar `PaymentMethodSelector` em TODAS as telas
2. ✅ Respeitar os flags da tabela
3. ✅ Exibir avisos automáticos
4. ✅ Seguir padrões visuais definidos
5. ✅ Documentar novos contextos

---

## 📚 REFERÊNCIAS

- Componente: `src/components/payment-method-selector.tsx`
- Hook: `src/hooks/use-payment-methods.ts`
- Types: `src/types/payment-method.ts`
- Migration: `supabase/migrations/20250118_payment_methods_flags.sql`
- Tela Admin: `/sistema/payment-methods`

---

## 🎓 TREINAMENTO

### Para Desenvolvedores

1. Leia este documento completamente
2. Estude o componente `PaymentMethodSelector`
3. Entenda o hook `usePaymentMethods`
4. Veja exemplos de uso nas telas existentes
5. NUNCA crie lógica própria de filtragem

### Para Product Owners

1. Configure as formas de pagamento em `/sistema/payment-methods`
2. Defina os contextos onde cada uma pode ser usada
3. O sistema aplicará automaticamente as regras
4. Não é necessário configurar tela por tela

---

**Última Atualização:** 2025-01-18  
**Versão:** 1.0.0  
**Status:** ✅ IMPLEMENTADO
