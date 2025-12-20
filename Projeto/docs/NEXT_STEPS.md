# 🚀 GUIA DE CONTINUAÇÃO - MIGRAÇÃO DE TELAS

## ✅ JÁ IMPLEMENTADO

1. **Infraestrutura Completa**
   - PaymentMethodSelector component
   - usePaymentMethods hook
   - Types centralizados
   - Migration do banco
   - Tela de admin funcionando

2. **Banco de Dados**
   - Todos os campos criados
   - GRANTs aplicados
   - Policies ativas
   - Sistema funcionando ✅

---

## 🔄 PRÓXIMOS PASSOS

### 1. Finalizar EditTransactionDialog

**Arquivo:** `src/features/transactions/components/edit-transaction-dialog.tsx`

**O que fazer:**
1. Importar: `import { PaymentMethodSelector } from '@/components/payment-method-selector'`
2. Remover: state de `methods`, função `getPaymentMethods`, lógica de `filteredMethods`
3. Adicionar função:
```typescript
const getPaymentContext = () => {
    if (type === 'receita') return 'INCOME'
    if (type === 'despesa') return 'EXPENSE'
    if (type === 'transferencia') return 'TRANSFER'
    return 'EXPENSE'
}
```
4. Substituir o select manual por:
```tsx
<PaymentMethodSelector
    context={getPaymentContext()}
    value={paymentMethodId}
    onChange={setPaymentMethodId}
    placeholder="Opcional"
/>
```

---

### 2. Migrar Contas a Pagar

**Arquivo:** `app/(protected)/compromissos/payables/create-payable-dialog.tsx`

**Adicionar:**
```tsx
import { PaymentMethodSelector } from '@/components/payment-method-selector'

// No formulário:
<PaymentMethodSelector
    context="EXPENSE"  // Contas a pagar são sempre despesas
    value={paymentMethodId}
    onChange={setPaymentMethodId}
    placeholder="Opcional"
/>
```

---

### 3. Migrar Lançamento de Cartão

**Arquivo:** `app/(protected)/compromissos/cards/[id]/transaction-form.tsx`

**Adicionar:**
```tsx
import { PaymentMethodSelector } from '@/components/payment-method-selector'

// No formulário:
<PaymentMethodSelector
    context="CREDIT_CARD_PAYMENT"
    value={paymentMethodId}
    onChange={setPaymentMethodId}
    required
/>
```

---

### 4. Migrar Pagamento de Fatura

**Arquivo:** `app/(protected)/compromissos/cards/[id]/pay-invoice-dialog.tsx`

**Adicionar:**
```tsx
import { PaymentMethodSelector } from '@/components/payment-method-selector'

// No formulário:
<PaymentMethodSelector
    context="INVOICE_PAYMENT"
    value={paymentMethodId}
    onChange={setPaymentMethodId}
    required
    label="Como você vai pagar?"
/>
```

---

## 📋 CHECKLIST DE MIGRAÇÃO

Para cada tela:

- [ ] Importar `PaymentMethodSelector`
- [ ] Remover `getPaymentMethods` e state de `methods`
- [ ] Remover lógica de `filteredMethods`
- [ ] Adicionar função `getPaymentContext()` (se necessário)
- [ ] Substituir `<select>` por `<PaymentMethodSelector>`
- [ ] Definir o `context` correto
- [ ] Testar criação/edição
- [ ] Verificar que apenas métodos válidos aparecem

---

## 🎯 CONTEXTOS POR TELA

| Tela | Contexto |
|------|----------|
| Nova Transação (Receita) | `INCOME` |
| Nova Transação (Despesa) | `EXPENSE` |
| Nova Transação (Transferência) | `TRANSFER` |
| Editar Transação | Dinâmico baseado em `type` |
| Contas a Pagar | `EXPENSE` |
| Lançamento de Cartão | `CREDIT_CARD_PAYMENT` |
| Pagamento de Fatura | `INVOICE_PAYMENT` |

---

## ✅ COMO TESTAR

1. Configure formas de pagamento em `/sistema/payment-methods`
2. Marque PIX como: Receita ✅, Despesa ✅, Transferência ✅
3. Marque Cartão de Crédito como: Despesa ✅, Afeta Cartão ✅
4. Teste criar transação de Receita → Só PIX deve aparecer
5. Teste criar transação de Despesa → PIX e Cartão devem aparecer
6. Teste pagamento de fatura → Só PIX deve aparecer (Cartão não pode pagar fatura)

---

## 🚨 ERROS COMUNS

### Erro: "context is not defined"
**Solução:** Definir a função `getPaymentContext()` ou passar contexto fixo

### Erro: "PaymentMethodSelector is not defined"
**Solução:** Verificar import: `import { PaymentMethodSelector } from '@/components/payment-method-selector'`

### Erro: Nenhum método aparece
**Solução:** Verificar se os flags estão configurados corretamente em `/sistema/payment-methods`

---

## 📞 SUPORTE

- **Documentação:** `docs/PAYMENT_METHODS_ARCHITECTURE.md`
- **Guia de Migração:** `docs/MIGRATION_GUIDE.md`
- **Componente:** `src/components/payment-method-selector.tsx`
- **Hook:** `src/hooks/use-payment-methods.ts`

---

**Status Atual:** 🟡 60% Completo  
**Próximo:** Finalizar EditTransactionDialog e migrar outras telas
