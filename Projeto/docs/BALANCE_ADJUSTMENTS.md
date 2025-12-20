# 💰 Saldos Iniciais e Transações Históricas

## Visão Geral

Este módulo permite gerenciar **saldos iniciais** e **transações históricas**, resolvendo o problema de lançar dados retroativos sem afetar o saldo atual das contas.

## 🎯 Problema Resolvido

**Cenário**: Você começou a usar o FINCORE em dezembro/2025, mas quer lançar transações de meses anteriores (janeiro a novembro) para ter um histórico completo.

**Problema**: Se você lançar essas transações normalmente, elas afetarão seu saldo atual, causando inconsistências.

**Solução**: Sistema de **Ajustes de Saldo** com **Transações Históricas**.

## 🔧 Como Funciona

### 1. Ajustes de Saldo

Você pode definir **múltiplos ajustes de saldo** ao longo do tempo:

```
Timeline:
├─ Jan-Nov/2025: Transações HISTÓRICAS (não afetam saldo)
├─ 01/12/2025: ⚡ AJUSTE #1 = R$ 5.000 (início do controle)
├─ Dez/2025 - Jan/2026: ✅ PERÍODO CONTROLADO
├─ Fev-Abr/2026: ⏸️ PAUSA (sem uso do sistema)
├─ 01/05/2026: ⚡ AJUSTE #2 = R$ 8.500 (retomada)
└─ Mai/2026+: ✅ PERÍODO CONTROLADO
```

### 2. Tipos de Transações

- **Transações Normais**: Afetam o saldo atual (períodos controlados)
- **Transações Históricas**: Apenas para relatórios, não afetam saldo

### 3. Tipos de Ajustes

- **Saldo Inicial**: Quando você começa a usar o sistema
- **Conciliação/Retomada**: Quando retoma após um período sem uso
- **Correção Manual**: Para ajustar divergências pontuais

## 📖 Guia de Uso

### Passo 1: Definir Saldo Inicial

1. Acesse a página de **Contas** (`/caixa/accounts`)
2. Clique no botão **"Ajustar Saldo"** na conta desejada
3. Preencha:
   - **Data do Ajuste**: Data em que você começou a controlar (ex: 01/12/2025)
   - **Saldo Real**: Saldo da conta nessa data (ex: R$ 5.000,00)
   - **Tipo**: Saldo Inicial
   - **Observações**: "Início do controle financeiro"
4. Clique em **"Confirmar Ajuste"**

### Passo 2: Lançar Transações Históricas

1. Crie uma nova transação normalmente
2. Ao selecionar uma **data anterior** ao ajuste de saldo:
   - O sistema detecta automaticamente
   - Mostra um alerta: "Período sem controle ativo"
   - Sugere marcar como **Lançamento Histórico**
3. Escolha **"Lançamento Histórico"**
4. Salve a transação

✅ **Resultado**: A transação é salva, aparece em relatórios, mas **NÃO afeta** o saldo atual!

### Passo 3: Retomar Após Pausa

Se você parou de usar o sistema e quer retomar:

1. Clique em **"Ajustar Saldo"** novamente
2. Preencha:
   - **Data do Ajuste**: Data da retomada (ex: 01/05/2026)
   - **Saldo Real**: Saldo real do banco nessa data
   - **Tipo**: Conciliação/Retomada
   - **Observações**: "Retomando após 3 meses sem uso"
3. Confirme

### Passo 4: Converter Período Histórico (Opcional)

Se você lançou transações históricas e depois quer que elas afetem o saldo:

1. Acesse **"Ver Histórico"** na conta
2. Encontre o período com transações históricas
3. Clique em **"Converter para Controlado"**
4. O sistema mostra:
   - Impacto no saldo
   - Diferença com próximo ajuste
   - Transação de conciliação que será criada
5. Marque **"Entendo que esta ação irá alterar o saldo atual"**
6. Clique em **"Converter Período"**

✅ **Resultado**: 
- Transações históricas viram normais
- Sistema cria transação de ajuste automática
- Saldo é recalculado corretamente

## 🎨 Componentes Criados

### 1. `BalanceAdjustmentDialog`
Dialog para criar/editar ajustes de saldo.

**Uso**:
```tsx
<BalanceAdjustmentDialog
  open={open}
  onOpenChange={setOpen}
  accountId="uuid-da-conta"
  accountName="Nubank"
  onSuccess={() => refetch()}
/>
```

### 2. `BalanceAdjustmentHistory`
Visualiza histórico de ajustes e períodos controlados.

**Uso**:
```tsx
<BalanceAdjustmentHistory
  accountId="uuid-da-conta"
  accountName="Nubank"
/>
```

### 3. `ConvertPeriodDialog`
Dialog para converter período histórico em controlado.

**Uso**:
```tsx
<ConvertPeriodDialog
  open={open}
  onOpenChange={setOpen}
  accountId="uuid-da-conta"
  accountName="Nubank"
  period={period}
  onSuccess={() => refetch()}
/>
```

### 4. `TransactionTypeDetector`
Detecta automaticamente se transação deve ser histórica.

**Uso**:
```tsx
<TransactionTypeDetector
  accountId={accountId}
  transactionDate={date}
  isHistorical={isHistorical}
  onIsHistoricalChange={setIsHistorical}
/>
```

## 🔌 Server Actions

### `getBalanceAdjustments(accountId)`
Retorna todos os ajustes de saldo de uma conta.

### `createBalanceAdjustment(input)`
Cria um novo ajuste de saldo.

### `updateBalanceAdjustment(id, input)`
Atualiza um ajuste existente.

### `deleteBalanceAdjustment(id)`
Remove um ajuste de saldo.

### `getControlledPeriods(accountId)`
Retorna os períodos controlados de uma conta.

### `analyzePeriod(accountId, date)`
Analisa se uma data está em período controlado ou histórico.

### `convertHistoricalPeriod(input)`
Converte um período histórico em controlado com auto-ajuste.

### `calculateAccountBalanceWithAdjustments(accountId, date?)`
Calcula o saldo da conta considerando ajustes.

## 🗄️ Estrutura do Banco de Dados

### Tabela: `account_balance_adjustments`

```sql
CREATE TABLE account_balance_adjustments (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),
  adjustment_date DATE NOT NULL,
  balance DECIMAL(15, 2) NOT NULL,
  type TEXT CHECK (type IN ('initial', 'reconciliation', 'correction')),
  notes TEXT,
  starts_controlled_period BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id UUID REFERENCES auth.users(id)
);
```

### Campos Adicionados em `transactions`

```sql
ALTER TABLE transactions 
ADD COLUMN is_historical BOOLEAN DEFAULT false,
ADD COLUMN is_adjustment BOOLEAN DEFAULT false;
```

## 📊 Função de Cálculo de Saldo

```sql
SELECT calculate_account_balance_with_adjustments(
  'uuid-da-conta',
  '2025-12-17'
);
```

Esta função:
1. Busca o último ajuste antes da data
2. Soma apenas transações **não históricas** após o ajuste
3. Retorna: `saldo_ajuste + transações_posteriores`

## ✅ Vantagens

1. **Histórico Completo**: Lance transações de qualquer período
2. **Saldo Correto**: Saldo atual sempre preciso
3. **Flexibilidade**: Pare e retome quando quiser
4. **Conciliação Fácil**: Ajuste o saldo a qualquer momento
5. **Conversão**: Pode converter histórico em controlado depois
6. **Auditoria**: Histórico completo de todos os ajustes

## 🚀 Próximos Passos

1. **Aplicar Migration**: Execute `.\apply-balance-adjustments-migration.ps1`
2. **Integrar na UI**: Adicione os componentes nas páginas de contas
3. **Testar**: Crie um ajuste de saldo e lance transações históricas
4. **Documentar**: Adicione tooltips e ajuda contextual para usuários

## 📝 Exemplo Prático

```typescript
// 1. Criar saldo inicial
await createBalanceAdjustment({
  account_id: 'uuid-nubank',
  adjustment_date: '2025-12-01',
  balance: 5000.00,
  type: 'initial',
  notes: 'Início do controle financeiro'
})

// 2. Lançar transação histórica (novembro)
await createTransaction({
  account_id: 'uuid-nubank',
  date: '2025-11-15',
  amount: 250.00,
  type: 'expense',
  description: 'Supermercado',
  is_historical: true  // ← Não afeta saldo!
})

// 3. Lançar transação normal (dezembro)
await createTransaction({
  account_id: 'uuid-nubank',
  date: '2025-12-10',
  amount: 3000.00,
  type: 'income',
  description: 'Salário',
  is_historical: false  // ← Afeta saldo!
})

// 4. Calcular saldo atual
const balance = await calculateAccountBalanceWithAdjustments('uuid-nubank')
// Resultado: 5000 + 3000 = R$ 8.000,00
// (transação de novembro não é contada!)
```

## 🎓 Conceitos Importantes

### Período Controlado
Período onde você está usando ativamente o sistema. Transações afetam o saldo.

### Período Histórico (Gap)
Período onde você não estava usando o sistema. Transações são apenas para relatórios.

### Transação de Ajuste
Transação criada automaticamente pelo sistema para conciliar diferenças ao converter períodos.

### Conciliação
Processo de ajustar o saldo para bater com o banco, geralmente ao retomar o uso do sistema.

---

**Desenvolvido com ❤️ para o FINCORE**
