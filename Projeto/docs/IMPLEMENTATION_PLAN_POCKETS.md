# 🏗️ Plano de Implementação - Modelo Conta Mãe + Subcontas (Pockets)

## 📋 Visão Geral

Transformar o FinCore de um sistema de contas simples para um modelo de **fintech madura** com:
- Conta Mãe (Instituição)
- Subcontas (Pockets) com finalidades específicas
- Separação clara entre liquidez e disponibilidade
- Base sólida para investimentos

---

## 🎯 Objetivos

1. ✅ Separar claramente liquidez e finalidade do dinheiro
2. ✅ Evitar confusão de saldo disponível
3. ✅ Permitir rendimentos automáticos
4. ✅ Ser escalável para investimentos reais
5. ✅ Educar o usuário financeiramente

---

## 📊 Modelo de Dados

### 1. Tabela: `parent_accounts` (Contas Mãe)

```sql
CREATE TABLE parent_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_name VARCHAR(100) NOT NULL,  -- Ex: "Mercado Pago", "Nubank", "Inter"
    institution_type VARCHAR(50),             -- Ex: "digital_bank", "traditional_bank", "fintech"
    color VARCHAR(7),                         -- Cor da instituição
    logo_url TEXT,                            -- URL do logo
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, institution_name)
);

CREATE INDEX idx_parent_accounts_user ON parent_accounts(user_id);
```

### 2. Tabela: `pockets` (Subcontas)

```sql
CREATE TABLE pockets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_account_id UUID NOT NULL REFERENCES parent_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Identificação
    name VARCHAR(100) NOT NULL,               -- Ex: "Caixa", "Reserva", "Ações"
    pocket_type VARCHAR(50) NOT NULL,         -- CAIXA, RESERVA_CDI, INVESTIMENTO
    
    -- Saldo (calculado dinamicamente, mas pode ser cacheado)
    balance DECIMAL(15, 2) DEFAULT 0,
    
    -- Configuração de Rendimento (apenas para RESERVA_CDI)
    yield_enabled BOOLEAN DEFAULT false,
    yield_source VARCHAR(50),                 -- "CDI"
    yield_cdi_rate FLOAT DEFAULT 0,          -- Percentual do CDI (100, 105, 120)
    last_yield_date DATE,
    
    -- Configuração de Investimento (apenas para INVESTIMENTO)
    investment_type VARCHAR(50),              -- "FII", "ACAO", "RENDA_FIXA", "ETF"
    
    -- Metadata
    color VARCHAR(7),
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT check_pocket_type CHECK (pocket_type IN ('CAIXA', 'RESERVA_CDI', 'INVESTIMENTO'))
);

CREATE INDEX idx_pockets_parent ON pockets(parent_account_id);
CREATE INDEX idx_pockets_user ON pockets(user_id);
CREATE INDEX idx_pockets_type ON pockets(pocket_type);
```

### 3. Atualizar Tabela: `transactions`

```sql
-- Adicionar referência à subconta
ALTER TABLE transactions 
ADD COLUMN pocket_id UUID REFERENCES pockets(id) ON DELETE RESTRICT;

-- Remover referência direta à conta antiga (após migração)
-- ALTER TABLE transactions DROP COLUMN account_id;

CREATE INDEX idx_transactions_pocket ON transactions(pocket_id);
```

### 4. Atualizar Tabela: `liquidity_yields`

```sql
-- Adicionar referência à subconta
ALTER TABLE liquidity_yields 
ADD COLUMN pocket_id UUID REFERENCES pockets(id) ON DELETE CASCADE;

-- Remover referência direta à conta antiga (após migração)
-- ALTER TABLE liquidity_yields DROP COLUMN account_id;

CREATE INDEX idx_liquidity_yields_pocket ON liquidity_yields(pocket_id);
```

---

## 🔄 Estratégia de Migração

### Fase 1: Criar Novas Estruturas (Sem Quebrar)
1. ✅ Criar tabelas `parent_accounts` e `pockets`
2. ✅ Adicionar colunas `pocket_id` nas tabelas existentes (nullable)
3. ✅ Manter `account_id` funcionando

### Fase 2: Migração de Dados
1. ✅ Para cada `account` existente:
   - Criar `parent_account` (instituição)
   - Criar `pocket` do tipo apropriado:
     - `type = 'corrente'` → `CAIXA`
     - `type = 'digital'` → `CAIXA`
     - `type = 'reserva_emergencia'` → `RESERVA_CDI`
     - `type = 'investimento'` → `INVESTIMENTO`
     - `type = 'poupanca'` → `RESERVA_CDI`
   - Migrar `yield_enabled`, `yield_cdi_rate` para o pocket
   - Atualizar `transactions` e `liquidity_yields`

### Fase 3: Atualizar Backend
1. ✅ Criar entities: `ParentAccount`, `Pocket`
2. ✅ Criar repositories
3. ✅ Atualizar services para usar pockets
4. ✅ Atualizar handlers/controllers

### Fase 4: Atualizar Frontend
1. ✅ Criar componentes de visualização hierárquica
2. ✅ Atualizar formulários
3. ✅ Atualizar dashboard

### Fase 5: Limpeza
1. ✅ Remover colunas antigas
2. ✅ Remover código legado

---

## 🎨 UX/UI Proposta

### Dashboard - Visão por Instituição

```
┌─────────────────────────────────────────────────┐
│ 🏦 MERCADO PAGO                    R$ 15.420,00 │
├─────────────────────────────────────────────────┤
│   💰 Caixa                          R$ 5.000,00 │
│   🛡️ Reserva CDI (120%)            R$ 10.000,00 │
│      └─ Rendendo R$ 6,50/dia                    │
│   📈 Investimentos                   R$ 420,00  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🏦 NUBANK                           R$ 8.250,00 │
├─────────────────────────────────────────────────┤
│   💰 Caixa                          R$ 3.000,00 │
│   🛡️ Reserva CDI (105%)             R$ 5.250,00 │
│      └─ Rendendo R$ 2,85/dia                    │
└─────────────────────────────────────────────────┘
```

### Resumo Financeiro

```
💰 Disponível (Caixa)        R$ 8.000,00
🛡️ Guardado (Reserva)        R$ 15.250,00
📈 Investido                  R$ 420,00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💎 Patrimônio Total          R$ 23.670,00
```

---

## 📝 Regras de Negócio

### Criação de Transação
```
1. Usuário seleciona INSTITUIÇÃO
2. Sistema mostra POCKETS disponíveis
3. Usuário seleciona POCKET específico
4. Transação é vinculada ao pocket
```

### Transferência entre Pockets
```
Transferência Interna:
- Origem: Mercado Pago > Caixa
- Destino: Mercado Pago > Reserva CDI
- Tipo: TRANSFER_INTERNAL
- Não gera entrada/saída externa
```

### Rendimento CDI
```
1. Scheduler roda diariamente
2. Busca pockets com pocket_type = 'RESERVA_CDI' AND yield_enabled = true
3. Calcula rendimento
4. Salva em liquidity_yields vinculado ao pocket_id
5. NÃO cria transação
```

### Cálculo de Saldos
```go
// Saldo do Pocket
func GetPocketBalance(pocketID) {
    baseBalance = SUM(transactions WHERE pocket_id = pocketID)
    
    if pocket.type == RESERVA_CDI {
        yields = SUM(liquidity_yields WHERE pocket_id = pocketID)
        return baseBalance + yields
    }
    
    return baseBalance
}

// Saldo da Conta Mãe
func GetParentAccountBalance(parentID) {
    pockets = GetPockets(parentID)
    return SUM(pocket.balance for pocket in pockets)
}
```

---

## 🚀 Ordem de Implementação

### Sprint 1: Fundação (2-3 dias)
- [ ] Criar migrations
- [ ] Criar entities
- [ ] Criar repositories básicos
- [ ] Script de migração de dados

### Sprint 2: Backend Core (2-3 dias)
- [ ] Services de Parent Account
- [ ] Services de Pockets
- [ ] Atualizar Transaction Service
- [ ] Atualizar Yield Service
- [ ] Handlers/Controllers

### Sprint 3: Frontend (3-4 dias)
- [ ] Componentes de visualização
- [ ] Formulários de criação
- [ ] Dashboard atualizado
- [ ] Transferências entre pockets

### Sprint 4: Testes e Refinamento (2 dias)
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Ajustes de UX
- [ ] Documentação

---

## ⚠️ Pontos de Atenção

1. **Migração de Dados**
   - Backup completo antes de migrar
   - Script reversível
   - Validação de integridade

2. **Performance**
   - Índices corretos
   - Queries otimizadas
   - Cache de saldos quando necessário

3. **UX**
   - Não confundir usuário na transição
   - Mensagens claras sobre finalidade do dinheiro
   - Onboarding para novo modelo

4. **Compatibilidade**
   - Manter APIs antigas funcionando durante transição
   - Deprecation warnings
   - Documentação de breaking changes

---

## 📚 Próximos Passos

1. **Revisar e aprovar este plano**
2. **Criar branch feature/pockets-model**
3. **Começar pela Sprint 1**
4. **Revisões incrementais**

---

## 🎯 Resultado Final

Após implementação completa:
- ✅ Sistema escalável para investimentos
- ✅ Separação clara de finalidades
- ✅ UX educativa
- ✅ Base sólida para FinCore Invest
- ✅ Arquitetura de fintech madura
