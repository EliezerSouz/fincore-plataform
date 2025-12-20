# 🛠️ PLANO DE CORREÇÃO — PADRÃO DE DADOS

**Projeto:** FINCORE Platform  
**Data:** 2025-12-18  
**Responsável:** Equipe de Desenvolvimento  
**Prioridade:** ALTA

---

## 📊 Resumo Executivo

| Métrica | Valor |
|---------|-------|
| **Total de Violações** | 6 campos |
| **Arquivos Afetados** | 4 repositórios |
| **Linhas de Código** | 12 alterações |
| **Tempo Estimado** | 2-3 horas |
| **Risco** | Médio (requer testes) |
| **Impacto** | Alto (melhoria de UX) |

---

## 🎯 FASE 1: Correções Críticas (Prioridade ALTA)

### ✅ Correção 1.1: Transaction Description

**Arquivo:** `backend/internal/infra/repository/transaction_repository.go`

**Problema:** Descrições de transações sendo convertidas para UPPERCASE

**Impacto:** 
- Todas as transações aparecem em MAIÚSCULAS
- Prejudica legibilidade
- Afeta exportações e relatórios

**Correção:**

```go
// ❌ ANTES (linha 210)
input.PaymentMethodID, strings.ToUpper(input.Description), input.Amount, input.Type, input.Date, input.PayableID, input.InvoiceID,

// ✅ DEPOIS (linha 210)
input.PaymentMethodID, input.Description, input.Amount, input.Type, input.Date, input.PayableID, input.InvoiceID,
```

```go
// ❌ ANTES (linha 289)
if input.Description != nil {
    argCount++
    query += fmt.Sprintf(", description = $%d", argCount)
    args = append(args, strings.ToUpper(*input.Description))
}

// ✅ DEPOIS (linha 289)
if input.Description != nil {
    argCount++
    query += fmt.Sprintf(", description = $%d", argCount)
    args = append(args, *input.Description)
}
```

**Teste:**
```bash
# Criar transação com descrição mista
curl -X POST /api/transactions \
  -d '{"description": "Compra no Mercado", "amount": 150.00, "type": "despesa"}'

# Verificar se retorna: "Compra no Mercado" (não "COMPRA NO MERCADO")
```

---

### ✅ Correção 1.2: User Full Name

**Arquivo:** `backend/internal/infra/repository/user_repository.go`

**Problema:** Nomes de usuários sendo convertidos para UPPERCASE

**Impacto:**
- Nome do usuário aparece em MAIÚSCULAS no perfil
- Prejudica personalização
- Afeta comunicações e relatórios

**Correção:**

```go
// ❌ ANTES (linha 46)
err := r.DB.QueryRow(ctx, query,
    user.ID,
    strings.ToUpper(user.FullName),
    user.Email,
    ...

// ✅ DEPOIS (linha 46)
err := r.DB.QueryRow(ctx, query,
    user.ID,
    user.FullName,
    user.Email,
    ...
```

**Teste:**
```bash
# Criar usuário
curl -X POST /api/users \
  -d '{"full_name": "João Silva", "email": "joao@example.com"}'

# Verificar se retorna: "João Silva" (não "JOÃO SILVA")
```

---

### ✅ Correção 1.3: Account Name

**Arquivo:** `backend/internal/infra/repository/account_repository.go`

**Problema:** Nomes de contas sendo convertidos para UPPERCASE

**Impacto:**
- Nomes de contas aparecem em MAIÚSCULAS
- Prejudica identificação visual
- Afeta relatórios e exportações

**Correção:**

```go
// ❌ ANTES (linha 226 - Create)
err := r.db.QueryRow(ctx, query, userID, strings.ToUpper(input.Name), input.Type, input.Balance, input.Color, input.YieldRate).Scan(

// ✅ DEPOIS (linha 226 - Create)
err := r.db.QueryRow(ctx, query, userID, input.Name, input.Type, input.Balance, input.Color, input.YieldRate).Scan(
```

```go
// ❌ ANTES (linha 246 - Update)
if input.Name != nil {
    argCount++
    query += fmt.Sprintf(", name = $%d", argCount)
    args = append(args, strings.ToUpper(*input.Name))
}

// ✅ DEPOIS (linha 246 - Update)
if input.Name != nil {
    argCount++
    query += fmt.Sprintf(", name = $%d", argCount)
    args = append(args, *input.Name)
}
```

**Teste:**
```bash
# Criar conta
curl -X POST /api/accounts \
  -d '{"name": "Conta Corrente Nubank", "type": "LIQUIDITY", "balance": 1000}'

# Verificar se retorna: "Conta Corrente Nubank" (não "CONTA CORRENTE NUBANK")
```

---

## 🎯 FASE 2: Correções Importantes (Prioridade MÉDIA)

### ✅ Correção 2.1: Category Name

**Arquivo:** `backend/internal/infra/repository/category_repository.go`

**Problema:** Nomes de categorias customizadas sendo convertidos para UPPERCASE

**Impacto:**
- Categorias personalizadas aparecem em MAIÚSCULAS
- Prejudica organização visual
- Afeta filtros e relatórios

**Correção:**

```go
// ❌ ANTES (linha 110 - Create)
err := r.db.QueryRow(ctx, query, userID, strings.ToUpper(input.Name), input.Type, input.Icon, input.Color).Scan(

// ✅ DEPOIS (linha 110 - Create)
err := r.db.QueryRow(ctx, query, userID, input.Name, input.Type, input.Icon, input.Color).Scan(
```

```go
// ❌ ANTES (linha 128 - Update)
if input.Name != nil {
    argCount++
    query += fmt.Sprintf(", name = $%d", argCount)
    args = append(args, strings.ToUpper(*input.Name))
}

// ✅ DEPOIS (linha 128 - Update)
if input.Name != nil {
    argCount++
    query += fmt.Sprintf(", name = $%d", argCount)
    args = append(args, *input.Name)
}
```

**Teste:**
```bash
# Criar categoria customizada
curl -X POST /api/categories \
  -d '{"name": "Alimentação Saudável", "type": "DESPESA", "icon": "utensils", "color": "#FF6B6B"}'

# Verificar se retorna: "Alimentação Saudável" (não "ALIMENTAÇÃO SAUDÁVEL")
```

---

### ✅ Correção 2.2: Subcategory Name

**Arquivo:** `backend/internal/infra/repository/category_repository.go`

**Problema:** Nomes de subcategorias sendo convertidos para UPPERCASE

**Impacto:**
- Subcategorias aparecem em MAIÚSCULAS
- Prejudica hierarquia visual
- Afeta organização de despesas

**Correção:**

```go
// ❌ ANTES (linha 184 - CreateSubcategory)
err = r.db.QueryRow(ctx, query, userID, categoryID, strings.ToUpper(name)).Scan(

// ✅ DEPOIS (linha 184 - CreateSubcategory)
err = r.db.QueryRow(ctx, query, userID, categoryID, name).Scan(
```

```go
// ❌ ANTES (linha 201 - UpdateSubcategory)
if input.Name != nil {
    argCount++
    query += fmt.Sprintf(", name = $%d", argCount)
    args = append(args, strings.ToUpper(*input.Name))
}

// ✅ DEPOIS (linha 201 - UpdateSubcategory)
if input.Name != nil {
    argCount++
    query += fmt.Sprintf(", name = $%d", argCount)
    args = append(args, *input.Name)
}
```

**Teste:**
```bash
# Criar subcategoria
curl -X POST /api/categories/{category_id}/subcategories \
  -d '{"name": "Supermercado Orgânico"}'

# Verificar se retorna: "Supermercado Orgânico" (não "SUPERMERCADO ORGÂNICO")
```

---

### ✅ Correção 2.3: Credit Card Name

**Arquivo:** `backend/internal/infra/repository/card_repository.go`

**Problema:** Nomes de cartões sendo convertidos para UPPERCASE

**Impacto:**
- Nomes de cartões aparecem em MAIÚSCULAS
- Prejudica identificação de múltiplos cartões
- Afeta visualização de faturas

**Correção:**

```go
// ❌ ANTES (linha 87 - Create)
err := r.db.QueryRow(ctx, query, userID, strings.ToUpper(input.Name), strings.ToUpper(input.Brand), input.Last4Digits,

// ✅ DEPOIS (linha 87 - Create)
err := r.db.QueryRow(ctx, query, userID, input.Name, strings.ToUpper(input.Brand), input.Last4Digits,
```

```go
// ❌ ANTES (linha 110 - Update)
if input.Name != nil {
    argCount++
    query += fmt.Sprintf(", name = $%d", argCount)
    args = append(args, strings.ToUpper(*input.Name))
}

// ✅ DEPOIS (linha 110 - Update)
if input.Name != nil {
    argCount++
    query += fmt.Sprintf(", name = $%d", argCount)
    args = append(args, *input.Name)
}
```

**Observação:** Manter `strings.ToUpper(input.Brand)` pois `brand` é um dado técnico (VISA, MASTERCARD, etc.)

**Teste:**
```bash
# Criar cartão
curl -X POST /api/credit-cards \
  -d '{"name": "Nubank Platinum", "brand": "mastercard", "last_4_digits": "1234"}'

# Verificar se retorna: 
# - name: "Nubank Platinum" (não "NUBANK PLATINUM")
# - brand: "MASTERCARD" (deve continuar em UPPERCASE)
```

---

## 🎯 FASE 3: Auditoria Complementar

### 🔍 Tarefa 3.1: Auditar Payables Repository

**Arquivo:** `backend/internal/infra/repository/payables_repository.go` (se existir)

**Verificar:**
- [ ] Campo `description` não deve ter `ToUpper`
- [ ] Campo `status` deve ter `ToUpper` (dado técnico)
- [ ] Campo `recurrence_type` deve ter `ToUpper` (dado técnico)

**Ação:**
```bash
# Buscar arquivo
find backend -name "*payable*repository*.go"

# Verificar uso de ToUpper
grep -n "ToUpper" backend/internal/infra/repository/*payable*.go
```

---

### 🔍 Tarefa 3.2: Auditar Payment Methods Repository

**Arquivo:** `backend/internal/infra/repository/payment_methods_repository.go` (se existir)

**Verificar:**
- [ ] Campo `name` - determinar se é enum ou texto livre
  - Se enum (PIX, DINHEIRO): aplicar `ToUpper`
  - Se texto livre customizado: NÃO aplicar `ToUpper`
- [ ] Campo `type` deve ter `ToUpper` (dado técnico)

**Ação:**
```bash
# Buscar arquivo
find backend -name "*payment*method*repository*.go"

# Verificar implementação
grep -A 5 -B 5 "ToUpper" backend/internal/infra/repository/*payment*.go
```

---

### 🔍 Tarefa 3.3: Auditar Invoice Repository

**Arquivo:** `backend/internal/infra/repository/invoice_repository.go` (se existir)

**Verificar:**
- [ ] Campo `status` deve ter `ToUpper` (dado técnico: OPEN, CLOSED, PAID)
- [ ] Verificar se há campos de texto livre

**Ação:**
```bash
# Buscar arquivo
find backend -name "*invoice*repository*.go"

# Verificar uso de ToUpper
grep -n "ToUpper" backend/internal/infra/repository/*invoice*.go
```

---

## 🎯 FASE 4: Validação e Testes

### ✅ Teste 4.1: Testes Unitários

**Criar/Atualizar testes para cada repositório:**

```go
// Exemplo: account_repository_test.go
func TestCreateAccount_PreservesNameCase(t *testing.T) {
    repo := NewAccountRepository(db)
    
    input := entity.CreateAccountInput{
        Name: "Conta Corrente Nubank",
        Type: "LIQUIDITY",
        Balance: 1000.00,
    }
    
    account, err := repo.Create(ctx, userID, input)
    
    assert.NoError(t, err)
    assert.Equal(t, "Conta Corrente Nubank", account.Name)
    assert.NotEqual(t, "CONTA CORRENTE NUBANK", account.Name)
}
```

**Arquivos de teste a criar/atualizar:**
- [ ] `account_repository_test.go`
- [ ] `category_repository_test.go`
- [ ] `transaction_repository_test.go`
- [ ] `card_repository_test.go`
- [ ] `user_repository_test.go`

---

### ✅ Teste 4.2: Testes de Integração

**Testar fluxo completo:**

```bash
# 1. Criar conta
POST /api/accounts
{
  "name": "Conta Teste",
  "type": "LIQUIDITY",
  "balance": 1000
}

# 2. Criar transação
POST /api/transactions
{
  "account_id": "{account_id}",
  "description": "Compra no Mercado",
  "amount": 150.00,
  "type": "despesa"
}

# 3. Listar transações
GET /api/transactions

# 4. Verificar que description = "Compra no Mercado" (não "COMPRA NO MERCADO")
```

---

### ✅ Teste 4.3: Teste de Busca Case-Insensitive

**Verificar que buscas funcionam independente de case:**

```sql
-- Deve funcionar independente de como foi salvo
SELECT * FROM accounts WHERE LOWER(name) LIKE LOWER('%nubank%');
SELECT * FROM transactions WHERE description ILIKE '%mercado%';
```

**Implementar no código:**

```go
// Exemplo de busca case-insensitive
func (r *AccountRepository) SearchByName(ctx context.Context, userID, searchTerm string) ([]entity.Account, error) {
    query := `
        SELECT id, name, type, balance
        FROM accounts
        WHERE user_id = $1
          AND LOWER(name) LIKE LOWER($2)
    `
    
    rows, err := r.db.Query(ctx, query, userID, "%"+searchTerm+"%")
    // ...
}
```

---

### ✅ Teste 4.4: Teste de Migração de Dados

**Se houver dados existentes em UPPERCASE, criar script de migração:**

```sql
-- Script de migração (OPCIONAL - apenas se necessário)
-- Converter dados existentes para Title Case

-- Exemplo para accounts (executar com cuidado!)
UPDATE accounts 
SET name = INITCAP(LOWER(name))
WHERE name = UPPER(name);

-- Exemplo para transactions
UPDATE transactions 
SET description = INITCAP(LOWER(description))
WHERE description = UPPER(description);
```

**⚠️ ATENÇÃO:** 
- Fazer backup antes de executar
- Testar em ambiente de desenvolvimento primeiro
- Considerar se realmente é necessário (dados antigos podem permanecer)

---

## 📋 CHECKLIST DE EXECUÇÃO

### Preparação
- [ ] Criar branch: `fix/data-standard-compliance`
- [ ] Fazer backup do banco de dados
- [ ] Revisar documentação (PADRAO_OFICIAL_DADOS.md)
- [ ] Comunicar equipe sobre mudanças

### Fase 1: Correções Críticas
- [ ] Corrigir `transaction_repository.go` (linhas 210, 289)
- [ ] Corrigir `user_repository.go` (linha 46)
- [ ] Corrigir `account_repository.go` (linhas 226, 246)
- [ ] Executar testes unitários
- [ ] Executar testes de integração

### Fase 2: Correções Importantes
- [ ] Corrigir `category_repository.go` (linhas 110, 128)
- [ ] Corrigir `category_repository.go` subcategories (linhas 184, 201)
- [ ] Corrigir `card_repository.go` (linhas 87, 110)
- [ ] Executar testes unitários
- [ ] Executar testes de integração

### Fase 3: Auditoria
- [ ] Auditar `payables_repository.go`
- [ ] Auditar `payment_methods_repository.go`
- [ ] Auditar `invoice_repository.go`
- [ ] Auditar outros módulos (Investments, Reports)

### Fase 4: Validação
- [ ] Criar/atualizar testes unitários
- [ ] Executar testes de integração completos
- [ ] Testar buscas case-insensitive
- [ ] Validar formatação no frontend
- [ ] Testar exportações (CSV, PDF)

### Finalização
- [ ] Code review
- [ ] Atualizar documentação
- [ ] Merge para develop
- [ ] Deploy em staging
- [ ] Testes de aceitação
- [ ] Deploy em produção

---

## 🚨 RISCOS E MITIGAÇÕES

### Risco 1: Quebra de Funcionalidades Existentes
**Probabilidade:** Média  
**Impacto:** Alto  
**Mitigação:**
- Executar suite completa de testes
- Testar manualmente fluxos críticos
- Deploy gradual (staging → produção)

### Risco 2: Dados Inconsistentes no Banco
**Probabilidade:** Baixa  
**Impacto:** Médio  
**Mitigação:**
- Não alterar dados existentes (apenas novos registros)
- Se necessário, criar script de migração opcional
- Manter compatibilidade com dados antigos

### Risco 3: Buscas Quebradas
**Probabilidade:** Baixa  
**Impacto:** Alto  
**Mitigação:**
- Implementar buscas case-insensitive (ILIKE, LOWER)
- Testar todos os filtros e pesquisas
- Criar índices funcionais se necessário

---

## 📊 MÉTRICAS DE SUCESSO

### Antes da Correção
- ❌ 6 campos com UPPERCASE indevido
- ❌ 100% dos dados humanos em MAIÚSCULAS
- ❌ UX prejudicada

### Depois da Correção
- ✅ 0 violações do padrão
- ✅ Dados humanos preservados como digitados
- ✅ UX melhorada
- ✅ Exportações legíveis
- ✅ Preparado para IA e integrações

---

## 📅 CRONOGRAMA ESTIMADO

| Fase | Duração | Responsável |
|------|---------|-------------|
| Fase 1: Correções Críticas | 1 hora | Dev Backend |
| Fase 2: Correções Importantes | 1 hora | Dev Backend |
| Fase 3: Auditoria | 30 min | Dev Backend |
| Fase 4: Testes | 1 hora | QA + Dev |
| Code Review | 30 min | Tech Lead |
| Deploy Staging | 15 min | DevOps |
| Testes Aceitação | 30 min | QA |
| Deploy Produção | 15 min | DevOps |
| **TOTAL** | **4-5 horas** | - |

---

## 📞 COMUNICAÇÃO

### Stakeholders a Notificar
- [ ] Equipe de Desenvolvimento
- [ ] Equipe de QA
- [ ] Product Owner
- [ ] Usuários Beta (se aplicável)

### Mensagem de Comunicação

```
📢 ATUALIZAÇÃO: Melhoria no Padrão de Dados

Estamos implementando melhorias no armazenamento de dados para 
proporcionar uma experiência mais natural e legível.

MUDANÇAS:
✅ Nomes, descrições e textos livres agora preservam a formatação original
✅ Melhor legibilidade em relatórios e exportações
✅ Preparação para futuras integrações com IA

IMPACTO:
- Novos registros: formatação preservada
- Registros existentes: sem alteração
- Funcionalidades: sem mudanças

CRONOGRAMA:
- Deploy Staging: [DATA]
- Deploy Produção: [DATA]
```

---

> **Próxima Ação:** Iniciar Fase 1 - Correções Críticas
