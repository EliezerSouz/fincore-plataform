# 🔄 YIELD CALCULATION: Migração de Accounts para Pockets

**Data**: 26/12/2025 10:10  
**Status**: 🟡 EM PROGRESSO (80% concluído)  
**Prioridade**: 🔴 ALTA

---

## ✅ O QUE FOI FEITO

### 1. Migration do Banco de Dados ✅
- ✅ Adicionada coluna `pocket_id` à tabela `liquidity_yields`
- ✅ Criado índice para `pocket_id`
- ✅ Atualizada RLS policy para incluir pockets
- **Arquivo**: `database/migrations/add_pocket_id_to_liquidity_yields.sql`
- **Executado**: Sim

### 2. Entidade LiquidityYield ✅
- ✅ Adicionado campo `PocketID *string`
- ✅ Mantido `AccountID` para compatibilidade (legacy)
- **Arquivo**: `backend/internal/entity/liquidity_yield.go`

### 3. PocketRepository ✅
- ✅ Método `FindAllWithYieldEnabled()` já existe
- ✅ Busca pockets com `pocket_type = 'RESERVA_CDI'` e `yield_enabled = true`
- **Arquivo**: `backend/internal/infra/repository/pocket_repository.go` (linhas 267-303)

### 4. LiquidityYieldService ✅
- ✅ Adicionado `pocketRepo` ao service
- ✅ Atualizado construtor para receber `pocketRepo`
- ✅ Modificado `CalculateDailyYields` para usar pockets
- ✅ Logs atualizados para mostrar "pocket" em vez de "account"
- **Arquivo**: `backend/internal/usecase/liquidity_yield_service.go`

---

## ⏳ O QUE FALTA FAZER

### 1. LiquidityYieldRepository
Adicionar métodos para pockets:

```go
// CheckYieldExistsForPocket verifica se já existe yield para um pocket em uma data
func (r *LiquidityYieldRepository) CheckYieldExistsForPocket(ctx context.Context, pocketID string, date time.Time) (bool, error) {
    query := `SELECT EXISTS(SELECT 1 FROM liquidity_yields WHERE pocket_id = $1 AND date = $2)`
    var exists bool
    err := r.db.QueryRow(ctx, query, pocketID, date).Scan(&exists)
    return exists, err
}

// GetBaseAmountForPocket calcula o valor base para cálculo de yield de um pocket
func (r *LiquidityYieldRepository) GetBaseAmountForPocket(ctx context.Context, pocketID string, targetDate time.Time) (float64, error) {
    // Saldo operacional + rendimentos anteriores
    query := `
        SELECT 
            COALESCE(p.balance, 0) + COALESCE(SUM(ly.yield_amount), 0) as base_amount
        FROM pockets p
        LEFT JOIN liquidity_yields ly ON ly.pocket_id = p.id AND ly.date < $2
        WHERE p.id = $1
        GROUP BY p.balance
    `
    var baseAmount float64
    err := r.db.QueryRow(ctx, query, pocketID, targetDate).Scan(&baseAmount)
    return baseAmount, err
}
```

**Arquivo**: `backend/internal/infra/repository/liquidity_yield_repository.go`

### 2. Atualizar Instanciações do Service
Adicionar `pocketRepo` nos seguintes arquivos:

**a) `backend/internal/infra/scheduler/yield_scheduler.go` (linha 23)**
```go
// ANTES
liquidityYieldService := usecase.NewLiquidityYieldService(yieldRepo, accountRepo)

// DEPOIS
liquidityYieldService := usecase.NewLiquidityYieldService(yieldRepo, accountRepo, pocketRepo)
```

**b) `backend/internal/infra/handler/liquidity_yield_handler.go` (linha 21)**
```go
// ANTES
service: usecase.NewLiquidityYieldService(yieldRepo, accountRepo)

// DEPOIS
service: usecase.NewLiquidityYieldService(yieldRepo, accountRepo, pocketRepo)
```

**c) `backend/cmd/test_yields/main.go` (linha 38)**
```go
// ANTES
service := usecase.NewLiquidityYieldService(yieldRepo, accountRepo)

// DEPOIS
service := usecase.NewLiquidityYieldService(yieldRepo, accountRepo, pocketRepo)
```

### 3. Recompilar e Testar
```powershell
cd backend
go build -o fincore-api.exe cmd/api/main.go
```

---

## 📝 PRÓXIMOS PASSOS (15 min)

1. **Adicionar métodos no LiquidityYieldRepository** (5 min)
   - `CheckYieldExistsForPocket`
   - `GetBaseAmountForPocket`

2. **Atualizar instanciações do service** (5 min)
   - yield_scheduler.go
   - liquidity_yield_handler.go
   - test_yields/main.go

3. **Recompilar e testar** (5 min)
   - Compilar backend
   - Executar cálculo de yield
   - Verificar logs

---

## 🎯 RESULTADO ESPERADO

**Antes:**
```
✅ Yield calculated for account 85f65c8b...: Base=30.01, Yield=0.00, Rate=0.0230%
```

**Depois:**
```
✅ Yield calculated for pocket 85f65c8b... (RESERVA EMERGÊNCIA): Base=30.01, Yield=0.00, Rate=0.0230%
```

---

## 📊 PROGRESSO

- ✅ Migration do banco (100%)
- ✅ Entidade atualizada (100%)
- ✅ Service atualizado (100%)
- ⏳ Repository methods (0%)
- ⏳ Instanciações (0%)
- ⏳ Compilação (0%)

**Total**: 60% concluído

---

**Status**: Pronto para continuar! Faltam apenas os métodos do repository e atualizar as instanciações.
