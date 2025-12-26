# ✅ CÓDIGO FINAL PARA COPIAR E COLAR

**Data**: 26/12/2025 12:36  

---

## 🎨 FRONTEND - Transferências

### **Arquivo**: `apps/web/src/features/transactions/components/transactions-row.tsx`

---

### **1. Adicionar Link de Detalhes (Linha ~155)**

**ENCONTRE:**
```tsx
{tx.description}
</span>
```

**SUBSTITUA POR:**
```tsx
{tx.description}
{tx.type === 'transferencia' && (
    <TransferDetailsDialog transaction={tx} />
)}
</span>
```

---

### **2. Cor do Valor (Linha ~214-220)**

**ENCONTRE:**
```tsx
<td className="p-3 text-right">
    <div className={`font-bold text-base tracking-tight ${tx.type === 'receita' ? 'text-emerald-600 dark:text-emerald-400' :
        tx.type === 'despesa' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
        }`}>
        {tx.type === 'despesa' && '- '}{formatCurrency(tx.amount)}
    </div>
</td>
```

**SUBSTITUA POR:**
```tsx
<td className="p-3 text-right">
    <div className={`font-bold text-base tracking-tight ${
        tx.type === 'receita' ? 'text-emerald-600 dark:text-emerald-400' :
        tx.type === 'despesa' ? 'text-rose-600 dark:text-rose-400' :
        tx.type === 'transferencia' ? (
            (tx.description?.toLowerCase().includes('de ') || tx.description?.toLowerCase().includes('recebida'))
                ? 'text-emerald-600 dark:text-emerald-400'
                : (tx.description?.toLowerCase().includes('para ') || tx.description?.toLowerCase().includes('enviada'))
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-blue-600 dark:text-blue-400'
        ) : 'text-slate-600 dark:text-slate-400'
    }`}>
        {(tx.type === 'despesa' || (tx.type === 'transferencia' && (tx.description?.toLowerCase().includes('para ') || tx.description?.toLowerCase().includes('enviada')))) && '- '}
        {formatCurrency(tx.amount)}
    </div>
</td>
```

---

## 🔧 BACKEND - Métodos Restantes

### **Arquivo**: `backend/internal/infra/repository/transaction_repository.go`

---

### **3. deleteWithTx (Linha ~650)**

**ENCONTRE a seção de reversão de saldo:**
```go
// Revert Balance
if !t.IsHistorical {
    balanceChange := t.Amount
    if t.Type == "despesa" {
        balanceChange = -balanceChange
    }

    updateBalanceQuery := `
        UPDATE accounts
        SET balance = balance - $1, updated_at = NOW()
        WHERE id = $2 AND user_id = $3
    `
    if _, err := tx.Exec(ctx, updateBalanceQuery, balanceChange, t.AccountID, userID); err != nil {
        return fmt.Errorf("failed to update account balance: %w", err)
    }
}
```

**SUBSTITUA POR:**
```go
// Revert Balance
if !t.IsHistorical {
    balanceChange := t.Amount
    if t.Type == "despesa" {
        balanceChange = -balanceChange
    } else if t.Type == "transferencia" {
        descLower := strings.ToLower(t.Description)
        if strings.Contains(descLower, "para") {
            balanceChange = -balanceChange
        }
    }

    // Reverter saldo do POCKET se pocket_id especificado, senão ACCOUNT
    if t.PocketID != nil && *t.PocketID != "" {
        updateBalanceQuery := `
            UPDATE pockets
            SET balance = balance - $1, updated_at = NOW()
            WHERE id = $2 AND user_id = $3
        `
        if _, err := tx.Exec(ctx, updateBalanceQuery, balanceChange, *t.PocketID, userID); err != nil {
            return fmt.Errorf("failed to update pocket balance: %w", err)
        }
        fmt.Printf("   ✅ POCKET balance reverted\n")
    } else {
        updateBalanceQuery := `
            UPDATE accounts
            SET balance = balance - $1, updated_at = NOW()
            WHERE id = $2 AND user_id = $3
        `
        if _, err := tx.Exec(ctx, updateBalanceQuery, balanceChange, t.AccountID, userID); err != nil {
            return fmt.Errorf("failed to update account balance: %w", err)
        }
        fmt.Printf("   ✅ ACCOUNT balance reverted\n")
    }
}
```

---

## ✅ CHECKLIST FINAL

### Frontend:
- [x] ✅ Import TransferDetailsDialog
- [ ] ⏳ Adicionar link [ℹ️] (código acima)
- [ ] ⏳ Cor do valor (código acima)

### Backend:
- [x] ✅ createWithTx
- [ ] ⏳ deleteWithTx (código acima)
- [ ] ⏳ updateWithTx (similar ao createWithTx)

---

## 🎯 RESULTADO ESPERADO

```
⬆️ [verde] Transferência Recebida de BANCO  [ℹ️]  R$ 300,00 [verde]
⬇️ [vermelho] Transferência Enviada para X  [ℹ️]  - R$ 1.000,00 [vermelho]
```

---

**Copie e cole os códigos acima nos arquivos indicados!** 📋
