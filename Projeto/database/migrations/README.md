# 📋 Migrations - FinCore Database

**Última atualização**: 04/01/2026  
**Status**: Consolidado e Organizado

---

## 🎯 Fresh Install (Banco Novo)

Para criar o banco de dados do zero:

```bash
# 1. Conectar ao PostgreSQL
psql -h SEU_HOST -U SEU_USUARIO -d postgres

# 2. Criar banco (se não existir)
CREATE DATABASE fincore;

# 3. Conectar ao banco
\c fincore

# 4. Executar migration consolidada
\i database/migrations/consolidated/001_initial_schema.sql

# 5. Verificar instalação
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Deve retornar aproximadamente 20-25 tabelas
```

### Usando Supabase

```bash
# Executar via Supabase CLI
supabase db push --file database/migrations/consolidated/001_initial_schema.sql

# Ou via Dashboard:
# 1. Acessar Supabase Dashboard
# 2. SQL Editor
# 3. Copiar e colar conteúdo de 001_initial_schema.sql
# 4. Executar
```

---

## 📚 Estrutura de Tabelas

### Core (Usuários e Autenticação)
- `users` - Usuários do sistema
- `promo_codes` - Códigos promocionais

### Categorização
- `categories` - Categorias de transações
- `subcategories` - Subcategorias
- `payment_methods` - Métodos de pagamento

### Contas e Transações
- `parent_accounts` - Instituições financeiras (bancos)
- `pockets` - Subcontas (multi-conta)
- `accounts` - Contas (legacy)
- `transactions` - Transações financeiras
- `account_balance_adjustments` - Ajustes de saldo

### Rendimentos
- `liquidity_yields` - Rendimentos CDI

### Cartões de Crédito
- `credit_cards` - Cartões
- `credit_card_invoices` - Faturas
- `credit_card_transactions` - Transações de cartão

### Contas a Pagar
- `payables` - Contas a pagar

### Investimentos
- `investments` - Investimentos
- `investment_transactions` - Transações de investimento
- `asset_prices` - Preços de ativos

---

## 🗂️ Migrations Antigas (Arquivadas)

As **120 migrations antigas** foram movidas para `_archive/` em 04/01/2026.

Elas foram **consolidadas** em `001_initial_schema.sql`.

### Por que consolidar?

**Antes** (120 arquivos):
- ❌ Ordem confusa
- ❌ Nomes duplicados
- ❌ Impossível fresh install
- ❌ Difícil manutenção

**Depois** (1 arquivo):
- ✅ Ordem clara
- ✅ Fresh install funciona
- ✅ Fácil manutenção
- ✅ Documentado

---

## 🔄 Próximas Migrations

Novas migrations devem seguir o padrão:

```
002_add_feature_x.sql
003_fix_issue_y.sql
004_alter_table_z.sql
```

### Template de Migration

```sql
-- ============================================
-- Migration: [NÚMERO]_[DESCRIÇÃO]
-- ============================================
-- Data: DD/MM/YYYY
-- Autor: Nome
-- Descrição: O que esta migration faz
-- ============================================

-- Suas alterações aqui

-- ============================================
-- Rollback (se aplicável)
-- ============================================

-- DROP TABLE IF EXISTS ...;
```

### Checklist antes de criar migration

- [ ] Testei em banco de desenvolvimento
- [ ] Testei fresh install (001_initial_schema.sql + nova migration)
- [ ] Documentei o que a migration faz
- [ ] Adicionei rollback (se possível)
- [ ] Revisei código SQL
- [ ] Commit com mensagem clara

---

## 🧪 Testando Migrations

### Teste 1: Fresh Install

```bash
# Criar banco limpo
dropdb fincore_test
createdb fincore_test

# Executar migration consolidada
psql -d fincore_test -f database/migrations/consolidated/001_initial_schema.sql

# Verificar
psql -d fincore_test -c "\dt"
```

### Teste 2: Validar Estrutura

```bash
# Verificar tabelas
psql -d fincore_test -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"

# Verificar functions
psql -d fincore_test -c "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY routine_name;"

# Verificar triggers
psql -d fincore_test -c "SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public' ORDER BY trigger_name;"
```

### Teste 3: Validar RLS

```bash
# Verificar policies
psql -d fincore_test -c "SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;"
```

---

## 📊 Histórico de Mudanças

### v1.0 - 04/01/2026
- ✅ Consolidação de 120 migrations em 1 arquivo
- ✅ Adicionadas tabelas faltantes (parent_accounts, pockets, liquidity_yields)
- ✅ Documentação completa
- ✅ Indexes de performance
- ✅ RLS policies completas
- ✅ Functions e triggers organizados

---

## 🔍 Troubleshooting

### Erro: "relation already exists"

**Causa**: Tentando executar migration em banco que já tem tabelas.

**Solução**:
```bash
# Opção 1: Limpar banco
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Opção 2: Criar novo banco
createdb fincore_fresh
```

### Erro: "permission denied"

**Causa**: Usuário sem permissões.

**Solução**:
```bash
# Conectar como superuser
psql -U postgres -d fincore

# Ou dar permissões
GRANT ALL ON SCHEMA public TO seu_usuario;
```

### Erro: "function does not exist"

**Causa**: Migration executada fora de ordem.

**Solução**:
```bash
# Sempre executar 001_initial_schema.sql primeiro
psql -d fincore -f database/migrations/consolidated/001_initial_schema.sql
```

---

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs do PostgreSQL
2. Validar credenciais de conexão
3. Testar em banco limpo
4. Consultar documentação do Supabase

---

## ✅ Checklist de Validação

Após executar migrations:

- [ ] Todas as tabelas criadas
- [ ] Functions criadas
- [ ] Triggers criados
- [ ] RLS policies ativas
- [ ] Indexes criados
- [ ] Sem erros no log
- [ ] Teste de insert/select funciona

---

**Migrations consolidadas com sucesso!** 🎉

*Última revisão: 04/01/2026*
