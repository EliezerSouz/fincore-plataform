# 🔄 Scripts de Migração Manual - FinCore Backend

**Total**: 7 scripts  
**Propósito**: Migrações manuais de dados  
**Status**: Arquivados (já executados)

---

## ⚠️ ATENÇÃO

Estes scripts foram usados para migrações manuais de dados durante o desenvolvimento.

**A maioria já foi executada e não deve ser executada novamente!**

---

## 📂 Scripts

### Migração de Estrutura
- `migrate_account_id_nullable.go` - Torna account_id nullable
- `migrate_add_pocket_id.go` - Adiciona pocket_id às tabelas
- `migrate_add_pocket_id_transactions.go` - Adiciona pocket_id em transactions

### Migração de Dados
- `migrate_transactions.go` - Migra transações para nova estrutura
- `migrate_transferencias.go` - Migra transferências
- `migrate_orphans.go` - Migra dados órfãos
- `migrate_inline.go` - Migração inline

---

## 🎯 Contexto Histórico

Estes scripts foram criados durante a **grande migração**:
- **De**: Sistema com `accounts`
- **Para**: Sistema com `parent_accounts` + `pockets`

### Linha do Tempo

1. **Fase 1**: Adicionar pocket_id às tabelas
   - `migrate_add_pocket_id.go`
   - `migrate_add_pocket_id_transactions.go`

2. **Fase 2**: Tornar account_id opcional
   - `migrate_account_id_nullable.go`

3. **Fase 3**: Migrar dados
   - `migrate_transactions.go`
   - `migrate_transferencias.go`
   - `migrate_orphans.go`

4. **Fase 4**: Limpeza
   - `migrate_inline.go`

---

## 🚨 Status de Execução

| Script | Status | Data | Notas |
|--------|--------|------|-------|
| `migrate_add_pocket_id.go` | ✅ Executado | Dez 2025 | Sucesso |
| `migrate_add_pocket_id_transactions.go` | ✅ Executado | Dez 2025 | Sucesso |
| `migrate_account_id_nullable.go` | ✅ Executado | Dez 2025 | Sucesso |
| `migrate_transactions.go` | ✅ Executado | Dez 2025 | Sucesso |
| `migrate_transferencias.go` | ✅ Executado | Dez 2025 | Sucesso |
| `migrate_orphans.go` | ✅ Executado | Dez 2025 | Sucesso |
| `migrate_inline.go` | ✅ Executado | Dez 2025 | Sucesso |

---

## 🚀 Como Usar (Se Necessário)

### ⚠️ ANTES DE EXECUTAR

1. **Verificar se já foi executado**
   ```bash
   # Verificar estrutura do banco
   psql -d fincore -c "\d transactions"
   # Se pocket_id já existe, NÃO executar novamente!
   ```

2. **Backup completo**
   ```bash
   pg_dump -h HOST -U USER -d fincore > backup_antes_migrate.sql
   ```

3. **Testar em desenvolvimento**
   ```bash
   # NUNCA em produção primeiro!
   ```

### Execução

```bash
cd backend/scripts/migrations
go run migrate_add_pocket_id.go
```

### Validação

```bash
# Verificar se migração funcionou
psql -d fincore -c "SELECT COUNT(*) FROM transactions WHERE pocket_id IS NOT NULL;"
```

---

## 💡 Lições Aprendidas

### O que funcionou bem:
- ✅ Migração gradual (não big bang)
- ✅ Manter account_id temporariamente
- ✅ Validar cada etapa

### O que poderia ser melhor:
- ⚠️ Usar migrations SQL ao invés de scripts Go
- ⚠️ Melhor documentação durante execução
- ⚠️ Mais testes antes de executar

---

## 🔄 Migração Atual

**Status**: ✅ COMPLETA

O sistema agora usa **100% pockets**:
- ✅ `parent_accounts` + `pockets` implementado
- ✅ Todas as transações migradas
- ✅ `accounts` removido do schema
- ✅ Sistema estável

---

## 📝 Para Futuras Migrações

Ao invés de scripts Go, use:

1. **SQL Migrations**
   ```sql
   -- database/migrations/002_add_new_feature.sql
   ALTER TABLE transactions ADD COLUMN new_field text;
   ```

2. **Transações**
   ```sql
   BEGIN;
   -- suas alterações
   COMMIT; -- ou ROLLBACK se algo der errado
   ```

3. **Validações**
   ```sql
   -- Sempre validar antes de commit
   SELECT COUNT(*) FROM transactions WHERE new_field IS NULL;
   ```

---

*Organizado em: 04/01/2026*  
*Migração completa: Dezembro 2025*  
*Mantido para referência histórica*
