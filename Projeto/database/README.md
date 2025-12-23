# 🗄️ Database - FinCore

**Banco de Dados:** PostgreSQL (Supabase)  
**Versão:** 2.0 (Consolidado)  
**Data:** 23/12/2025

---

## 📁 Estrutura

```
database/
├── migrations/          # Migrations do banco novo (v2.0)
│   ├── 001_core_schema.sql
│   ├── 002_accounts_and_transactions.sql
│   ├── 003_categories.sql
│   ├── 004_payment_methods.sql
│   ├── 005_credit_cards.sql
│   ├── 006_payables.sql
│   ├── 007_investments.sql
│   ├── 008_audit_system.sql
│   ├── 009_idempotency_and_constraints.sql
│   └── 010_indexes_and_performance.sql
│
├── backups/            # Backups do banco antigo
│   ├── backup-enums.sql
│   ├── backup_tables.sql
│   ├── backup-triggers.sql
│   ├── backup-policies.sql
│   └── backup_functions.sql
│
├── docs/              # Documentação do banco
│   ├── APPLY_MIGRATIONS.sql
│   ├── GUIA_APLICACAO.md
│   ├── STATUS_BANCO.md
│   └── TESTE_VALIDACAO.sql
│
└── _archive/          # Migrations antigas (v1.0)
    └── old-migrations/  # 78 migrations antigas
```

---

## 📊 Estatísticas do Banco

| Item | Quantidade |
|------|------------|
| Tabelas | 16 |
| Views | 3 |
| ENUMs | 11 |
| Functions | 47 |
| Triggers | 20 |
| Policies (RLS) | 34 |

---

## 🚀 Como Aplicar Migrations

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto
3. Vá em: SQL Editor
4. Execute cada migration em ordem (001 a 010)

### Opção 2: Via psql

```bash
psql -h db.XXXXXXX.supabase.co -U postgres -d postgres -f migrations/001_core_schema.sql
# ... continuar para todas
```

---

## ✅ Status Atual

- ✅ Todas as 10 migrations aplicadas
- ✅ Banco validado e funcional
- ✅ Pronto para uso em produção

---

## 📝 Funcionalidades Implementadas

- ✅ Soft Delete em todas as tabelas
- ✅ Auditoria IMUTÁVEL (audit_log)
- ✅ Idempotência (idempotency_key)
- ✅ Locks pessimistas (previne race conditions)
- ✅ RLS completo (Row Level Security)
- ✅ Constraints de integridade
- ✅ Índices otimizados (~80 índices)
- ✅ Funções de negócio (rollover, parcelamento, etc)

---

## 🔗 Links Úteis

- [Guia de Aplicação](docs/GUIA_APLICACAO.md)
- [Status do Banco](docs/STATUS_BANCO.md)
- [Teste de Validação](docs/TESTE_VALIDACAO.sql)
- [Plano B Execução](../../docs/database/PLANO_B_EXECUCAO.md)

---

**Última atualização:** 23/12/2025
