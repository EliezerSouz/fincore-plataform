# 🔍 AUDITORIA: Chamadas Diretas ao Supabase

**Data**: 25/12/2025
**Objetivo**: Identificar todas as operações que estão indo direto para o Supabase ao invés de passar pela API do backend

## ❌ Chamadas Diretas Encontradas

### 1. **Balance Adjustments** (`caixa/accounts/balance-adjustments-actions.ts`)
- **Linha 87**: `supabase.from('accounts').update({ balance: input.balance })`
- **Linha 366**: `.update({ is_historical: false })`
- **Linha 380**: `.insert({...})`
- **Impacto**: Ajustes de saldo estão sendo salvos direto no Supabase
- **Ação**: Migrar para `/api/balance-adjustments`

### 2. **Payment Methods** (`sistema/payment-methods/actions.ts`)
- **Linha 106**: `.insert({...})`
- **Linha 168**: `.update({...})`
- **Linha 213**: `.delete()`
- **Impacto**: Métodos de pagamento estão sendo gerenciados direto no Supabase
- **Ação**: Migrar para `/api/payment-methods`

### 3. **User Account** (`sistema/account/actions.ts`)
- **Linha 23**: `.update(updates)`
- **Impacto**: Atualizações de perfil de usuário estão indo direto para o Supabase
- **Ação**: Migrar para `/api/users/me`

## ✅ Operações Corretas (Usando API)

- ✅ Transactions → `/api/transactions`
- ✅ Credit Cards → `/api/cards`
- ✅ Card Transactions → `/api/invoices/transactions`
- ✅ Categories → `/api/categories`
- ✅ Accounts → `/api/accounts`
- ✅ Payables → `/api/payables`

## 📋 Plano de Ação

### Prioridade Alta
1. **Balance Adjustments**: Já existe endpoint `/api/balance-adjustments`, mas o frontend não está usando
2. **Payment Methods**: Já existe endpoint `/api/payment-methods`, mas o frontend não está usando

### Prioridade Média
3. **User Account**: Precisa criar endpoint para atualização de perfil

## 🎯 Benefícios de Migrar para API

1. **Segurança**: Validação centralizada no backend
2. **Auditoria**: Logs de todas as operações
3. **Regras de Negócio**: Lógica centralizada
4. **Manutenção**: Mais fácil de debugar e testar
5. **Performance**: Possibilidade de cache e otimizações

## 📝 Notas

- A maioria das operações **JÁ** está usando a API corretamente
- As chamadas diretas ao Supabase são **legadas** de quando o sistema não tinha backend completo
- Todos os endpoints necessários **JÁ EXISTEM** no backend, só precisa atualizar o frontend
