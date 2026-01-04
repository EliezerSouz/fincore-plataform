# 🔧 Scripts de Correção - FinCore Backend

**Total**: 14 scripts  
**Propósito**: Correção de dados e sincronização  
**Status**: Arquivados (não usar em produção)

---

## ⚠️ ATENÇÃO CRÍTICA

Estes scripts **MODIFICAM DADOS** no banco de dados!

**NUNCA executar em produção sem**:
1. ✅ Backup completo
2. ✅ Teste em desenvolvimento
3. ✅ Revisão de código
4. ✅ Aprovação de responsável

---

## 📂 Categorias

### Fix (Correção)
Scripts que corrigem problemas de dados:
- `fix_account_id_nullable.go` - Corrige account_id nullable
- `fix_all_constraints.go` - Corrige todos os constraints
- `fix_invoice_balance.go` - Corrige saldo de faturas
- `fix_old_transfers.go` - Corrige transferências antigas
- `fix_pocket_balances.go` - Corrige saldos de pockets
- `fix_pocket_transfer_balances.go` - Corrige saldos de transferências
- `fix_transfer_category.go` - Corrige categoria de transferências

### Restore (Restauração)
Scripts que restauram estados anteriores:
- `restore_correct_balances.go` - Restaura saldos corretos
- `restore_from_accounts.go` - Restaura dados de accounts
- `restore_original_balances.go` - Restaura saldos originais
- `restore_payment_transaction.go` - Restaura transação de pagamento

### Sync (Sincronização)
Scripts que sincronizam dados:
- `sync_pocket_balances.go` - Sincroniza saldos de pockets

### Undo (Desfazer)
Scripts que desfazem operações:
- `undo_manual_fix.go` - Desfaz correção manual

### Reset (Resetar)
Scripts que resetam dados:
- `reset_user_data.go` - Reseta dados de usuário (⚠️ PERIGOSO!)

---

## 🚨 Níveis de Perigo

### 🟢 BAIXO (Apenas leitura + pequenas correções)
- `fix_transfer_category.go`
- `sync_pocket_balances.go`

### 🟡 MÉDIO (Modifica dados específicos)
- `fix_pocket_balances.go`
- `fix_invoice_balance.go`
- `restore_correct_balances.go`

### 🔴 ALTO (Modifica muitos dados)
- `fix_all_constraints.go`
- `restore_from_accounts.go`
- `reset_user_data.go` ⚠️ **EXTREMAMENTE PERIGOSO**

---

## 🚀 Como Usar (Com Segurança)

### 1. SEMPRE fazer backup
```bash
# Backup do banco ANTES de qualquer coisa
pg_dump -h HOST -U USER -d fincore > backup_antes_fix_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Revisar o código
```bash
# Entenda EXATAMENTE o que o script faz
cat backend/scripts/fixes/fix_pocket_balances.go
```

### 3. Testar em desenvolvimento
```bash
# NUNCA testar em produção primeiro!
# Use banco de desenvolvimento
go run fix_pocket_balances.go
```

### 4. Validar resultados
```bash
# Verifique se a correção funcionou
# Compare antes e depois
```

### 5. Documentar
```markdown
# Sempre documente:
- O que foi corrigido
- Por que foi necessário
- Resultados obtidos
- Possíveis efeitos colaterais
```

---

## 📊 Histórico de Uso

Estes scripts foram criados para resolver problemas específicos durante o desenvolvimento:

- **Migração accounts → pockets**: Vários scripts de fix e restore
- **Correção de saldos**: Sincronização após mudanças de estrutura
- **Ajustes de constraints**: Correção de FKs e validações

---

## 🔒 Segurança

- ❌ **NUNCA** executar em produção sem backup
- ❌ **NUNCA** executar sem revisar código
- ❌ **NUNCA** executar sem testar antes
- ✅ **SEMPRE** documentar execução
- ✅ **SEMPRE** validar resultados

---

## 💡 Alternativas Melhores

Ao invés de usar estes scripts, considere:

1. **Migrations**: Criar migration SQL adequada
2. **API Endpoints**: Criar endpoint de correção
3. **SQL Direto**: Executar SQL com transação
4. **Ferramentas de Admin**: Usar ferramentas de administração

---

*Organizado em: 04/01/2026*  
*Mantido para referência histórica*  
*⚠️ Use com extrema cautela!*
