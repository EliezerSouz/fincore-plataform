# 💳 Sistema de Cartões de Crédito - Documentação do Banco de Dados

## 📋 Visão Geral

O sistema de cartões de crédito foi projetado para gerenciar:
- **Cartões de crédito** múltiplos por usuário
- **Faturas mensais** com controle de status
- **Transações/Compras** com suporte a parcelamento
- **Cálculo automático** de totais e limites disponíveis

---

## 🗄️ Estrutura das Tabelas

### 1. `credit_cards`
Armazena os cartões de crédito do usuário.

**Campos principais:**
- `id` - UUID único
- `user_id` - Referência ao usuário
- `name` - Nome/apelido do cartão (ex: "Nubank Principal")
- `brand` - Bandeira (visa, master, elo, amex, etc)
- `last_4_digits` - Últimos 4 dígitos
- `limit_amount` - Limite total do cartão
- `closing_day` - Dia do fechamento da fatura (1-31)
- `due_day` - Dia do vencimento (1-31)
- `color` - Cor hexadecimal para UI

---

### 2. `credit_card_invoices`
Faturas mensais de cada cartão.

**Campos principais:**
- `id` - UUID único
- `credit_card_id` - Referência ao cartão
- `reference_month` - Mês de referência (1-12)
- `reference_year` - Ano de referência
- `closing_date` - Data de fechamento
- `due_date` - Data de vencimento
- `total_amount` - Valor total da fatura (calculado automaticamente)
- `paid_amount` - Valor já pago
- `status` - Status da fatura

**Status possíveis:**
- `open` - Fatura aberta (ainda pode receber compras)
- `closed` - Fatura fechada (após data de fechamento)
- `paid` - Fatura paga completamente
- `partial` - Fatura parcialmente paga
- `overdue` - Fatura vencida

**Constraint:** Uma única fatura por cartão por mês (UNIQUE constraint)

---

### 3. `credit_card_transactions`
Transações/compras realizadas no cartão.

**Campos principais:**
- `id` - UUID único
- `credit_card_id` - Referência ao cartão
- `invoice_id` - Referência à fatura (calculado automaticamente)
- `category_id` - Categoria da despesa
- `description` - Descrição da compra
- `amount` - Valor da transação
- `transaction_date` - Data da compra
- `is_installment` - Se é parcelado
- `installment_number` - Número da parcela atual (ex: 3)
- `total_installments` - Total de parcelas (ex: 12)
- `parent_transaction_id` - Referência à compra original (para parcelas)
- `transaction_type` - Tipo de transação

**Tipos de transação:**
- `purchase` - Compra normal
- `refund` - Estorno/devolução
- `adjustment` - Ajuste manual
- `fee` - Taxa/encargo

---

## ⚙️ Funções Automáticas

### 1. `get_or_create_invoice(user_id, card_id, transaction_date)`
Retorna o ID da fatura apropriada para uma data de compra.

**Lógica:**
- Se a compra foi **antes** do dia de fechamento → vai para a fatura do mês atual
- Se a compra foi **depois** do dia de fechamento → vai para a fatura do próximo mês
- Se a fatura não existir, cria automaticamente

**Exemplo:**
```sql
-- Cartão fecha dia 5, vence dia 12
-- Compra em 03/12/2024 → Fatura de Dezembro (fecha 05/12, vence 12/01)
-- Compra em 08/12/2024 → Fatura de Janeiro (fecha 05/01, vence 12/02)
```

---

### 2. `create_installment_purchase(...)`
Cria uma compra parcelada automaticamente.

**Parâmetros:**
- `p_user_id` - ID do usuário
- `p_card_id` - ID do cartão
- `p_description` - Descrição da compra
- `p_total_amount` - Valor total
- `p_purchase_date` - Data da compra
- `p_total_installments` - Número de parcelas
- `p_category_id` - Categoria (opcional)

**Comportamento:**
1. Cria uma transação "pai" com o valor total
2. Divide o valor em parcelas iguais
3. Cria uma transação para cada parcela
4. Distribui as parcelas nas faturas corretas (mês a mês)
5. Vincula todas as parcelas à transação pai

**Exemplo de uso:**
```sql
SELECT create_installment_purchase(
    'user-uuid',
    'card-uuid',
    'iPhone 15 Pro',
    7200.00,
    '2024-12-13',
    12,
    'category-uuid'
);
```

Isso criará:
- 1 transação pai (R$ 7.200,00)
- 12 parcelas de R$ 600,00 cada
- Cada parcela na fatura do mês correspondente

---

### 3. `update_invoice_total()` (Trigger)
Atualiza automaticamente o `total_amount` da fatura quando transações são adicionadas/removidas.

**Dispara em:**
- INSERT em `credit_card_transactions`
- UPDATE em `credit_card_transactions`
- DELETE em `credit_card_transactions`

---

### 4. `update_overdue_invoices()`
Marca faturas como vencidas automaticamente.

**Uso sugerido:** Executar diariamente via cron job ou scheduled function.

```sql
SELECT update_overdue_invoices();
```

---

### 5. `close_invoice(invoice_id)`
Fecha uma fatura manualmente (muda status de `open` para `closed`).

---

### 6. `pay_invoice(invoice_id, amount)`
Registra um pagamento de fatura.

**Comportamento:**
- Adiciona o valor ao `paid_amount`
- Atualiza o status automaticamente:
  - `paid` se pagamento total
  - `partial` se pagamento parcial
  - Mantém status atual se valor for 0

---

## 🔄 Fluxo de Uso Típico

### Cenário 1: Compra à vista
```sql
-- 1. Obter fatura correta
SELECT get_or_create_invoice('user-id', 'card-id', '2024-12-13');

-- 2. Inserir transação
INSERT INTO credit_card_transactions (
    user_id, credit_card_id, invoice_id,
    description, amount, transaction_date
) VALUES (
    'user-id', 'card-id', 'invoice-id',
    'Restaurante', 150.00, '2024-12-13'
);

-- 3. Total da fatura é atualizado automaticamente via trigger
```

### Cenário 2: Compra parcelada
```sql
-- Usar a função auxiliar
SELECT create_installment_purchase(
    'user-id',
    'card-id',
    'Notebook Dell',
    4500.00,
    '2024-12-13',
    10
);

-- Isso cria automaticamente:
-- - 1 transação pai
-- - 10 parcelas de R$ 450,00
-- - Distribui nas próximas 10 faturas
```

### Cenário 3: Pagar fatura
```sql
-- Pagar fatura completamente
SELECT pay_invoice('invoice-id', 1500.00);

-- Ou pagamento parcial
SELECT pay_invoice('invoice-id', 500.00);
```

---

## 📊 Queries Úteis

### Limite disponível de um cartão
```sql
SELECT 
    c.limit_amount - COALESCE(SUM(t.amount), 0) as available_limit
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

### Faturas em aberto de um usuário
```sql
SELECT 
    i.*,
    c.name as card_name,
    c.brand
FROM credit_card_invoices i
JOIN credit_cards c ON c.id = i.credit_card_id
WHERE i.user_id = 'user-id'
  AND i.status IN ('open', 'closed', 'overdue')
ORDER BY i.due_date;
```

### Próximas parcelas a vencer
```sql
SELECT 
    t.description,
    t.amount,
    t.installment_number,
    t.total_installments,
    i.due_date,
    c.name as card_name
FROM credit_card_transactions t
JOIN credit_card_invoices i ON i.id = t.invoice_id
JOIN credit_cards c ON c.id = t.credit_card_id
WHERE t.user_id = 'user-id'
  AND t.is_installment = true
  AND i.status IN ('open', 'closed')
ORDER BY i.due_date, t.installment_number;
```

---

## 🔒 Segurança (RLS)

Todas as tabelas têm **Row Level Security** habilitado:
- Usuários só veem seus próprios dados
- Políticas para SELECT, INSERT, UPDATE, DELETE
- Baseado em `auth.uid() = user_id`

---

## 🚀 Próximos Passos

1. **Executar as migrations** no Supabase
2. **Criar interfaces** para:
   - Listar faturas
   - Adicionar compras
   - Visualizar parcelas
   - Pagar faturas
3. **Implementar notificações** de vencimento
4. **Dashboard** com gráficos de gastos por categoria
5. **Integração com IA** para análise de padrões de consumo

---

## 📝 Notas Importantes

- **Datas de fechamento/vencimento:** O sistema usa `LEAST(day, 28)` para evitar problemas com meses de 28-30 dias
- **Parcelamento:** Cada parcela é uma transação independente, facilitando queries e relatórios
- **Transação pai:** Mantém o registro da compra original para rastreabilidade
- **Triggers automáticos:** Garantem consistência dos dados sem intervenção manual
