# Sistema de Rendimentos de Liquidez (CDI) - FinCore

## 📋 Visão Geral

O FinCore implementa um sistema robusto de cálculo de rendimentos CDI para contas de liquidez, seguindo princípios financeiros sólidos:

- **Rendimento ≠ Transação**: Rendimentos são registros patrimoniais, não transações financeiras
- **Determinístico**: Um único cálculo por dia, por conta
- **Auditável**: Histórico completo e rastreável
- **Não-poluente**: Não "suja" o histórico de transações

## 🏗️ Arquitetura

### Tabelas

#### `liquidity_yields`
```sql
CREATE TABLE liquidity_yields (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id),
    date DATE NOT NULL,
    base_amount DECIMAL(15, 2) NOT NULL,
    yield_amount DECIMAL(15, 2) NOT NULL,
    rate_applied FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (account_id, date)  -- ✅ Previne duplicidade
);
```

#### Campos adicionados em `accounts`
```sql
ALTER TABLE accounts ADD COLUMN yield_enabled BOOLEAN DEFAULT false;
ALTER TABLE accounts ADD COLUMN yield_source VARCHAR(50) DEFAULT NULL;
ALTER TABLE accounts ADD COLUMN yield_rate FLOAT DEFAULT 0;
```

## 📐 Regras de Negócio

### 1️⃣ Elegibilidade da Conta

Uma conta só gera rendimentos se:
```go
yield_enabled = true
yield_source = "CDI"
yield_rate > 0
```

### 2️⃣ Execução do Cálculo

- **Frequência**: 1x ao dia
- **Dias**: Apenas dias úteis
- **Verificação**: Sistema verifica se já existe registro para `(account_id, date)`
- **Bloqueio**: Constraint `UNIQUE` previne duplicidade

### 3️⃣ Base de Cálculo

```
base_amount = saldo_operacional + Σ(rendimentos_anteriores)
```

O saldo operacional é o `balance` da tabela `accounts`.
Os rendimentos anteriores são a soma de todos os `yield_amount` até o dia anterior.

### 4️⃣ Fórmula do Rendimento

```
yield_amount = base_amount × (CDI_anual / 252) × (yield_percentage / 100)
```

Onde:
- `CDI_anual`: Taxa CDI anual (ex: 13.65%)
- `252`: Número de dias úteis no ano
- `yield_percentage`: Percentual do CDI que a conta rende (ex: 100% = rende 100% do CDI)

### 5️⃣ Persistência

1. Inserir registro em `liquidity_yields`
2. **NÃO** criar transação financeira
3. **NÃO** alterar o `balance` da conta diretamente

### 6️⃣ Reprocessamento

- Permitido apenas com **exclusão explícita** do registro
- Requer auditoria
- **Nunca** recalcula automaticamente o passado

## 🔌 API Endpoints

### Calcular Rendimentos do Dia
```http
POST /api/yields/calculate
Content-Type: application/json

{
  "date": "2025-12-25",
  "cdi_rate": 13.65
}
```

**Resposta:**
```json
{
  "message": "Yields calculated successfully",
  "date": "2025-12-25"
}
```

### Obter Resumo de Rendimentos de uma Conta
```http
GET /api/yields/account/:account_id
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "operational_balance": 10000.00,
  "total_yields": 125.50,
  "total_balance": 10125.50,
  "recent_yields": [
    {
      "id": "uuid",
      "account_id": "uuid",
      "date": "2025-12-25",
      "base_amount": 10100.00,
      "yield_amount": 5.50,
      "rate_applied": 0.0544,
      "created_at": "2025-12-25T10:00:00Z"
    }
  ],
  "yield_enabled": true,
  "yield_rate": 100.0
}
```

### Reprocessar Rendimento
```http
POST /api/yields/reprocess
Content-Type: application/json
Authorization: Bearer {token}

{
  "account_id": "uuid",
  "date": "2025-12-25",
  "cdi_rate": 13.65
}
```

## 💻 Exemplo de Uso

### 1. Habilitar Rendimento em uma Conta

```sql
UPDATE accounts 
SET 
    yield_enabled = true,
    yield_source = 'CDI',
    yield_rate = 100.0  -- 100% do CDI
WHERE id = 'account-uuid';
```

### 2. Executar Cálculo Diário

```bash
curl -X POST http://localhost:8080/api/yields/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-12-25",
    "cdi_rate": 13.65
  }'
```

### 3. Verificar Rendimentos

```bash
curl -X GET http://localhost:8080/api/yields/account/{account-id} \
  -H "Authorization: Bearer {token}"
```

## 📊 Exibição no Frontend

### Saldo Total
```typescript
const totalBalance = operationalBalance + totalYields
```

### Toggle de Visualização
```typescript
const displayBalance = showYields 
  ? operationalBalance + totalYields 
  : operationalBalance
```

## ⚠️ Princípios Fundamentais

1. **Rendimento ≠ Receita**: Rendimento é patrimonial, não afeta fluxo de caixa
2. **Rendimento ≠ Transação**: Não polui o histórico financeiro
3. **Histórico Imutável**: Transações financeiras são sagradas
4. **Determinístico**: Mesmo input = mesmo output
5. **Auditável**: Todo cálculo é rastreável

## 🎯 Benefícios

✅ **Reserva de Emergência** funciona como banco real  
✅ **Juros não "sujam"** o sistema  
✅ **Saldo é confiável**  
✅ **Base pronta** para investimentos avançados  
✅ **Separação clara** entre liquidez e investimento  

## 🚀 Próximos Passos

1. Implementar scheduler para execução automática diária
2. Integrar API de CDI real (Banco Central)
3. Adicionar suporte para SELIC
4. Dashboard de rendimentos no frontend
5. Relatórios de performance

## 📝 Notas de Implementação

- A taxa CDI deve ser obtida de fonte confiável (ex: API do Banco Central)
- O sistema deve rodar apenas em dias úteis
- Considerar feriados bancários
- Implementar retry logic para falhas
- Adicionar logs detalhados para auditoria
