# Guia Rápido - Testar Rendimentos CDI

## 1️⃣ Aplicar a Migration

```bash
# Conectar ao banco
psql -U postgres -d financeiro

# Executar
\i backend/migrations/20251225220100_add_yield_cdi_rate.sql
```

Ou via SQL direto:
```sql
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS yield_cdi_rate FLOAT DEFAULT 0;
```

## 2️⃣ Verificar se a conta tem CDI habilitado

```sql
-- Ver contas com CDI
SELECT id, name, yield_enabled, yield_cdi_rate 
FROM accounts 
WHERE yield_enabled = true;
```

Se não tiver nenhuma, você já configurou pelo frontend! ✅

## 3️⃣ Calcular Rendimentos AGORA (Manual)

### Via cURL:

```bash
curl -X POST http://localhost:8080/api/yields/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU-TOKEN-AQUI" \
  -d '{
    "date": "2025-12-25",
    "cdi_rate": 13.65
  }'
```

### Via Postman/Insomnia:

**POST** `http://localhost:8080/api/yields/calculate`

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer SEU-TOKEN`

**Body:**
```json
{
  "date": "2025-12-25",
  "cdi_rate": 13.65
}
```

## 4️⃣ Ver os Resultados

### No Banco de Dados:
```sql
SELECT 
    a.name,
    ly.date,
    ly.base_amount,
    ly.yield_amount,
    ly.rate_applied * 100 as taxa_pct
FROM liquidity_yields ly
JOIN accounts a ON ly.account_id = a.id
ORDER BY ly.date DESC;
```

### No Frontend:
1. Recarregue a página de contas
2. Clique nos 3 pontinhos da conta
3. Selecione "Rendimentos CDI"
4. Veja o histórico!

## 5️⃣ Cálculo Automático (Scheduler)

O scheduler roda **automaticamente** todos os dias às **10:00 AM** em dias úteis.

Ele:
- ✅ Busca a taxa CDI do Banco Central
- ✅ Calcula rendimentos para TODAS as contas com `yield_enabled = true`
- ✅ Salva no banco automaticamente
- ✅ Não duplica (proteção contra re-execução)

## 📊 Exemplo de Cálculo

**Conta:** Mercado Pago  
**Saldo:** R$ 1.000,00  
**Taxa CDI:** 120% do CDI  
**CDI Anual:** 13,65%  

**Cálculo:**
```
CDI Diário = 13,65% / 252 dias úteis = 0,0542% ao dia
Rendimento = R$ 1.000 × 0,000542 × 1,20 = R$ 0,65 por dia
```

## ⚡ Teste Rápido (Sem API)

Se preferir, pode inserir um rendimento manualmente para testar a UI:

```sql
INSERT INTO liquidity_yields (account_id, date, base_amount, yield_amount, rate_applied)
VALUES (
    'SEU-ACCOUNT-ID-AQUI',
    CURRENT_DATE,
    1000.00,
    5.42,
    0.0542
);
```

Depois recarregue o frontend e veja aparecer!

## 🔍 Verificar se está funcionando

```sql
-- Contas com rendimento habilitado
SELECT COUNT(*) FROM accounts WHERE yield_enabled = true;

-- Rendimentos calculados
SELECT COUNT(*) FROM liquidity_yields;

-- Último rendimento
SELECT * FROM liquidity_yields ORDER BY created_at DESC LIMIT 1;
```

---

**Dica:** Para testar agora, use a **Opção 3** (cálculo manual via API) ou insira um registro de teste no banco! 🚀
