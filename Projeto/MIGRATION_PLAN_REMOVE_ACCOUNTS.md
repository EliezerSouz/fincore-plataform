# Plano de Migração: Remover Tabela `accounts` Legada

## Status Atual
- ✅ Backend suporta `pockets` como estrutura principal
- ✅ Compatibilidade retroativa implementada (accounts → pockets)
- ⚠️ Frontend ainda usa `/api/accounts` e envia `accountId`
- ⚠️ Tabela `accounts` ainda existe no banco

## Fase 1: Atualizar Frontend (PRÓXIMO PASSO)

### 1.1 Atualizar `financial-transaction-form.tsx`
- [ ] Trocar `getAccounts()` por `getPockets()` ou `getParentAccounts()`
- [ ] Trocar state `accountId` por `pocketId`
- [ ] Atualizar interface `FinancialTransactionFormData`:
  ```typescript
  // Antes:
  accountId: string
  
  // Depois:
  pocketId: string
  ```

### 1.2 Criar novo endpoint/action para Pockets
- [ ] Criar `apps/web/app/(protected)/caixa/pockets/actions.ts`
- [ ] Implementar `getPockets()` que chama `/api/pockets`
- [ ] Ou usar `getParentAccounts()` que já retorna pockets aninhados

### 1.3 Atualizar componentes de seleção
- [ ] Atualizar todos os `<Select>` que mostram contas para mostrar pockets
- [ ] Agrupar por `parent_account` se necessário (ex: "Banco do Brasil > Caixa")

### 1.4 Atualizar actions de transações
- [ ] `apps/web/app/(protected)/caixa/transactions/actions.ts`
- [ ] Trocar `accountId` por `pocketId` em `createTransaction()`
- [ ] Trocar `accountId` por `pocketId` em `updateTransaction()`

## Fase 2: Limpar Backend (DEPOIS DO FRONTEND)

### 2.1 Remover código de compatibilidade
- [ ] Remover lógica de fallback em `transaction_repository.go` (linhas 250-296)
- [ ] Simplificar para apenas buscar por `pocketId`

### 2.2 Remover endpoints legados
- [ ] Deprecar `/api/accounts` (ou fazer retornar erro 410 Gone)
- [ ] Remover `account_handler.go` se não for mais usado
- [ ] Remover `account_repository.go` se não for mais usado

### 2.3 Atualizar validações
- [ ] Garantir que `pocketId` é obrigatório em transações
- [ ] Remover validações de `accountId`

## Fase 3: Migração de Dados (SE NECESSÁRIO)

### 3.1 Verificar dados órfãos
- [ ] Executar query para verificar se há transações antigas com `account_id` mas sem `pocket_id`
- [ ] Se houver, criar script de migração para associar a pockets

### 3.2 Migrar dados históricos
```sql
-- Exemplo de migração (CUIDADO: testar antes!)
UPDATE transactions t
SET pocket_id = (
    SELECT p.id 
    FROM pockets p
    WHERE p.parent_account_id = t.account_id 
      AND p.pocket_type = 'CAIXA'
    LIMIT 1
)
WHERE t.pocket_id IS NULL 
  AND t.account_id IS NOT NULL;
```

## Fase 4: Remover Tabela `accounts`

### 4.1 Backup de segurança
- [ ] Fazer backup completo do banco antes de remover
- [ ] Exportar dados da tabela `accounts` para arquivo (caso precise reverter)

### 4.2 Remover dependências
- [ ] Verificar foreign keys que referenciam `accounts`
- [ ] Atualizar ou remover essas referências

### 4.3 Drop da tabela
```sql
-- ÚLTIMO PASSO - Só executar quando tudo estiver migrado!
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS account_balance_adjustments CASCADE; -- Se não for mais usado
```

### 4.4 Limpar migrations
- [ ] Remover ou comentar migrations antigas que criam/modificam `accounts`
- [ ] Criar migration final que remove a tabela

## Checklist de Validação

Antes de remover `accounts`, garantir que:
- [ ] Todas as transações têm `pocket_id` preenchido
- [ ] Frontend não faz mais chamadas para `/api/accounts`
- [ ] Nenhum código backend referencia `accounts` (exceto migrations antigas)
- [ ] Testes E2E passam sem a tabela `accounts`
- [ ] Usuários conseguem criar/editar/deletar transações normalmente
- [ ] Dashboard e relatórios funcionam corretamente

## Estimativa de Tempo

- **Fase 1 (Frontend)**: 2-4 horas
- **Fase 2 (Backend)**: 1-2 horas
- **Fase 3 (Migração)**: 1-2 horas (se necessário)
- **Fase 4 (Remoção)**: 30 minutos
- **Total**: ~1 dia de trabalho

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Perda de dados históricos | Baixa | Alto | Backup completo antes de qualquer alteração |
| Frontend quebrar | Média | Alto | Testar em ambiente de dev primeiro |
| Transações órfãs | Baixa | Médio | Script de migração de dados antes de remover |
| Rollback difícil | Média | Alto | Manter tabela por 1-2 semanas após migração (renomear para `accounts_deprecated`) |

## Recomendação

**NÃO REMOVA** a tabela `accounts` ainda. Siga este plano:

1. **Hoje**: Deixar a compatibilidade que implementei funcionando
2. **Próxima Sprint**: Migrar o frontend para usar `pockets`
3. **Sprint seguinte**: Testar extensivamente
4. **Depois de 2 semanas sem problemas**: Remover a tabela

Isso garante uma transição suave sem quebrar o sistema em produção.
