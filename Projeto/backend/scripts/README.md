# 📁 Scripts de Desenvolvimento - FinCore Backend

**Organizado em**: 04/01/2026  
**Total**: 50 scripts  
**Status**: Arquivados para referência

---

## 📊 Resumo

| Categoria | Quantidade | Propósito |
|-----------|------------|-----------|
| **Debug** | 29 scripts | Diagnóstico e inspeção |
| **Fixes** | 14 scripts | Correção de dados |
| **Migrations** | 7 scripts | Migrações manuais |
| **TOTAL** | **50 scripts** | Desenvolvimento |

---

## 📂 Estrutura

```
scripts/
├── debug/              # Scripts de diagnóstico
│   ├── check_*.go     # Verificações
│   ├── diagnose_*.go  # Diagnósticos
│   ├── inspect_*.go   # Inspeções
│   ├── audit_*.go     # Auditorias
│   ├── list_*.go      # Listagens
│   └── README.md
├── fixes/              # Scripts de correção
│   ├── fix_*.go       # Correções
│   ├── restore_*.go   # Restaurações
│   ├── sync_*.go      # Sincronizações
│   ├── undo_*.go      # Desfazer
│   ├── reset_*.go     # Resetar
│   └── README.md
└── migrations/         # Migrações manuais
    ├── migrate_*.go   # Migrações
    └── README.md
```

---

## ⚠️ IMPORTANTE

### Estes scripts NÃO são para produção!

Eles foram criados durante o desenvolvimento para:
- Diagnosticar problemas específicos
- Corrigir dados durante migrações
- Validar estruturas do banco
- Migrar de `accounts` para `pockets`

### Status Atual

✅ **Migração completa**: Sistema usa 100% pockets  
✅ **Banco limpo**: Schema consolidado  
✅ **Scripts arquivados**: Mantidos para referência

---

## 🚀 Como Usar

### 1. Leia o README específico

Cada diretório tem seu próprio README com instruções detalhadas:
- `debug/README.md` - Scripts de diagnóstico
- `fixes/README.md` - Scripts de correção
- `migrations/README.md` - Scripts de migração

### 2. SEMPRE revise o código

```bash
# Nunca execute sem ler!
cat scripts/debug/check_pockets_structure.go
```

### 3. NUNCA execute em produção

```bash
# Apenas em desenvolvimento
# Sempre com backup
```

---

## 🔒 Regras de Segurança

### ❌ NUNCA:
- Executar em produção sem backup
- Executar sem revisar código
- Executar sem testar antes
- Modificar dados sem validar

### ✅ SEMPRE:
- Fazer backup antes
- Testar em desenvolvimento
- Documentar execução
- Validar resultados

---

## 📚 Histórico

### Por que estes scripts existem?

Durante o desenvolvimento do FinCore, houve uma **grande migração**:

**ANTES** (Sistema antigo):
```
accounts (tabela única)
  └─ transactions
```

**DEPOIS** (Sistema atual):
```
parent_accounts (instituições)
  └─ pockets (subcontas)
       └─ transactions
```

Estes scripts foram criados para:
1. Adicionar estrutura de pockets
2. Migrar dados de accounts para pockets
3. Corrigir saldos e inconsistências
4. Validar migração
5. Remover accounts

### Status da Migração

✅ **COMPLETA** (Dezembro 2025 - Janeiro 2026)

---

## 💡 Lições Aprendidas

### O que funcionou:
- ✅ Scripts pequenos e focados
- ✅ Migração gradual
- ✅ Validação em cada etapa
- ✅ Manter código antigo temporariamente

### O que poderia ser melhor:
- ⚠️ Usar SQL migrations ao invés de Go
- ⚠️ Melhor documentação durante execução
- ⚠️ Mais testes automatizados

---

## 🔄 Futuras Migrações

Para futuras mudanças, use:

### 1. SQL Migrations (Recomendado)
```sql
-- database/migrations/002_add_feature.sql
ALTER TABLE pockets ADD COLUMN new_field text;
```

### 2. Transações
```sql
BEGIN;
-- suas alterações
COMMIT; -- ou ROLLBACK
```

### 3. Validações
```sql
-- Sempre validar
SELECT COUNT(*) FROM pockets WHERE new_field IS NULL;
```

---

## 📞 Suporte

Se precisar executar algum script:

1. Leia o README específico
2. Revise o código
3. Teste em desenvolvimento
4. Documente execução
5. Valide resultados

---

## 🗂️ Organização

Estes scripts foram movidos do diretório raiz do backend para manter o projeto organizado:

**ANTES**:
```
backend/
├── check_*.go         # ❌ Poluído
├── fix_*.go           # ❌ Desorganizado
├── migrate_*.go       # ❌ Confuso
└── cmd/api/main.go
```

**DEPOIS**:
```
backend/
├── scripts/           # ✅ Organizado
│   ├── debug/
│   ├── fixes/
│   └── migrations/
└── cmd/api/main.go    # ✅ Limpo
```

---

## ✅ Checklist de Uso

Antes de executar qualquer script:

- [ ] Li o README específico
- [ ] Revisei o código do script
- [ ] Fiz backup do banco
- [ ] Testei em desenvolvimento
- [ ] Entendi o que o script faz
- [ ] Documentei a execução
- [ ] Validei os resultados

---

*Organizado em: 04/01/2026*  
*Mantido para referência histórica e aprendizado*  
*⚠️ Use com responsabilidade!*
