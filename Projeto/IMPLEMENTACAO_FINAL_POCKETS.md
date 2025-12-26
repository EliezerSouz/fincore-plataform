# 🚀 IMPLEMENTAÇÃO FINAL: Pockets em Todos os Métodos

**Data**: 26/12/2025 12:35  
**Status**: ⏳ INSTRUÇÕES PARA IMPLEMENTAÇÃO

---

## ✅ JÁ IMPLEMENTADO

- ✅ `createWithTx` - Criação de transação

---

## ⏳ FALTA IMPLEMENTAR

### **1. updateWithTx** (linha ~498)

**Localização**: `backend/internal/infra/repository/transaction_repository.go`

**Modificar UPDATE para incluir pocket_id:**

```go
// Linha ~550
updateQuery := `
    UPDATE transactions 
    SET account_id = $1, pocket_id = $2, category_id = $3, ...
    WHERE id = $X AND user_id = $Y
`

// Adicionar input.PocketID no Exec
tx.Exec(ctx, updateQuery, 
    input.AccountID, input.PocketID, input.CategoryID, ...
)
```

**Modificar lógica de atualização de saldo (linha ~600):**

```go
// Se pocket_id especificado, atualizar pocket
if input.PocketID != nil && *input.PocketID != "" {
    // Reverter saldo antigo do pocket
    // Aplicar novo saldo no pocket
} else {
    // Atualizar account (comportamento atual)
}
```

---

### **2. deleteWithTx** (linha ~650)

**Modificar lógica de reversão de saldo:**

```go
// Buscar pocket_id da transação
var pocketID *string
tx.QueryRow(ctx, "SELECT pocket_id FROM transactions WHERE id = $1", id).Scan(&pocketID)

// Reverter saldo
if pocketID != nil && *pocketID != "" {
    // Reverter saldo do POCKET
    UPDATE pockets SET balance = balance - $1 WHERE id = $2
} else {
    // Reverter saldo da ACCOUNT (comportamento atual)
    UPDATE accounts SET balance = balance - $1 WHERE id = $2
}
```

---

### **3. CreateTransfer** (linha ~404)

**Adicionar pocket_id nos inputs:**

```go
func CreateTransfer(ctx, userID, sourceInput, targetInput) {
    // sourceInput.PocketID = pocket de origem
    // targetInput.PocketID = pocket de destino
    
    // Resto do código permanece igual
    // createWithTx já vai atualizar os pockets corretos
}
```

---

## 🎨 FRONTEND: Link e Cor da Transferência

### **Problema Identificado:**

![Transferências](uploaded_image)

- ⚠️ Falta ícone [ℹ️] para detalhes
- ⚠️ Cor do valor está cinza (deveria ser verde/vermelho)

---

### **Solução 1: Adicionar Link de Detalhes**

**Arquivo**: `apps/web/src/features/transactions/components/transactions-row.tsx`

**Linha ~155**, após `{tx.description}`:

```tsx
{tx.description}
{tx.type === 'transferencia' && (
    <TransferDetailsDialog transaction={tx} />
)}
```

---

### **Solução 2: Cor do Valor**

**Mesmo arquivo, linha ~214-220:**

**SUBSTITUIR:**
```tsx
<div className={`font-bold text-base tracking-tight ${
    tx.type === 'receita' ? 'text-emerald-600 dark:text-emerald-400' :
    tx.type === 'despesa' ? 'text-rose-600 dark:text-rose-400' : 
    'text-slate-600 dark:text-slate-400'
}`}>
    {tx.type === 'despesa' && '- '}{formatCurrency(tx.amount)}
</div>
```

**POR:**
```tsx
<div className={`font-bold text-base tracking-tight ${
    tx.type === 'receita' ? 'text-emerald-600 dark:text-emerald-400' :
    tx.type === 'despesa' ? 'text-rose-600 dark:text-rose-400' :
    tx.type === 'transferencia' ? (
        (tx.description?.toLowerCase().includes('de ') || tx.description?.toLowerCase().includes('recebida'))
            ? 'text-emerald-600 dark:text-emerald-400'  // Entrada - Verde
            : (tx.description?.toLowerCase().includes('para ') || tx.description?.toLowerCase().includes('enviada'))
                ? 'text-rose-600 dark:text-rose-400'  // Saída - Vermelho
                : 'text-blue-600 dark:text-blue-400'  // Fallback
    ) : 'text-slate-600 dark:text-slate-400'
}`}>
    {(tx.type === 'despesa' || 
      (tx.type === 'transferencia' && 
       (tx.description?.toLowerCase().includes('para ') || 
        tx.description?.toLowerCase().includes('enviada')))) && '- '}
    {formatCurrency(tx.amount)}
</div>
```

---

## 📋 CHECKLIST COMPLETO

### Backend:
- [x] ✅ Migration pocket_id executada
- [x] ✅ Entidade Transaction atualizada
- [x] ✅ createWithTx implementado
- [ ] ⏳ updateWithTx - FALTA IMPLEMENTAR
- [ ] ⏳ deleteWithTx - FALTA IMPLEMENTAR
- [ ] ⏳ CreateTransfer - FALTA IMPLEMENTAR

### Frontend:
- [x] ✅ Cores dos ícones (verde/vermelho)
- [x] ✅ Ícones corretos (⬆️/⬇️)
- [x] ✅ Componente TransferDetailsDialog criado
- [ ] ⏳ Link de detalhes - FALTA ADICIONAR
- [ ] ⏳ Cor do valor - FALTA ADICIONAR

---

## 🎯 RESULTADO ESPERADO

### Transferências:
```
⬆️ [verde] Transferência Recebida de BANCO DO BRASIL  [ℹ️]  R$ 300,00 [verde]
⬇️ [vermelho] Transferência Enviada para MERCADO PAGO  [ℹ️]  - R$ 1.000,00 [vermelho]
```

### Saldos:
```
Criar transação R$ 100 com pocket_id
→ Pocket +R$ 100 ✅
```

---

## 📝 ARQUIVOS PARA MODIFICAR

**Backend:**
1. `backend/internal/infra/repository/transaction_repository.go`
   - updateWithTx (linha ~498)
   - deleteWithTx (linha ~650)
   - CreateTransfer (linha ~404)

**Frontend:**
2. `apps/web/src/features/transactions/components/transactions-row.tsx`
   - Linha ~155: Adicionar `<TransferDetailsDialog>`
   - Linha ~214: Atualizar cor do valor

---

**Tudo documentado!** 📚

Agora você tem as instruções completas para finalizar a implementação!
