# 🧪 Guia de Testes - Parent Accounts + Pockets

## 📋 Pré-requisitos

1. ✅ Backend rodando (`go run cmd/api/main.go`)
2. ✅ Banco de dados PostgreSQL ativo
3. ✅ Token JWT válido do Supabase
4. ✅ Migrations executadas

---

## 🚀 Passo 1: Executar Migrations

### 1.1 Migration - Criar Estrutura
```bash
# Conectar ao banco
psql -U postgres -d financeiro

# Executar migration de estrutura
\i backend/migrations/20251226000000_create_pockets_model.sql
```

**Resultado esperado:**
```
✅ Migration executada com sucesso!
✅ Tabelas criadas: parent_accounts, pockets
✅ Colunas adicionadas: transactions.pocket_id, liquidity_yields.pocket_id
✅ Sistema antigo continua 100% funcional
```

### 1.2 Migration - Migrar Dados
```bash
# Executar migration de dados
\i backend/migrations/20251226000001_migrate_accounts_to_pockets.sql
```

**Resultado esperado:**
```
========================================
Migração concluída!
✅ Migradas: X
⏭️  Já existentes: 0
❌ Erros: 0
📊 Total: X
========================================
```

---

## 🧪 Passo 2: Validar Migrations

### 2.1 Verificar Tabelas Criadas
```sql
-- Verificar parent_accounts
SELECT COUNT(*) FROM parent_accounts;

-- Verificar pockets
SELECT COUNT(*) FROM pockets;

-- Ver distribuição por tipo
SELECT pocket_type, COUNT(*) 
FROM pockets 
GROUP BY pocket_type;
```

**Resultado esperado:**
```
CAIXA          | X
RESERVA_CDI    | Y
INVESTIMENTO   | Z
```

### 2.2 Verificar Dados Migrados
```sql
-- Ver parent accounts criadas
SELECT id, institution_name, institution_type, is_active 
FROM parent_accounts 
LIMIT 5;

-- Ver pockets criados
SELECT p.name, p.pocket_type, p.balance, pa.institution_name
FROM pockets p
JOIN parent_accounts pa ON p.parent_account_id = pa.id
LIMIT 10;
```

### 2.3 Verificar Auditoria
```sql
-- Ver status da migração
SELECT 
    status,
    COUNT(*) as total
FROM migration_audit
WHERE migration_name = 'accounts_to_pockets'
GROUP BY status;
```

**Resultado esperado:**
```
SUCCESS | X
ERROR   | 0
```

---

## 📡 Passo 3: Testar APIs

### 3.1 Obter Token JWT

Faça login no frontend ou use o Supabase para obter um token JWT válido.

```bash
# Exportar token
export TOKEN="seu-token-jwt-aqui"
```

### 3.2 Testar Parent Accounts

#### Listar todas as Parent Accounts
```bash
curl -X GET http://localhost:8080/api/parent-accounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Resposta esperada:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "institution_name": "MERCADO PAGO",
    "institution_type": "digital_bank",
    "color": "#00b8d4",
    "is_active": true,
    "total_balance": 1500.00,
    "caixa_balance": 500.00,
    "reserva_balance": 1000.00,
    "investimento_balance": 0.00,
    "created_at": "2025-12-26T00:00:00Z",
    "updated_at": "2025-12-26T00:00:00Z"
  }
]
```

#### Buscar Parent Account com Pockets
```bash
curl -X GET http://localhost:8080/api/parent-accounts/{id}/with-pockets \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta esperada:**
```json
{
  "id": "uuid",
  "institution_name": "MERCADO PAGO",
  "total_balance": 1500.00,
  "pockets": [
    {
      "id": "uuid",
      "name": "Caixa",
      "pocket_type": "CAIXA",
      "balance": 500.00
    },
    {
      "id": "uuid",
      "name": "Reserva",
      "pocket_type": "RESERVA_CDI",
      "balance": 1000.00,
      "yield_enabled": true,
      "yield_cdi_rate": 120
    }
  ]
}
```

#### Criar Nova Parent Account
```bash
curl -X POST http://localhost:8080/api/parent-accounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "institution_name": "Banco Inter",
    "institution_type": "digital_bank",
    "color": "#FF7A00"
  }'
```

### 3.3 Testar Pockets

#### Listar todos os Pockets
```bash
curl -X GET http://localhost:8080/api/pockets \
  -H "Authorization: Bearer $TOKEN"
```

#### Criar Novo Pocket
```bash
curl -X POST http://localhost:8080/api/pockets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parent_account_id": "uuid-da-parent-account",
    "name": "Reserva de Emergência",
    "pocket_type": "RESERVA_CDI",
    "yield_enabled": true,
    "yield_source": "CDI",
    "yield_cdi_rate": 105,
    "color": "#4CAF50"
  }'
```

**Resposta esperada:**
```json
{
  "id": "novo-uuid",
  "parent_account_id": "uuid-da-parent-account",
  "name": "RESERVA DE EMERGÊNCIA",
  "pocket_type": "RESERVA_CDI",
  "balance": 0.00,
  "yield_enabled": true,
  "yield_cdi_rate": 105,
  "is_active": true
}
```

#### Recalcular Saldo de um Pocket
```bash
curl -X POST http://localhost:8080/api/pockets/{id}/recalculate-balance \
  -H "Authorization: Bearer $TOKEN"
```

---

## ✅ Checklist de Validação

### Database
- [ ] Tabela `parent_accounts` criada
- [ ] Tabela `pockets` criada
- [ ] Coluna `transactions.pocket_id` adicionada
- [ ] Coluna `liquidity_yields.pocket_id` adicionada
- [ ] Função `calculate_pocket_balance()` criada
- [ ] View `v_parent_account_balances` criada

### Migration
- [ ] Todas as contas migradas com sucesso
- [ ] Nenhum erro na auditoria
- [ ] Tipos de pocket corretos (CAIXA, RESERVA_CDI, INVESTIMENTO)
- [ ] Saldos preservados
- [ ] Configurações de yield migradas

### APIs - Parent Accounts
- [ ] GET /api/parent-accounts (listar)
- [ ] GET /api/parent-accounts/:id (buscar)
- [ ] GET /api/parent-accounts/:id/with-pockets (com pockets)
- [ ] POST /api/parent-accounts (criar)
- [ ] PUT /api/parent-accounts/:id (atualizar)
- [ ] DELETE /api/parent-accounts/:id (deletar)

### APIs - Pockets
- [ ] GET /api/pockets (listar)
- [ ] GET /api/pockets/:id (buscar)
- [ ] POST /api/pockets (criar)
- [ ] PUT /api/pockets/:id (atualizar)
- [ ] DELETE /api/pockets/:id (deletar)
- [ ] POST /api/pockets/:id/recalculate-balance (recalcular)

### Segurança
- [ ] Autenticação JWT funcionando
- [ ] Validação de ownership (user_id)
- [ ] Validação de input
- [ ] Soft delete funcionando

---

## 🐛 Troubleshooting

### Erro: "parent account not found"
- Verificar se o ID está correto
- Verificar se pertence ao usuário autenticado

### Erro: "pocket_type deve ser CAIXA, RESERVA_CDI ou INVESTIMENTO"
- Verificar se o tipo está correto
- Usar exatamente esses valores (case-sensitive)

### Erro: "yield_enabled só pode ser true para pockets do tipo RESERVA_CDI"
- Apenas pockets RESERVA_CDI podem ter yield_enabled = true
- Para outros tipos, deixar yield_enabled = false

### Erro: "yield_cdi_rate deve ser maior que 0"
- Se yield_enabled = true, yield_cdi_rate deve ser > 0
- Valores típicos: 100, 105, 120

---

## 📊 Queries Úteis

### Ver resumo completo
```sql
SELECT 
    pa.institution_name,
    p.name as pocket_name,
    p.pocket_type,
    p.balance,
    p.yield_enabled,
    p.yield_cdi_rate
FROM parent_accounts pa
JOIN pockets p ON pa.id = p.parent_account_id
WHERE pa.is_active = true
ORDER BY pa.institution_name, p.display_order;
```

### Ver saldos agregados
```sql
SELECT * FROM v_parent_account_balances;
```

### Ver histórico de migração
```sql
SELECT 
    ma.status,
    a.name as old_account_name,
    pa.institution_name as new_institution,
    p.name as new_pocket_name,
    p.pocket_type
FROM migration_audit ma
LEFT JOIN accounts a ON ma.old_account_id = a.id
LEFT JOIN parent_accounts pa ON ma.new_parent_account_id = pa.id
LEFT JOIN pockets p ON ma.new_pocket_id = p.id
WHERE ma.migration_name = 'accounts_to_pockets'
ORDER BY ma.created_at DESC;
```

---

## 🎯 Próximos Passos Após Validação

Se todos os testes passarem:
1. ✅ Commit dos testes
2. ✅ Documentar resultados
3. ✅ Continuar para Sprint 3 (Frontend)

Se houver erros:
1. ❌ Executar rollback se necessário
2. 🔧 Corrigir problemas
3. 🔄 Re-executar migrations
