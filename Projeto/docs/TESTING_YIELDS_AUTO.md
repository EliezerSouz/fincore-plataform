# 🧪 Teste Automatizado - Sistema de Rendimentos CDI

## Opções de Teste

Você tem **3 opções** para testar o sistema de rendimentos:

### Opção 1: Script SQL Automatizado (Mais Rápido) ⚡

Execute o script SQL que faz tudo automaticamente:

```bash
# Conectar ao banco
psql -U postgres -d financeiro -f backend/migrations/test_yield_system.sql
```

**O que o script faz:**
- ✅ Aplica a migration (adiciona campos)
- ✅ Configura uma conta de teste automaticamente
- ✅ Simula cálculos de rendimento
- ✅ Mostra estatísticas e validações
- ✅ Fornece instruções para próximos passos

### Opção 2: Programa Go de Teste (Mais Completo) 🔧

Execute o programa Go que testa todo o fluxo:

```bash
cd backend
go run cmd/test_yields/main.go
```

**O que o programa faz:**
- ✅ Aplica migration
- ✅ Configura conta de teste
- ✅ **Busca taxa CDI real** do Banco Central
- ✅ **Executa cálculo de rendimento** de verdade
- ✅ Valida resultados
- ✅ Testa proteção contra duplicidade
- ✅ Mostra resumo completo

**Saída esperada:**
```
🧪 FinCore - Teste Automatizado do Sistema de Rendimentos CDI
======================================================================

📝 Step 1: Aplicando Migration...
✅ Migration aplicada com sucesso!

⚙️  Step 2: Configurando conta de teste...
   Conta: Conta Corrente
   Saldo: R$ 10000.00
   Taxa: 100% do CDI
✅ Conta configurada: uuid-da-conta

📊 Step 3: Buscando taxa CDI do Banco Central...
✅ Taxa CDI obtida: 13.65%

💰 Step 4: Calculando rendimentos...
✅ Rendimentos calculados!

🔍 Step 5: Verificando resultados...

📈 RESUMO DA CONTA:
   Saldo Operacional: R$ 10000.00
   Rendimentos Totais: R$ 5.42
   Saldo Total: R$ 10005.42
   Rendimento Habilitado: true
   Taxa: 100.00% do CDI

🛡️  Step 6: Testando proteção contra duplicidade...
✅ Proteção funcionando!

======================================================================
✅ TESTE COMPLETO!
```

### Opção 3: API Manual (Mais Controle) 🎯

Execute via API REST:

#### 3.1 Aplicar Migration Manualmente

```sql
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS yield_enabled BOOLEAN DEFAULT false;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS yield_source VARCHAR(50) DEFAULT NULL;
ALTER TABLE liquidity_yields ADD CONSTRAINT IF NOT EXISTS unique_account_date UNIQUE (account_id, date);
```

#### 3.2 Habilitar Rendimento em uma Conta

```sql
UPDATE accounts 
SET 
    yield_enabled = true,
    yield_source = 'CDI',
    yield_rate = 100.0
WHERE id = 'SEU-ACCOUNT-ID';
```

#### 3.3 Calcular Rendimentos via API

```bash
curl -X POST http://localhost:8080/api/yields/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU-TOKEN" \
  -d '{
    "date": "2025-12-26",
    "cdi_rate": 13.65
  }'
```

#### 3.4 Verificar Resultados

```bash
curl -X GET http://localhost:8080/api/yields/account/SEU-ACCOUNT-ID \
  -H "Authorization: Bearer SEU-TOKEN"
```

## 📊 Validação dos Resultados

### Verificar no Banco de Dados

```sql
-- Ver rendimentos calculados
SELECT 
    ly.date,
    a.name,
    ly.base_amount,
    ly.yield_amount,
    ly.rate_applied * 100 as taxa_pct
FROM liquidity_yields ly
JOIN accounts a ON ly.account_id = a.id
ORDER BY ly.date DESC;

-- Verificar total acumulado
SELECT 
    a.name,
    a.balance as saldo_operacional,
    COALESCE(SUM(ly.yield_amount), 0) as rendimentos_totais,
    a.balance + COALESCE(SUM(ly.yield_amount), 0) as saldo_total
FROM accounts a
LEFT JOIN liquidity_yields ly ON ly.account_id = a.id
WHERE a.yield_enabled = true
GROUP BY a.id, a.name, a.balance;
```

### Validar Cálculo Matemático

Para um saldo de **R$ 10.000,00** com CDI de **13,65% ao ano**:

```
CDI Diário = 13,65% / 252 dias úteis = 0,0542% ao dia
Rendimento = R$ 10.000 × 0,000542 = R$ 5,42
```

## 🚀 Próximos Passos Após Teste

1. **Verificar Scheduler**
   - O scheduler está rodando automaticamente
   - Ele executará às 10:00 AM em dias úteis
   - Verifique os logs do servidor

2. **Testar em Produção**
   - Habilite rendimento em contas reais
   - Monitore os cálculos diários
   - Valide com clientes

3. **Implementar Frontend**
   - Exibir rendimentos no dashboard
   - Toggle para mostrar/ocultar rendimentos
   - Histórico de rendimentos

4. **Melhorias Futuras**
   - Suporte para SELIC
   - Diferentes percentuais por conta
   - Relatórios de performance
   - Notificações de rendimento

## ⚠️ Troubleshooting

### "No active account found"
- Crie uma conta primeiro no sistema
- Certifique-se que `is_active = true`

### "Failed to fetch CDI rate"
- API do Banco Central pode estar offline
- Use taxa manual como fallback
- Verifique conexão com internet

### "Duplicate key violation"
- Já existe cálculo para esta data
- Use o endpoint de reprocessamento
- Ou delete o registro existente primeiro

### Rendimento = 0
- Verifique `yield_enabled = true`
- Verifique `yield_source = 'CDI'`
- Verifique `yield_rate > 0`
- Verifique saldo da conta > 0

## 📝 Logs Importantes

Ao executar, você verá logs como:

```
✅ Yield calculated for account {id}: Base=10000.00, Yield=5.42, Rate=0.0542%
⏭️  Yield already calculated for account {id} on 2025-12-26
🧹 Cleaning up duplicate credit: {id} (Active but Duplicate)
📊 Fetched CDI rate from Banco Central: 13.65% (date: 25/12/2025)
```

## ✅ Checklist de Sucesso

- [ ] Migration aplicada
- [ ] Conta configurada com `yield_enabled = true`
- [ ] Taxa CDI obtida (API ou manual)
- [ ] Rendimento calculado
- [ ] Valor correto no banco
- [ ] Proteção contra duplicidade funcionando
- [ ] Scheduler rodando
- [ ] API respondendo corretamente

---

**Recomendação:** Comece com a **Opção 2 (Programa Go)** para um teste completo e automatizado! 🚀
