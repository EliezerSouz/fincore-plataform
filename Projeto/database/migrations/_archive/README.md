# 📦 Migrations Arquivadas - FinCore

**Data de arquivamento**: 04/01/2026  
**Total de arquivos**: 119 migrations  
**Status**: Consolidadas em `../consolidated/001_initial_schema.sql`

---

## ⚠️ IMPORTANTE

Estes arquivos foram **ARQUIVADOS** e **NÃO devem ser executados**.

Eles foram consolidados em um único arquivo:
```
../consolidated/001_initial_schema.sql
```

---

## 📋 Por que foram arquivadas?

### Problemas Identificados

1. **120 migrations desorganizadas**
   - Nomes duplicados (mesmo timestamp)
   - Ordem de execução confusa
   - Impossível garantir fresh install

2. **Migrations conflitantes**
   - Mesmas tabelas criadas múltiplas vezes
   - Lógica duplicada
   - Difícil rastrear estado final

3. **Manutenção impossível**
   - Novos desenvolvedores não conseguiam subir banco
   - Deploy arriscado
   - Rollback impossível

### Solução

Todas as 119 migrations foram:
- ✅ Analisadas
- ✅ Consolidadas em 1 arquivo
- ✅ Testadas em banco limpo
- ✅ Documentadas

---

## 🔍 Conteúdo Arquivado

Este diretório contém migrations de diferentes origens:

### Migrations Base (Supabase)
- `001_create_users_table.sql`
- `002_fix_permissions.sql`
- `003_create_accounts_table.sql`
- etc.

### Migrations Web (Features)
- `20251216011845_*.sql`
- `20251216011846_*.sql`
- etc.

### Migrations Backend (Subscriptions)
- `20251216010750_*.sql`
- etc.

---

## 📚 Histórico Preservado

Estes arquivos foram mantidos para:

1. **Referência histórica**
   - Ver como o banco evoluiu
   - Entender decisões passadas

2. **Auditoria**
   - Rastrear mudanças
   - Compliance

3. **Recuperação de emergência**
   - Se necessário, consultar lógica antiga
   - Comparar com estado atual

---

## ⚠️ NÃO EXECUTAR

**NUNCA execute estes arquivos diretamente!**

Se você precisa:

### Fresh Install
```bash
# Use a migration consolidada
psql -d fincore -f ../consolidated/001_initial_schema.sql
```

### Consultar lógica antiga
```bash
# Apenas leia os arquivos
cat nome_da_migration.sql
```

### Comparar com estado atual
```bash
# Use ferramentas de diff
diff migration_antiga.sql ../consolidated/001_initial_schema.sql
```

---

## 📊 Estatísticas

- **Total de arquivos**: 119
- **Linhas de código**: ~15.000
- **Período**: Dezembro 2025 - Janeiro 2026
- **Consolidado em**: 1 arquivo de ~1.200 linhas

---

## 🔄 Migração Realizada

```
ANTES:
database/migrations/
├── 001_create_users_table.sql
├── 002_fix_permissions.sql
├── 003_create_accounts_table.sql
├── ... (116 arquivos)
└── 20251221233000_fix_create_default_payment_methods_slug.sql

DEPOIS:
database/migrations/
├── _archive/                    # ← Você está aqui
│   └── [119 arquivos]
├── consolidated/
│   └── 001_initial_schema.sql  # ← Use este!
└── README.md
```

---

## ✅ Validação

A consolidação foi validada:

- ✅ Fresh install testado
- ✅ Todas as tabelas criadas
- ✅ Functions e triggers funcionando
- ✅ RLS policies ativas
- ✅ Indexes criados
- ✅ Sem erros

---

**Arquivado com segurança em 04/01/2026** 🎉

*Estes arquivos são apenas para referência histórica.*  
*Use `../consolidated/001_initial_schema.sql` para fresh install.*
