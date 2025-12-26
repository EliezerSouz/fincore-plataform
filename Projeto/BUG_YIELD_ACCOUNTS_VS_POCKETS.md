# 🐛 BUG: Yield Calculation em Accounts em vez de Pockets

**Data**: 26/12/2025 10:06  
**Status**: 🔍 IDENTIFICADO  
**Prioridade**: 🔴 ALTA

---

## 📋 PROBLEMA

O cálculo automático de yield está sendo feito sobre **accounts** em vez de **pockets**.

**Log atual:**
```
✅ Yield calculated for account 85f65c8b-9521-4ec4-9557-2a723614f04d: Base=30.01, Yield=0.00, Rate=0.0230%
```

**Deveria ser:**
```
✅ Yield calculated for pocket 85f65c8b-9521-4ec4-9557-2a723614f04d: Base=30.01, Yield=0.00, Rate=0.0230%
```

---

## 🔍 ANÁLISE

### Estrutura Atual:

**Accounts (Contas Mãe):**
- Representam instituições financeiras
- Ex: Banco Inter, Nubank, etc.

**Pockets (Subcontas/Bolsos):**
- Subdivisões dentro de uma conta
- Ex: Reserva de Emergência, Investimentos, etc.
- **São os pockets que têm yield, não as accounts!**

### Código Problemático:

**Arquivo:** `backend/internal/usecase/liquidity_yield_service.go`  
**Linha 35:** `accounts, err := s.accountRepo.FindAllWithYieldEnabled(ctx)`

Está buscando accounts com yield enabled, mas deveria buscar **pockets** com yield enabled.

---

## ✅ SOLUÇÃO

### 1. Modificar `LiquidityYieldService`:
- Adicionar `pocketRepo *repository.PocketRepository`
- Buscar pockets em vez de accounts
- Atualizar logs para mostrar "pocket" em vez de "account"

### 2. Criar método no `PocketRepository`:
- `FindAllWithYieldEnabled(ctx context.Context) ([]entity.Pocket, error)`
- Retorna todos os pockets com `yield_enabled = true`

### 3. Atualizar tabela `liquidity_yields`:
- Trocar `account_id` por `pocket_id`
- Ou adicionar ambos (manter compatibilidade)

---

## 📝 PRÓXIMOS PASSOS

1. ✅ Verificar estrutura da tabela `liquidity_yields`
2. ✅ Criar método `FindAllWithYieldEnabled` no `PocketRepository`
3. ✅ Modificar `LiquidityYieldService` para usar pockets
4. ✅ Atualizar logs
5. ✅ Testar cálculo automático

---

**Aguardando confirmação para implementar a correção...**
