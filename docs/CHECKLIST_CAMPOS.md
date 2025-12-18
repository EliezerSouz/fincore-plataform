# 📋 CHECKLIST DE CAMPOS — FINCORE

**Referência:** PADRAO OFICIAL DE DADOS.md  
**Última Atualização:** 2025-12-18

---

## 🎯 Legenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Campo técnico - UPPERCASE obrigatório |
| ❌ | Campo humano - NUNCA usar UPPERCASE |
| ⚠️ | Campo híbrido - Preservar entrada, normalizar para busca |
| 🔍 | Requer auditoria/verificação |

---

## 📊 TABELA: `users`

| Campo | Tipo | Status | ToUpper? | Justificativa |
|-------|------|--------|----------|---------------|
| `id` | UUID | - | Não | Identificador técnico |
| `full_name` | Text | ❌ | **NÃO** | Nome de pessoa (dado humano) |
| `email` | Text | ⚠️ | **NÃO** | Email (normalizar com LOWER) |
| `subscription_status` | Enum | ✅ | **SIM** | Status técnico (ACTIVE, INACTIVE, TRIAL) |
| `subscription_plan` | Enum | ✅ | **SIM** | Plano técnico (FREE, PRO, PREMIUM) |
| `base_plan` | Enum | ✅ | **SIM** | Plano base técnico |
| `billing_cycle` | Enum | ✅ | **SIM** | Ciclo técnico (MONTHLY, YEARLY) |
| `temp_access_origin` | Text | ✅ | **SIM** | Origem técnica (PROMO, TRIAL) |

---

## 📊 TABELA: `accounts`

| Campo | Tipo | Status | ToUpper? | Justificativa |
|-------|------|--------|----------|---------------|
| `id` | UUID | - | Não | Identificador técnico |
| `name` | Text | ❌ | **NÃO** | Nome da conta (dado humano) |
| `type` | Enum | ✅ | **SIM** | Tipo técnico (LIQUIDITY, INVESTMENT, SAVINGS) |
| `balance` | Numeric | - | Não | Valor numérico |
| `color` | Text | - | Não | Código de cor (#RRGGBB) |
| `yield_rate` | Numeric | - | Não | Taxa percentual |
| `is_active` | Boolean | - | Não | Flag booleano |

**Violação Atual:** ❌ `name` está com `ToUpper` nas linhas 226 e 246 de `account_repository.go`

---

## 📊 TABELA: `categories`

| Campo | Tipo | Status | ToUpper? | Justificativa |
|-------|------|--------|----------|---------------|
| `id` | UUID | - | Não | Identificador técnico |
| `name` | Text | ⚠️ | **NÃO** | Nome de categoria (híbrido - preservar entrada) |
| `type` | Enum | ✅ | **SIM** | Tipo técnico (RECEITA, DESPESA) |
| `icon` | Text | - | Não | Nome do ícone (kebab-case) |
| `color` | Text | - | Não | Código de cor |
| `is_active` | Boolean | - | Não | Flag booleano |

**Violação Atual:** ❌ `name` está com `ToUpper` nas linhas 110 e 128 de `category_repository.go`

**Observação:** Categorias podem ser customizadas pelo usuário, portanto são dados híbridos. Preservar a entrada original e normalizar apenas para busca.

---

## 📊 TABELA: `subcategories`

| Campo | Tipo | Status | ToUpper? | Justificativa |
|-------|------|--------|----------|---------------|
| `id` | UUID | - | Não | Identificador técnico |
| `category_id` | UUID | - | Não | Referência |
| `name` | Text | ❌ | **NÃO** | Nome de subcategoria (dado humano) |
| `is_active` | Boolean | - | Não | Flag booleano |

**Violação Atual:** ❌ `name` está com `ToUpper` nas linhas 184 e 201 de `category_repository.go`

---

## 📊 TABELA: `transactions`

| Campo | Tipo | Status | ToUpper? | Justificativa |
|-------|------|--------|----------|---------------|
| `id` | UUID | - | Não | Identificador técnico |
| `account_id` | UUID | - | Não | Referência |
| `category_id` | UUID | - | Não | Referência |
| `subcategory_id` | UUID | - | Não | Referência |
| `payment_method_id` | UUID | - | Não | Referência |
| `description` | Text | ❌ | **NÃO** | Descrição livre (dado humano) |
| `amount` | Numeric | - | Não | Valor numérico |
| `type` | Enum | ✅ | **SIM** | Tipo técnico (RECEITA, DESPESA, TRANSFERENCIA) |
| `date` | Date | - | Não | Data |
| `payable_id` | UUID | - | Não | Referência |
| `credit_card_invoice_id` | UUID | - | Não | Referência |
| `related_transaction_id` | UUID | - | Não | Referência |

**Violação Atual:** ❌ `description` está com `ToUpper` nas linhas 210 e 289 de `transaction_repository.go`

---

## 📊 TABELA: `credit_cards`

| Campo | Tipo | Status | ToUpper? | Justificativa |
|-------|------|--------|----------|---------------|
| `id` | UUID | - | Não | Identificador técnico |
| `name` | Text | ⚠️ | **NÃO** | Nome do cartão (híbrido - ex: "Nubank Platinum") |
| `brand` | Enum | ✅ | **SIM** | Bandeira técnica (VISA, MASTERCARD, ELO, AMEX) |
| `last_4_digits` | Text | - | Não | Últimos 4 dígitos (numérico) |
| `limit_amount` | Numeric | - | Não | Valor numérico |
| `closing_day` | Integer | - | Não | Dia do mês (1-31) |
| `due_day` | Integer | - | Não | Dia do mês (1-31) |
| `color` | Text | - | Não | Código de cor |

**Violação Atual:** ❌ `name` está com `ToUpper` nas linhas 87 e 110 de `card_repository.go`  
**Implementação Correta:** ✅ `brand` está com `ToUpper` nas linhas 87 e 115 (CORRETO!)

---

## 📊 TABELA: `credit_card_invoices`

| Campo | Tipo | Status | ToUpper? | Justificativa |
|-------|------|--------|----------|---------------|
| `id` | UUID | - | Não | Identificador técnico |
| `credit_card_id` | UUID | - | Não | Referência |
| `month` | Integer | - | Não | Mês (1-12) |
| `year` | Integer | - | Não | Ano (YYYY) |
| `status` | Enum | ✅ | **SIM** | Status técnico (OPEN, CLOSED, PAID, OVERDUE) |
| `total_amount` | Numeric | - | Não | Valor numérico |
| `paid_amount` | Numeric | - | Não | Valor numérico |
| `closing_date` | Date | - | Não | Data |
| `due_date` | Date | - | Não | Data |

**Status:** 🔍 Requer auditoria do repositório

---

## 📊 TABELA: `payables` (Contas a Pagar)

| Campo | Tipo | Status | ToUpper? | Justificativa |
|-------|------|--------|----------|---------------|
| `id` | UUID | - | Não | Identificador técnico |
| `description` | Text | ❌ | **NÃO** | Descrição livre (dado humano) |
| `amount` | Numeric | - | Não | Valor numérico |
| `due_date` | Date | - | Não | Data |
| `status` | Enum | ✅ | **SIM** | Status técnico (PENDING, PAID, OVERDUE) |
| `category_id` | UUID | - | Não | Referência |
| `recurrence_type` | Enum | ✅ | **SIM** | Tipo técnico (NONE, MONTHLY, YEARLY) |

**Status:** 🔍 Requer auditoria do repositório

---

## 📊 TABELA: `payment_methods`

| Campo | Tipo | Status | ToUpper? | Justificativa |
|-------|------|--------|----------|---------------|
| `id` | UUID | - | Não | Identificador técnico |
| `name` | Text | ⚠️ | **DEPENDE** | Se enum: SIM (PIX, DINHEIRO, DEBITO). Se customizado: NÃO |
| `type` | Enum | ✅ | **SIM** | Tipo técnico (CASH, DEBIT, CREDIT, PIX, TRANSFER) |
| `is_active` | Boolean | - | Não | Flag booleano |

**Status:** 🔍 Requer auditoria - verificar se `name` é enum ou texto livre

---

## 📊 TABELA: `liquidity_yields`

| Campo | Tipo | Status | ToUpper? | Justificativa |
|-------|------|--------|----------|---------------|
| `id` | UUID | - | Não | Identificador técnico |
| `account_id` | UUID | - | Não | Referência |
| `date` | Date | - | Não | Data |
| `base_amount` | Numeric | - | Não | Valor numérico |
| `yield_amount` | Numeric | - | Não | Valor numérico |
| `rate_applied` | Numeric | - | Não | Taxa percentual |

**Status:** ✅ Sem campos de texto - apenas numéricos e datas

---

## 🎯 RESUMO DE VIOLAÇÕES POR TABELA

| Tabela | Campos Violados | Prioridade |
|--------|-----------------|------------|
| `users` | `full_name` | 🔴 ALTA |
| `accounts` | `name` | 🔴 ALTA |
| `categories` | `name` | 🟡 MÉDIA |
| `subcategories` | `name` | 🟡 MÉDIA |
| `transactions` | `description` | 🔴 ALTA |
| `credit_cards` | `name` | 🟡 MÉDIA |
| `payables` | `description` (provável) | 🔍 Verificar |
| `payment_methods` | `name` (depende) | 🔍 Verificar |

---

## 📝 CAMPOS TÉCNICOS (UPPERCASE Obrigatório)

### Enums de Status
- `users.subscription_status` → ACTIVE, INACTIVE, TRIAL, CANCELLED
- `users.subscription_plan` → FREE, PRO, PREMIUM
- `users.billing_cycle` → MONTHLY, YEARLY
- `accounts.type` → LIQUIDITY, INVESTMENT, SAVINGS
- `categories.type` → RECEITA, DESPESA
- `transactions.type` → RECEITA, DESPESA, TRANSFERENCIA
- `credit_card_invoices.status` → OPEN, CLOSED, PAID, OVERDUE
- `payables.status` → PENDING, PAID, OVERDUE
- `payables.recurrence_type` → NONE, MONTHLY, YEARLY

### Códigos e Identificadores Técnicos
- `credit_cards.brand` → VISA, MASTERCARD, ELO, AMEX, HIPERCARD
- `payment_methods.type` → CASH, DEBIT, CREDIT, PIX, TRANSFER
- `users.temp_access_origin` → PROMO, TRIAL, REFERRAL

---

## 📝 CAMPOS HUMANOS (NUNCA UPPERCASE)

### Nomes e Títulos
- `users.full_name` → "João Silva"
- `accounts.name` → "Conta Corrente"
- `transactions.description` → "Compra no supermercado"
- `payables.description` → "Aluguel apartamento"

### Campos Híbridos (Preservar Entrada)
- `categories.name` → "Alimentação" (pode ser customizado)
- `subcategories.name` → "Supermercado"
- `credit_cards.name` → "Nubank Platinum"
- `payment_methods.name` → "PIX" (se enum) ou "Carteira Digital" (se customizado)

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Correções Críticas
- [ ] Remover `ToUpper` de `users.full_name` (user_repository.go:46)
- [ ] Remover `ToUpper` de `transactions.description` (transaction_repository.go:210, 289)
- [ ] Remover `ToUpper` de `accounts.name` (account_repository.go:226, 246)

### Fase 2: Correções Importantes
- [ ] Remover `ToUpper` de `categories.name` (category_repository.go:110, 128)
- [ ] Remover `ToUpper` de `subcategories.name` (category_repository.go:184, 201)
- [ ] Remover `ToUpper` de `credit_cards.name` (card_repository.go:87, 110)

### Fase 3: Auditoria Complementar
- [ ] Auditar `payables_repository.go` (se existir)
- [ ] Auditar `payment_methods_repository.go` (se existir)
- [ ] Auditar `invoices_repository.go` (se existir)
- [ ] Verificar outros módulos (Investments, Reports, Mobile)

### Fase 4: Validação
- [ ] Testar buscas case-insensitive (ILIKE, LOWER)
- [ ] Atualizar testes unitários
- [ ] Validar formatação no frontend
- [ ] Documentar campos em schema.sql

---

## 🔧 PADRÕES DE IMPLEMENTAÇÃO

### ✅ Padrão Correto para Dados Técnicos
```go
// Enums e códigos técnicos
input.Type = strings.ToUpper(input.Type)
input.Status = strings.ToUpper(input.Status)
input.Brand = strings.ToUpper(input.Brand)
```

### ✅ Padrão Correto para Dados Humanos
```go
// Nomes, descrições e textos livres
// NÃO aplicar ToUpper, salvar como digitado
query := `INSERT INTO accounts (name) VALUES ($1)`
db.Exec(query, input.Name) // Sem transformação
```

### ✅ Padrão Correto para Busca
```sql
-- Busca case-insensitive
WHERE LOWER(name) = LOWER($1)
-- ou
WHERE name ILIKE $1
```

### ✅ Padrão Correto para Formatação (Frontend)
```typescript
// Formatação visual no frontend
const displayName = toTitleCase(account.name);
const displayNameUpper = account.name.toUpperCase();
```

---

> **Referência:** Este checklist deve ser consultado sempre que criar ou modificar campos de texto no banco de dados.
