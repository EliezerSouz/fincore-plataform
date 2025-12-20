# 📊 Diagrama do Sistema de Cartões de Crédito

## Estrutura do Banco de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                      CREDIT_CARDS                           │
│─────────────────────────────────────────────────────────────│
│ 🔑 id                UUID (PK)                              │
│ 👤 user_id           UUID (FK → users)                      │
│ 📝 name              TEXT                                   │
│ 💳 brand             TEXT (visa, master, elo, amex...)      │
│ 🔢 last_4_digits     TEXT                                   │
│ 💰 limit_amount      NUMERIC(15,2)                          │
│ 📅 closing_day       INTEGER (1-31)                         │
│ 📅 due_day           INTEGER (1-31)                         │
│ 🎨 color             TEXT (hex color)                       │
│ 🕐 created_at        TIMESTAMPTZ                            │
│ 🕐 updated_at        TIMESTAMPTZ                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  CREDIT_CARD_INVOICES                       │
│─────────────────────────────────────────────────────────────│
│ 🔑 id                UUID (PK)                              │
│ 👤 user_id           UUID (FK → users)                      │
│ 💳 credit_card_id    UUID (FK → credit_cards)               │
│ 📅 reference_month   INTEGER (1-12)                         │
│ 📅 reference_year    INTEGER (2000+)                        │
│ 📅 closing_date      DATE                                   │
│ 📅 due_date          DATE                                   │
│ 💰 total_amount      NUMERIC(15,2) [AUTO-CALCULATED]        │
│ 💵 paid_amount       NUMERIC(15,2)                          │
│ 🏷️  status            TEXT (open, closed, paid, overdue)    │
│ 🕐 created_at        TIMESTAMPTZ                            │
│ 🕐 updated_at        TIMESTAMPTZ                            │
│                                                             │
│ 🔒 UNIQUE(credit_card_id, reference_month, reference_year) │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               CREDIT_CARD_TRANSACTIONS                      │
│─────────────────────────────────────────────────────────────│
│ 🔑 id                     UUID (PK)                         │
│ 👤 user_id                UUID (FK → users)                 │
│ 💳 credit_card_id         UUID (FK → credit_cards)          │
│ 🧾 invoice_id             UUID (FK → invoices)              │
│ 🏷️  category_id            UUID (FK → categories)            │
│ 📝 description            TEXT                              │
│ 💰 amount                 NUMERIC(15,2)                     │
│ 📅 transaction_date       DATE                              │
│ 🔄 is_installment         BOOLEAN                           │
│ 🔢 installment_number     INTEGER (ex: 3)                   │
│ 🔢 total_installments     INTEGER (ex: 12)                  │
│ 🔗 parent_transaction_id  UUID (FK → self)                  │
│ 🏷️  transaction_type       TEXT (purchase, refund, etc)     │
│ 📝 notes                  TEXT                              │
│ 🕐 created_at             TIMESTAMPTZ                       │
│ 🕐 updated_at             TIMESTAMPTZ                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Relacionamentos

```
users (1) ──────────┬─────────────┬─────────────┐
                    │             │             │
                    ▼             ▼             ▼
            credit_cards   credit_card_   credit_card_
                           invoices       transactions
                    │             │             │
                    └──────┬──────┘             │
                           │                    │
                           └────────────────────┘
```

---

## Fluxo de Dados

### 1️⃣ Compra à Vista
```
Usuário faz compra
        ↓
get_or_create_invoice()  ← Cria/busca fatura do mês
        ↓
INSERT transaction
        ↓
TRIGGER update_invoice_total()  ← Atualiza total automaticamente
```

### 2️⃣ Compra Parcelada (12x)
```
create_installment_purchase()
        ↓
┌───────────────────────────────────┐
│ Cria 1 transação PAI (total)     │
│ Cria 12 transações FILHAS        │
│ Distribui nas próximas 12 faturas│
└───────────────────────────────────┘
        ↓
Resultado:
├─ Fatura Dez/2024: R$ 600 (1/12)
├─ Fatura Jan/2025: R$ 600 (2/12)
├─ Fatura Fev/2025: R$ 600 (3/12)
└─ ... até Nov/2025
```

### 3️⃣ Pagamento de Fatura
```
pay_invoice(invoice_id, amount)
        ↓
Atualiza paid_amount
        ↓
Atualiza status automaticamente:
├─ paid     (se paid_amount >= total_amount)
├─ partial  (se paid_amount > 0)
└─ overdue  (se vencida e não paga)
```

---

## Funções Principais

### 🔧 get_or_create_invoice(user_id, card_id, date)
**Retorna:** UUID da fatura

**Lógica:**
```
Se compra ANTES do fechamento → Fatura do mês atual
Se compra DEPOIS do fechamento → Fatura do próximo mês
Se fatura não existe → Cria automaticamente
```

**Exemplo:**
```
Cartão: fecha dia 5, vence dia 15

Compra em 03/12 → Fatura Dez (fecha 05/12, vence 15/01)
Compra em 08/12 → Fatura Jan (fecha 05/01, vence 15/02)
```

---

### 🔧 create_installment_purchase(...)
**Parâmetros:**
- user_id
- card_id
- description
- total_amount
- purchase_date
- total_installments
- category_id (opcional)

**Retorna:** UUID da transação pai

**Processo:**
```
1. Valida (mínimo 2 parcelas)
2. Calcula valor da parcela (total ÷ parcelas)
3. Cria transação PAI (registro original)
4. Loop de 1 até N parcelas:
   ├─ Calcula data (mês + i)
   ├─ Busca/cria fatura do mês
   └─ Cria transação FILHA
5. Retorna ID da transação pai
```

---

### 🔧 update_invoice_total() [TRIGGER]
**Dispara em:** INSERT, UPDATE, DELETE em transactions

**Ação:**
```sql
UPDATE invoices
SET total_amount = SUM(transactions.amount)
WHERE invoice_id = ...
```

---

### 🔧 pay_invoice(invoice_id, amount)
**Ação:**
```
1. Adiciona amount ao paid_amount
2. Atualiza status:
   ├─ paid     (se pagamento completo)
   ├─ partial  (se pagamento parcial)
   └─ mantém   (se amount = 0)
```

---

### 🔧 update_overdue_invoices()
**Uso:** Executar diariamente (cron job)

**Ação:**
```sql
UPDATE invoices
SET status = 'overdue'
WHERE due_date < TODAY
  AND paid_amount < total_amount
  AND status IN ('open', 'closed')
```

---

## Status das Faturas

```
┌─────────┐
│  OPEN   │  ← Fatura aberta (recebendo compras)
└────┬────┘
     │ (após closing_date)
     ▼
┌─────────┐
│ CLOSED  │  ← Fatura fechada (não aceita mais compras)
└────┬────┘
     │
     ├─────────────┐
     │             │
     ▼             ▼
┌─────────┐   ┌──────────┐
│  PAID   │   │ OVERDUE  │  ← (se venceu sem pagar)
└─────────┘   └────┬─────┘
                   │ (pagamento parcial)
                   ▼
              ┌─────────┐
              │ PARTIAL │
              └─────────┘
```

---

## Queries Úteis

### 💰 Limite Disponível
```sql
SELECT 
  c.limit_amount - COALESCE(SUM(t.amount), 0) as available
FROM credit_cards c
LEFT JOIN credit_card_transactions t 
  ON t.credit_card_id = c.id 
  AND t.invoice_id IN (
    SELECT id FROM credit_card_invoices 
    WHERE status IN ('open', 'closed')
  )
WHERE c.id = 'card-id'
GROUP BY c.id, c.limit_amount;
```

### 📊 Faturas em Aberto
```sql
SELECT 
  i.*,
  c.name as card_name,
  COUNT(t.id) as num_transactions
FROM credit_card_invoices i
JOIN credit_cards c ON c.id = i.credit_card_id
LEFT JOIN credit_card_transactions t ON t.invoice_id = i.id
WHERE i.user_id = auth.uid()
  AND i.status IN ('open', 'closed', 'overdue')
GROUP BY i.id, c.name
ORDER BY i.due_date;
```

### 🔄 Próximas Parcelas
```sql
SELECT 
  t.description,
  t.amount,
  t.installment_number || '/' || t.total_installments as parcela,
  i.due_date,
  c.name as cartao
FROM credit_card_transactions t
JOIN credit_card_invoices i ON i.id = t.invoice_id
JOIN credit_cards c ON c.id = t.credit_card_id
WHERE t.user_id = auth.uid()
  AND t.is_installment = true
  AND i.status IN ('open', 'closed')
ORDER BY i.due_date, t.installment_number;
```

---

## 🔒 Segurança (RLS)

Todas as tabelas têm políticas de segurança:

```sql
-- Exemplo de política
CREATE POLICY "Users can view own data"
ON credit_card_transactions
FOR SELECT
USING (auth.uid() = user_id);
```

**Políticas ativas:**
- ✅ SELECT (visualizar)
- ✅ INSERT (criar)
- ✅ UPDATE (editar)
- ✅ DELETE (excluir)

**Regra:** `auth.uid() = user_id`

---

## 📝 Índices para Performance

```sql
-- Invoices
CREATE INDEX idx_invoices_card ON invoices(credit_card_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_period ON invoices(reference_year, reference_month);

-- Transactions
CREATE INDEX idx_cc_transactions_card ON transactions(credit_card_id);
CREATE INDEX idx_cc_transactions_invoice ON transactions(invoice_id);
CREATE INDEX idx_cc_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_cc_transactions_parent ON transactions(parent_transaction_id);
```

---

**Legenda:**
- 🔑 Primary Key
- 🔗 Foreign Key
- 👤 User Reference
- 💳 Card Reference
- 📅 Date Field
- 💰 Money Field
- 🏷️ Status/Type Field
- 🔄 Boolean Field
- 📝 Text Field
- 🕐 Timestamp
