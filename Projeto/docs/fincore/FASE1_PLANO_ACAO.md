# PLANO DE AÇÃO - FASE 1: ESTABILIZAÇÃO CRÍTICA

**Branch:** `fix/fase1-estabilizacao-critica`  
**Prazo:** 2-4 semanas  
**Prioridade:** 🔴 IMEDIATA

---

## OBJETIVOS DA FASE 1

Corrigir as **11 inconsistências críticas** que impedem o sistema de ir para produção:

1. ✅ Duplicação de ENUMs (parcialmente corrigido)
2. ⏳ Race conditions em saldo
3. ⏳ Ausência de transações explícitas no backend
4. ⏳ Validações apenas no frontend
5. ⏳ Falta de auditoria
6. ⏳ Falta de idempotência
7. ⏳ Hard delete em dados financeiros
8. ⏳ CASCADE sem validação
9. ⏳ Campo balance persistido (anti-pattern)
10. ⏳ Estados derivados não sincronizados
11. ⏳ Falta de soft delete

---

## CORREÇÃO #1: CONSOLIDAR E CORRIGIR ENUMs

### Status: ⏳ EM PROGRESSO

### Problema
- ENUMs duplicados entre migrations antigas e `20250101_full_schema.sql`
- `subscription_status` tem valores conflitantes
- `subscription_plan` vs `subscription_plan_type_v2`
- `tipo_conta` (ENUM) vs `account.type` (TEXT)

### Solução
1. Criar migration que:
   - Remove ENUMs antigos conflitantes
   - Mantém apenas versões consolidadas
   - Migra dados existentes
   - Adiciona constraints para garantir valores válidos

### Arquivos a Criar
- `apps/web/supabase/migrations/20251223010000_consolidate_enums.sql`

### Impacto
- **Risco:** Médio (requer migração de dados)
- **Benefício:** Elimina conflitos e garante consistência

---

## CORREÇÃO #2: ADICIONAR LOCKS EM TRIGGERS DE SALDO

### Status: ⏳ PENDENTE

### Problema
Trigger `handle_balance_update()` atualiza saldo sem lock, permitindo race conditions.

### Solução
Modificar trigger para usar `SELECT ... FOR UPDATE`:

```sql
CREATE OR REPLACE FUNCTION public.handle_balance_update()
RETURNS TRIGGER AS $$
DECLARE
    v_current_balance NUMERIC;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.is_paid = true THEN
            -- Lock da conta antes de atualizar
            SELECT balance INTO v_current_balance 
            FROM public.accounts 
            WHERE id = NEW.account_id 
            FOR UPDATE;
            
            -- Atualiza com valor locked
            IF NEW.type = 'receita' THEN
                UPDATE public.accounts 
                SET balance = balance + NEW.amount 
                WHERE id = NEW.account_id;
            -- ... resto da lógica
```

### Arquivos a Modificar
- `apps/web/supabase/migrations/20251223020000_add_locks_to_balance_trigger.sql`

### Impacto
- **Risco:** Baixo
- **Benefício:** Elimina race conditions em saldo

---

## CORREÇÃO #3: IMPLEMENTAR TRANSAÇÕES EXPLÍCITAS NO BACKEND

### Status: ⏳ PENDENTE

### Problema
Operações críticas no backend não usam transações explícitas.

### Solução
Modificar services para usar transações:

```go
func (s *PayableService) Pay(ctx context.Context, userID, payableID string, input entity.PayPayableInput) error {
    // Iniciar transação
    tx, err := s.db.BeginTx(ctx, nil)
    if err != nil {
        return err
    }
    defer tx.Rollback()

    // Operação 1: Criar transação
    err = s.transactionRepo.CreateWithTx(ctx, tx, &transaction)
    if err != nil {
        return err
    }

    // Operação 2: Atualizar payable
    err = s.payableRepo.UpdateWithTx(ctx, tx, payableID, updateInput)
    if err != nil {
        return err
    }

    // Commit
    return tx.Commit()
}
```

### Arquivos a Modificar
- `backend/internal/usecase/payable_service.go`
- `backend/internal/usecase/invoice_service.go`
- `backend/internal/infra/repository/*.go` (adicionar métodos `*WithTx`)

### Impacto
- **Risco:** Médio (requer refatoração)
- **Benefício:** Garante atomicidade de operações

---

## CORREÇÃO #4: MOVER VALIDAÇÕES CRÍTICAS PARA O BACKEND

### Status: ⏳ PENDENTE

### Problema
Validações financeiras críticas estão apenas no frontend.

### Solução
Adicionar camada de validação no backend:

```go
// backend/internal/usecase/validator/transaction_validator.go
type TransactionValidator struct {
    accountRepo *repository.AccountRepository
}

func (v *TransactionValidator) ValidateCreate(ctx context.Context, input entity.CreateTransactionInput, userID string) error {
    // Validar saldo
    if input.Type == "despesa" {
        account, err := v.accountRepo.GetByID(ctx, input.AccountID, userID)
        if err != nil {
            return err
        }
        
        if account.Balance < input.Amount {
            return errors.New("saldo insuficiente")
        }
    }
    
    // Validar data
    if input.Date.After(time.Now()) {
        return errors.New("data não pode ser futura")
    }
    
    // ... outras validações
    
    return nil
}
```

### Arquivos a Criar
- `backend/internal/usecase/validator/transaction_validator.go`
- `backend/internal/usecase/validator/payable_validator.go`
- `backend/internal/usecase/validator/invoice_validator.go`

### Impacto
- **Risco:** Baixo
- **Benefício:** Garante integridade dos dados

---

## CORREÇÃO #5: IMPLEMENTAR AUDITORIA BÁSICA

### Status: ⏳ PENDENTE

### Problema
Não há rastreamento de operações financeiras.

### Solução
Criar tabela de auditoria e triggers:

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
```

### Arquivos a Criar
- `apps/web/supabase/migrations/20251223030000_create_audit_log.sql`
- `apps/web/supabase/migrations/20251223031000_add_audit_triggers.sql`

### Impacto
- **Risco:** Baixo
- **Benefício:** Rastreabilidade completa

---

## CRONOGRAMA DE EXECUÇÃO

| Correção | Prioridade | Esforço | Prazo | Status |
|----------|------------|---------|-------|--------|
| #1: Consolidar ENUMs | 🔴 Alta | 4h | Dia 1 | ⏳ Em Progresso |
| #2: Locks em Saldo | 🔴 Alta | 2h | Dia 1 | ⏳ Pendente |
| #3: Transações Backend | 🔴 Alta | 8h | Dia 2-3 | ⏳ Pendente |
| #4: Validações Backend | 🔴 Alta | 6h | Dia 3-4 | ⏳ Pendente |
| #5: Auditoria Básica | 🟠 Média | 4h | Dia 4-5 | ⏳ Pendente |

**Total Estimado:** 24 horas (3-5 dias de trabalho focado)

---

## PRÓXIMOS PASSOS

1. ✅ Criar branch `fix/fase1-estabilizacao-critica`
2. ⏳ Executar Correção #1 (Consolidar ENUMs)
3. ⏳ Executar Correção #2 (Locks em Saldo)
4. ⏳ Executar Correção #3 (Transações Backend)
5. ⏳ Executar Correção #4 (Validações Backend)
6. ⏳ Executar Correção #5 (Auditoria Básica)
7. ⏳ Testar todas as correções
8. ⏳ Merge para main
9. ⏳ Deploy em ambiente de staging

---

**Última Atualização:** 22/12/2025 23:50
