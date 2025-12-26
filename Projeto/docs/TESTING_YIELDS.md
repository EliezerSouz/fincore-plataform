# Guia de Teste - Sistema de Rendimentos CDI

## 🧪 Passo a Passo para Testar

### 1. Preparar o Ambiente

#### 1.1 Rodar a Migration
```bash
# Conectar ao banco e executar:
psql -U postgres -d financeiro

# Ou via migration tool
```

```sql
-- Verificar se os campos foram criados
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'accounts' 
AND column_name IN ('yield_enabled', 'yield_source', 'yield_rate');

-- Verificar constraint de unicidade
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'liquidity_yields' 
AND constraint_type = 'UNIQUE';
```

### 2. Habilitar Rendimento em uma Conta

```sql
-- Atualizar uma conta existente para ter rendimento CDI
UPDATE accounts 
SET 
    yield_enabled = true,
    yield_source = 'CDI',
    yield_rate = 100.0,  -- 100% do CDI
    updated_at = NOW()
WHERE id = 'SEU-ACCOUNT-ID-AQUI';

-- Verificar
SELECT id, name, balance, yield_enabled, yield_source, yield_rate 
FROM accounts 
WHERE yield_enabled = true;
```

### 3. Testar API do Banco Central

```bash
# Testar se a API do Banco Central está respondendo
curl "https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=20/12/2025&dataFinal=25/12/2025"
```

Resposta esperada:
```json
[
  {
    "data": "20/12/2025",
    "valor": "13.65"
  }
]
```

### 4. Executar Cálculo Manual

```bash
# Calcular rendimentos para hoje
curl -X POST http://localhost:8080/api/yields/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU-TOKEN" \
  -d '{
    "date": "2025-12-25",
    "cdi_rate": 13.65
  }'
```

Resposta esperada:
```json
{
  "message": "Yields calculated successfully",
  "date": "2025-12-25"
}
```

### 5. Verificar Rendimentos Calculados

```sql
-- Ver rendimentos calculados
SELECT 
    ly.id,
    a.name as account_name,
    ly.date,
    ly.base_amount,
    ly.yield_amount,
    ly.rate_applied,
    ly.created_at
FROM liquidity_yields ly
JOIN accounts a ON ly.account_id = a.id
ORDER BY ly.date DESC, ly.created_at DESC
LIMIT 10;
```

### 6. Obter Resumo de Rendimentos via API

```bash
# Substituir {account-id} pelo ID da conta
curl -X GET http://localhost:8080/api/yields/account/{account-id} \
  -H "Authorization: Bearer SEU-TOKEN"
```

Resposta esperada:
```json
{
  "operational_balance": 10000.00,
  "total_yields": 5.50,
  "total_balance": 10005.50,
  "recent_yields": [
    {
      "id": "uuid",
      "account_id": "uuid",
      "date": "2025-12-25",
      "base_amount": 10000.00,
      "yield_amount": 5.50,
      "rate_applied": 0.0544,
      "created_at": "2025-12-25T10:00:00Z"
    }
  ],
  "yield_enabled": true,
  "yield_rate": 100.0
}
```

### 7. Testar Proteção contra Duplicidade

```bash
# Tentar calcular novamente para a mesma data
curl -X POST http://localhost:8080/api/yields/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU-TOKEN" \
  -d '{
    "date": "2025-12-25",
    "cdi_rate": 13.65
  }'
```

Deve pular a conta (já calculado) e mostrar no log:
```
⏭️  Yield already calculated for account {id} on 2025-12-25
```

### 8. Testar Reprocessamento

```bash
# Reprocessar um dia específico
curl -X POST http://localhost:8080/api/yields/reprocess \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU-TOKEN" \
  -d '{
    "account_id": "uuid",
    "date": "2025-12-25",
    "cdi_rate": 13.70
  }'
```

Deve deletar o registro antigo e criar um novo com a nova taxa.

### 9. Verificar Scheduler

```bash
# Ver status do scheduler
curl -X GET http://localhost:8080/api/scheduler/status \
  -H "Authorization: Bearer SEU-TOKEN"
```

Resposta:
```json
{
  "running": true,
  "message": "Yield scheduler status"
}
```

## 📊 Validação dos Cálculos

### Fórmula Esperada

```
Saldo Operacional: R$ 10.000,00
CDI Anual: 13,65%
Taxa da Conta: 100% do CDI
Dias Úteis no Ano: 252

CDI Diário = 13,65 / 252 = 0,0542%
Rendimento = 10.000 × 0,000542 × 1,00 = R$ 5,42
```

### Validação SQL

```sql
-- Calcular manualmente e comparar
WITH calc AS (
    SELECT 
        a.id,
        a.name,
        a.balance as operational_balance,
        COALESCE(SUM(ly_prev.yield_amount), 0) as previous_yields,
        (a.balance + COALESCE(SUM(ly_prev.yield_amount), 0)) as base_amount,
        ((a.balance + COALESCE(SUM(ly_prev.yield_amount), 0)) * (13.65 / 252.0 / 100.0) * (a.yield_rate / 100.0)) as expected_yield
    FROM accounts a
    LEFT JOIN liquidity_yields ly_prev ON ly_prev.account_id = a.id 
        AND ly_prev.date < '2025-12-25'
    WHERE a.yield_enabled = true
    GROUP BY a.id, a.name, a.balance, a.yield_rate
)
SELECT 
    c.*,
    ly.yield_amount as actual_yield,
    ABS(c.expected_yield - ly.yield_amount) as difference
FROM calc c
LEFT JOIN liquidity_yields ly ON ly.account_id = c.id AND ly.date = '2025-12-25';
```

## ⚠️ Troubleshooting

### Erro: "no CDI data available"
- Verificar se a data é um dia útil
- Verificar conexão com API do Banco Central
- Usar taxa manual como fallback

### Erro: "duplicate key value violates unique constraint"
- Já existe cálculo para esta data
- Use o endpoint de reprocessamento se necessário

### Rendimento = 0
- Verificar se `yield_enabled = true`
- Verificar se `yield_source = 'CDI'`
- Verificar se `yield_rate > 0`
- Verificar se o saldo da conta > 0

### Scheduler não executa
- Verificar se hoje é dia útil
- Verificar se já passou das 10:00 AM
- Verificar logs do servidor

## 📈 Cenários de Teste

### Cenário 1: Primeira Execução
- Conta com R$ 10.000
- Sem rendimentos anteriores
- Base = R$ 10.000
- Rendimento esperado ≈ R$ 5,42

### Cenário 2: Com Rendimentos Acumulados
- Conta com R$ 10.000
- Rendimentos anteriores: R$ 100
- Base = R$ 10.100
- Rendimento esperado ≈ R$ 5,47

### Cenário 3: Taxa Parcial do CDI
- Conta com yield_rate = 80%
- Rende 80% do CDI
- Rendimento = base × CDI × 0,80

### Cenário 4: Múltiplas Contas
- 3 contas com rendimento habilitado
- Todas devem ser processadas
- Cada uma com seu próprio cálculo

## ✅ Checklist de Validação

- [ ] Migration executada com sucesso
- [ ] Campos criados na tabela accounts
- [ ] Constraint UNIQUE criada em liquidity_yields
- [ ] Conta habilitada para rendimento CDI
- [ ] API do Banco Central respondendo
- [ ] Cálculo manual executado com sucesso
- [ ] Rendimento registrado no banco
- [ ] Valor calculado está correto (±0,01)
- [ ] Proteção contra duplicidade funcionando
- [ ] Reprocessamento funcionando
- [ ] Scheduler iniciado
- [ ] Logs claros e informativos
- [ ] API de resumo retornando dados corretos
