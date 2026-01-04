# 🔍 Scripts de Debug - FinCore Backend

**Total**: 29 scripts  
**Propósito**: Diagnóstico, inspeção e auditoria  
**Status**: Arquivados (não usar em produção)

---

## ⚠️ ATENÇÃO

Estes scripts foram usados durante o desenvolvimento para:
- Diagnosticar problemas
- Inspecionar dados
- Auditar estruturas
- Validar migrações

**NÃO executar em produção sem revisar!**

---

## 📂 Categorias

### Check (Verificação)
Scripts que verificam estruturas e dados:
- `check_account_existence.go` - Verifica existência de contas
- `check_all_accounts.go` - Lista todas as contas
- `check_parent_accounts_structure.go` - Valida estrutura de parent accounts
- `check_pockets_structure.go` - Valida estrutura de pockets
- `check_pocket_balances.go` - Verifica saldos de pockets
- `check_tables.go` - Lista tabelas do banco
- `check_migration.go` - Valida migrations
- etc.

### Diagnose (Diagnóstico)
Scripts que diagnosticam problemas específicos:
- `diagnose_account_constraint.go` - Diagnostica constraints de accounts
- `diagnose_frontend_totals.go` - Diagnostica totais do frontend
- `diagnose_transaction_error.go` - Diagnostica erros em transações

### Inspect (Inspeção)
Scripts que inspecionam dados detalhados:
- `inspect_user.go` - Inspeciona dados de usuário
- `inspect_specific_account.go` - Inspeciona conta específica
- `inspect_all_users.go` - Lista todos os usuários

### Audit (Auditoria)
Scripts de auditoria:
- `audit_dashboard.go` - Auditoria do dashboard
- `audit_invoice.go` - Auditoria de faturas

### List (Listagem)
Scripts que listam dados:
- `list_pockets.go` - Lista todos os pockets
- `list_tables.go` - Lista tabelas do banco

---

## 🚀 Como Usar

### 1. Revisar o código
```bash
# Sempre leia o código antes de executar
cat backend/scripts/debug/check_pockets_structure.go
```

### 2. Executar em ambiente de desenvolvimento
```bash
# NUNCA em produção!
cd backend/scripts/debug
go run check_pockets_structure.go
```

### 3. Documentar resultados
Sempre documente o que encontrou e as ações tomadas.

---

## 📊 Estatísticas

- **Check**: ~15 scripts
- **Diagnose**: ~3 scripts
- **Inspect**: ~4 scripts
- **Audit**: ~2 scripts
- **List**: ~2 scripts

---

## 🔒 Segurança

- ✅ Apenas leitura (maioria)
- ⚠️ Alguns podem modificar dados
- ❌ Não usar em produção
- ✅ Sempre fazer backup antes

---

*Organizado em: 04/01/2026*  
*Mantido para referência histórica*
