# FUNCIONALIDADES CRÍTICAS - CHECKLIST DE VALIDAÇÃO

**Objetivo:** Garantir que TODAS as funcionalidades do sistema atual funcionem no banco novo

---

## 1. AUTENTICAÇÃO E USUÁRIOS

### 1.1 Cadastro de Usuário
- [ ] Criar novo usuário via signup
- [ ] Verificar se `public.users` é criado automaticamente
- [ ] Verificar se categorias padrão são criadas
- [ ] Verificar se métodos de pagamento padrão são criados
- [ ] Verificar se `subscription_status` = 'free'
- [ ] Verificar se `subscription_plan` = 'free'

### 1.2 Login
- [ ] Login com email/senha
- [ ] Verificar sessão criada
- [ ] Verificar RLS funcionando

### 1.3 Perfil
- [ ] Visualizar dados do usuário
- [ ] Editar nome
- [ ] Editar telefone
- [ ] Verificar `updated_at` atualizado

---

## 2. CONTAS (ACCOUNTS)

### 2.1 Criar Conta
- [ ] Criar conta corrente
- [ ] Criar conta poupança
- [ ] Criar conta investimento
- [ ] Criar conta digital
- [ ] Verificar saldo inicial = 0
- [ ] Verificar `is_active` = true

### 2.2 Editar Conta
- [ ] Editar nome da conta
- [ ] Editar cor
- [ ] Editar ícone
- [ ] Verificar `updated_at` atualizado

### 2.3 Deletar Conta
- [ ] Deletar conta (soft delete)
- [ ] Verificar `deleted_at` preenchido
- [ ] Verificar conta não aparece em listagens
- [ ] Verificar transações da conta não são deletadas

### 2.4 Ajuste de Saldo
- [ ] Criar ajuste de saldo
- [ ] Verificar saldo da conta atualizado
- [ ] Verificar `starts_controlled_period` = true
- [ ] Calcular saldo com ajustes (`calculate_account_balance_with_adjustments`)

---

## 3. TRANSAÇÕES (TRANSACTIONS)

### 3.1 Criar Transação - Receita
- [ ] Criar receita paga
- [ ] Verificar saldo da conta aumentou
- [ ] Verificar `is_paid` = true
- [ ] Verificar categoria vinculada
- [ ] Verificar método de pagamento vinculado

### 3.2 Criar Transação - Despesa
- [ ] Criar despesa paga
- [ ] Verificar saldo da conta diminuiu
- [ ] Verificar validação de saldo insuficiente (trigger)
- [ ] Verificar categoria vinculada

### 3.3 Criar Transação - Transferência
- [ ] Criar transferência entre contas
- [ ] Verificar saldo da conta origem diminuiu
- [ ] Verificar saldo da conta destino aumentou
- [ ] Verificar `destination_account_id` preenchido

### 3.4 Editar Transação
- [ ] Editar valor da transação
- [ ] Verificar saldo recalculado corretamente
- [ ] Editar data
- [ ] Editar categoria

### 3.5 Deletar Transação
- [ ] Deletar transação (soft delete)
- [ ] Verificar saldo da conta revertido
- [ ] Verificar `deleted_at` preenchido

### 3.6 Transação Agendada
- [ ] Criar transação com `is_paid` = false
- [ ] Verificar saldo NÃO alterado
- [ ] Marcar como paga
- [ ] Verificar saldo alterado

---

## 4. CARTÕES DE CRÉDITO

### 4.1 Criar Cartão
- [ ] Criar cartão de crédito
- [ ] Definir dia de fechamento
- [ ] Definir dia de vencimento
- [ ] Definir limite
- [ ] Verificar cor e brand

### 4.2 Criar Compra no Cartão
- [ ] Criar compra à vista
- [ ] Verificar fatura criada automaticamente (`get_or_create_invoice`)
- [ ] Verificar compra vinculada à fatura correta
- [ ] Verificar `total_amount` da fatura atualizado

### 4.3 Criar Compra Parcelada
- [ ] Criar compra parcelada (3x)
- [ ] Verificar 3 transações criadas
- [ ] Verificar cada parcela em fatura diferente
- [ ] Verificar `installment_number` e `total_installments`

### 4.4 Pagar Fatura
- [ ] Pagar fatura com valor exato
- [ ] Verificar `status` = 'paid'
- [ ] Verificar `paid_amount` = `total_amount`
- [ ] Verificar transação de pagamento criada

### 4.5 Pagar Fatura com Excesso (Rollover)
- [ ] Pagar fatura com valor maior que total
- [ ] Verificar excesso aplicado na próxima fatura
- [ ] Verificar `paid_amount` da próxima fatura > 0
- [ ] Verificar função `pay_invoice` recursiva funcionando

### 4.6 Estornar Pagamento de Fatura
- [ ] Estornar pagamento
- [ ] Verificar `paid_amount` revertido
- [ ] Verificar `status` atualizado
- [ ] Verificar transação de pagamento deletada
- [ ] Verificar função `revert_payment` funcionando

### 4.7 Deletar Cartão
- [ ] Deletar cartão (soft delete)
- [ ] Verificar faturas não deletadas
- [ ] Verificar transações não deletadas

---

## 5. CONTAS A PAGAR (PAYABLES)

### 5.1 Criar Conta a Pagar
- [ ] Criar conta a pagar única
- [ ] Definir valor
- [ ] Definir data de vencimento
- [ ] Definir categoria
- [ ] Verificar `status` = 'pending'

### 5.2 Criar Conta a Pagar Parcelada
- [ ] Criar conta parcelada (6x)
- [ ] Verificar 6 contas criadas
- [ ] Verificar `installment_number` e `total_installments`
- [ ] Verificar `parent_id` vinculado

### 5.3 Pagar Conta a Pagar
- [ ] Pagar conta a pagar
- [ ] Verificar `status` = 'paid'
- [ ] Verificar `paid_at` preenchido
- [ ] Verificar transação criada
- [ ] Verificar saldo da conta diminuiu

### 5.4 Estornar Pagamento de Conta
- [ ] Estornar pagamento
- [ ] Verificar `status` = 'pending'
- [ ] Verificar `paid_at` = NULL
- [ ] Verificar transação deletada
- [ ] Verificar saldo da conta revertido

### 5.5 Deletar Conta a Pagar
- [ ] Deletar conta (soft delete)
- [ ] Verificar `deleted_at` preenchido

---

## 6. CATEGORIAS E SUBCATEGORIAS

### 6.1 Categorias Padrão
- [ ] Verificar categorias padrão criadas no signup
- [ ] Verificar categorias de receita
- [ ] Verificar categorias de despesa
- [ ] Verificar categoria "Pagamento de Fatura" existe

### 6.2 Criar Categoria
- [ ] Criar categoria customizada
- [ ] Definir nome, ícone, cor
- [ ] Verificar `is_system` = false

### 6.3 Criar Subcategoria
- [ ] Criar subcategoria
- [ ] Vincular a categoria
- [ ] Verificar `is_system` = false

### 6.4 Editar Categoria
- [ ] Editar nome
- [ ] Editar ícone
- [ ] Editar cor

### 6.5 Deletar Categoria
- [ ] Deletar categoria (soft delete)
- [ ] Verificar transações vinculadas não quebram

---

## 7. MÉTODOS DE PAGAMENTO

### 7.1 Métodos Padrão
- [ ] Verificar métodos padrão criados no signup
- [ ] Verificar PIX, Dinheiro, Cartão de Crédito, etc

### 7.2 Criar Método Customizado
- [ ] Criar método de pagamento customizado
- [ ] Definir nome, tipo, ícone

---

## 8. INVESTIMENTOS

### 8.1 Criar Investimento
- [ ] Criar investimento (ação)
- [ ] Definir ticker, quantidade, preço médio
- [ ] Vincular a conta

### 8.2 Criar Transação de Investimento
- [ ] Comprar ativo
- [ ] Vender ativo
- [ ] Verificar quantidade atualizada
- [ ] Verificar preço médio recalculado

### 8.3 Rendimento de Liquidez
- [ ] Criar rendimento de liquidez
- [ ] Verificar saldo da conta aumentou
- [ ] Verificar `yield_amount` registrado

---

## 9. AUDITORIA

### 9.1 Logs Automáticos
- [ ] Criar transação
- [ ] Verificar log criado em `audit_log`
- [ ] Verificar `operation` = 'INSERT'
- [ ] Verificar `new_values` preenchido

### 9.2 Editar Registro
- [ ] Editar transação
- [ ] Verificar log criado
- [ ] Verificar `operation` = 'UPDATE'
- [ ] Verificar `old_values` e `new_values` preenchidos

### 9.3 Deletar Registro
- [ ] Deletar transação
- [ ] Verificar log criado
- [ ] Verificar `operation` = 'DELETE'
- [ ] Verificar `old_values` preenchido

### 9.4 Consultar Histórico
- [ ] Usar função `get_record_history()`
- [ ] Verificar histórico completo retornado
- [ ] Verificar ordem cronológica

---

## 10. SEGURANÇA (RLS)

### 10.1 Isolamento de Usuários
- [ ] Criar 2 usuários diferentes
- [ ] Verificar Usuário A não vê dados do Usuário B
- [ ] Tentar acessar transaction_id de outro usuário
- [ ] Verificar erro de permissão

### 10.2 Policies
- [ ] Verificar policy SELECT funcionando
- [ ] Verificar policy INSERT funcionando
- [ ] Verificar policy UPDATE funcionando
- [ ] Verificar policy DELETE funcionando

---

## 11. PERFORMANCE E CONCORRÊNCIA

### 11.1 Locks em Saldo
- [ ] Criar 100 transações simultâneas
- [ ] Verificar saldo final correto
- [ ] Verificar sem race conditions

### 11.2 Idempotência
- [ ] Tentar criar transação duplicada (mesmo idempotency_key)
- [ ] Verificar apenas 1 transação criada
- [ ] Verificar erro retornado

---

## RESUMO

**Total de Testes:** ~80 casos de teste  
**Criticidade:** ALTA  
**Cobertura:** Todas as funcionalidades principais

---

**Status:** ⏳ Aguardando execução  
**Última Atualização:** 23/12/2025 00:03
