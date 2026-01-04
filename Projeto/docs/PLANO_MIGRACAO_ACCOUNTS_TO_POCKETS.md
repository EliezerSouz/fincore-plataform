# 🔄 Plano de Migração: Accounts → Pockets

**Data**: 04/01/2026  
**Status**: Planejado (não iniciado)  
**Prioridade**: Média (após consolidação de migrations)

---

## 📋 Contexto

### Sistema Atual (Dual)

O FinCore atualmente opera com **DOIS sistemas de contas**:

#### 1. **Sistema LEGACY** (`accounts`)
- ❌ Tabela única `accounts`
- ❌ Sem organização por instituição
- ❌ Sem hierarquia
- ❌ Difícil gerenciar múltiplas contas do mesmo banco

#### 2. **Sistema NOVO** (`parent_accounts` + `pockets`)
- ✅ Organização por instituição (`parent_accounts`)
- ✅ Múltiplas subcontas por instituição (`pockets`)
- ✅ Hierarquia clara
- ✅ Saldo consolidado por instituição
- ✅ Rendimento CDI por pocket

### Exemplo Prático

**ANTES (accounts)**:
```
- Nubank Conta Corrente
- Nubank Reserva
- Nubank Investimentos
- Inter Conta Corrente
- Inter Poupança
```
❌ Sem agrupamento, difícil visualizar

**DEPOIS (parent_accounts + pockets)**:
```
📁 Nubank (parent_account)
  ├─ 💰 Conta Corrente (pocket)
  ├─ 🏦 Reserva (pocket)
  └─ 📈 Investimentos (pocket)

📁 Inter (parent_account)
  ├─ 💰 Conta Corrente (pocket)
  └─ 🏦 Poupança (pocket)
```
✅ Organizado, intuitivo, escalável

---

## 🎯 Objetivo

**Descontinuar completamente a tabela `accounts`** e migrar tudo para `parent_accounts` + `pockets`.

---

## 📊 Análise de Impacto

### Backend (Go)

#### Arquivos que usam `accounts`:
```
✅ Mantidos (usam ambos):
- internal/infra/repository/account_repository.go
- internal/infra/handler/account_handler.go
- cmd/api/main.go (linha 54, 79, 87)

⚠️ Precisam migração:
- internal/infra/repository/dashboard_repository.go
- internal/infra/repository/transaction_repository.go
- internal/infra/repository/balance_adjustment_repository.go
- internal/infra/handler/simple_invoice_handler.go
```

#### Endpoints que usam `accounts`:
```
GET    /api/accounts
GET    /api/accounts/:id
POST   /api/accounts
PUT    /api/accounts/:id
DELETE /api/accounts/:id
```

### Frontend (Next.js)

#### Componentes que usam `accounts`:
```
⚠️ Precisam migração:
- src/features/accounts/
- src/features/dashboard/
- src/features/transactions/
```

### Banco de Dados

#### Tabelas que referenciam `accounts`:
```sql
-- transactions.account_id
-- transactions.destination_account_id
-- account_balance_adjustments.account_id
-- liquidity_yields.account_id
-- credit_cards.account_id
```

---

## 🗺️ Plano de Migração

### Fase 1: Preparação (2-4h)
**Objetivo**: Criar estrutura de migração sem quebrar nada

**Tarefas**:
- [ ] Criar migration de dados `002_migrate_accounts_to_pockets.sql`
- [ ] Criar função de migração automática
- [ ] Testar em banco de desenvolvimento
- [ ] Documentar processo

**Script de migração**:
```sql
-- 002_migrate_accounts_to_pockets.sql

-- Para cada account, criar:
-- 1. parent_account (se não existir)
-- 2. pocket correspondente
-- 3. Atualizar referências em transactions, yields, etc

CREATE OR REPLACE FUNCTION migrate_accounts_to_pockets()
RETURNS void AS $$
DECLARE
    v_account RECORD;
    v_parent_id uuid;
    v_pocket_id uuid;
BEGIN
    FOR v_account IN SELECT * FROM accounts WHERE is_active = true LOOP
        -- Criar parent_account (instituição genérica)
        INSERT INTO parent_accounts (user_id, name, type, color, icon)
        VALUES (
            v_account.user_id,
            'Contas Migradas',
            'bank',
            '#3b82f6',
            'building-2'
        )
        ON CONFLICT DO NOTHING
        RETURNING id INTO v_parent_id;
        
        -- Criar pocket
        INSERT INTO pockets (
            parent_account_id,
            user_id,
            name,
            type,
            balance,
            color,
            icon,
            yield_enabled,
            yield_rate,
            last_yield_date
        )
        VALUES (
            v_parent_id,
            v_account.user_id,
            v_account.name,
            v_account.type,
            v_account.balance,
            v_account.color,
            v_account.icon,
            (v_account.yield_rate > 0),
            v_account.yield_rate,
            v_account.last_yield_date
        )
        RETURNING id INTO v_pocket_id;
        
        -- Atualizar transactions
        UPDATE transactions
        SET pocket_id = v_pocket_id
        WHERE account_id = v_account.id;
        
        -- Atualizar balance_adjustments
        UPDATE account_balance_adjustments
        SET pocket_id = v_pocket_id
        WHERE account_id = v_account.id;
        
        -- Atualizar liquidity_yields
        UPDATE liquidity_yields
        SET pocket_id = v_pocket_id
        WHERE account_id = v_account.id;
        
        -- Marcar account como migrado (soft delete)
        UPDATE accounts
        SET is_active = false,
            updated_at = NOW()
        WHERE id = v_account.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

### Fase 2: Backend (4-6h)
**Objetivo**: Atualizar backend para usar apenas pockets

**Tarefas**:
- [ ] Criar `PocketService` (espelhar `AccountService`)
- [ ] Atualizar `DashboardRepository` para usar pockets
- [ ] Atualizar `TransactionRepository` para usar pockets
- [ ] Criar endpoints de compatibilidade `/api/accounts` → `/api/pockets`
- [ ] Testes unitários

**Exemplo de compatibilidade**:
```go
// Manter endpoint antigo funcionando
// GET /api/accounts → retorna pockets formatados como accounts
func (h *AccountHandler) List(c *gin.Context) {
    userID := c.GetString("user_id")
    
    // Buscar pockets
    pockets, err := h.pocketRepo.FindAllByUser(ctx, userID)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    // Converter pockets para formato de accounts (compatibilidade)
    accounts := convertPocketsToAccounts(pockets)
    
    c.JSON(200, accounts)
}
```

---

### Fase 3: Frontend (6-8h)
**Objetivo**: Atualizar frontend para usar pockets

**Tarefas**:
- [ ] Atualizar `src/features/accounts/` para usar pockets
- [ ] Atualizar `src/features/dashboard/` para usar pockets
- [ ] Atualizar `src/features/transactions/` para usar pockets
- [ ] Criar componente de seleção de pocket
- [ ] Testes de integração

**Exemplo de mudança**:
```typescript
// ANTES
const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/api/accounts')
});

// DEPOIS
const { data: pockets } = useQuery({
    queryKey: ['pockets'],
    queryFn: () => api.get('/api/pockets')
});
```

---

### Fase 4: Validação (2-3h)
**Objetivo**: Garantir que tudo funciona

**Tarefas**:
- [ ] Testes E2E completos
- [ ] Validar migração de dados
- [ ] Verificar performance
- [ ] Revisar logs de erro

---

### Fase 5: Remoção (1-2h)
**Objetivo**: Remover código legacy

**Tarefas**:
- [ ] Remover `AccountRepository` (se não usado)
- [ ] Remover `AccountHandler` (se não usado)
- [ ] Remover tabela `accounts` do banco
- [ ] Atualizar documentação
- [ ] Commit final

**Migration de remoção**:
```sql
-- 003_remove_accounts_table.sql

-- Verificar se não há mais referências
SELECT COUNT(*) FROM accounts WHERE is_active = true;
-- Deve retornar 0

-- Remover tabela
DROP TABLE IF EXISTS accounts CASCADE;
```

---

## ⏱️ Cronograma Estimado

| Fase | Duração | Quando |
|------|---------|--------|
| 1. Preparação | 2-4h | Após consolidação de migrations |
| 2. Backend | 4-6h | Semana 2 |
| 3. Frontend | 6-8h | Semana 2-3 |
| 4. Validação | 2-3h | Semana 3 |
| 5. Remoção | 1-2h | Semana 3 |
| **TOTAL** | **15-23h** | **2-3 semanas** |

---

## ✅ Checklist de Validação

Antes de remover `accounts`:

- [ ] Todos os dados migrados para pockets
- [ ] Frontend 100% usando pockets
- [ ] Backend 100% usando pockets
- [ ] Testes E2E aprovados
- [ ] Sem erros em produção
- [ ] Documentação atualizada
- [ ] Usuários notificados (se aplicável)

---

## 🚨 Riscos e Mitigações

### Risco 1: Perda de Dados
**Mitigação**: 
- Backup completo antes de migração
- Manter `accounts` por 30 dias após migração
- Rollback plan documentado

### Risco 2: Quebra de Funcionalidades
**Mitigação**:
- Endpoints de compatibilidade
- Migração gradual (não big bang)
- Testes extensivos

### Risco 3: Performance
**Mitigação**:
- Índices otimizados em pockets
- Queries testadas com dados reais
- Monitoramento de performance

---

## 📝 Notas

### Por que não fazer agora?

1. **Prioridade**: Consolidação de migrations é mais crítica
2. **Estabilidade**: Sistema atual funciona (dual mode)
3. **Tempo**: Requer 15-23h de trabalho focado
4. **Risco**: Mudança grande, precisa de planejamento

### Quando fazer?

**Recomendação**: Após completar:
- ✅ Consolidação de migrations
- ✅ Limpeza de código
- ✅ Testes automatizados
- ✅ Sistema estável em produção

**Prazo sugerido**: 1-2 meses após deploy inicial

---

## 🎯 Decisão

**Status atual**: `accounts` está marcado como **LEGACY** no schema.

**Ação imediata**: 
- ✅ Documentado como legacy
- ✅ Novos desenvolvimentos usam pockets
- ⏳ Migração planejada para futuro

**Próximo passo**: 
Revisar este plano após sistema estar estável em produção.

---

*Plano criado em: 04/01/2026*  
*Última atualização: 04/01/2026*  
*Status: Planejado (aguardando estabilização)*
