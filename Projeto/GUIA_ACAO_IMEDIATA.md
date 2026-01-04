# 🚀 GUIA DE AÇÃO IMEDIATA - FINCORE

**Data**: 04/01/2026  
**Objetivo**: Iniciar correções técnicas HOJE  
**Tempo total**: 14-22 horas (distribuídas em 2 semanas)

---

## 📋 RESUMO EXECUTIVO

Seu projeto FinCore é **EXCELENTE**, mas tem débito técnico que precisa ser resolvido antes de:
- ✅ Deploy em produção
- ✅ Testes finais web
- ✅ Início do desenvolvimento mobile

**Prioridade**: Consolidar migrations, limpar código, resolver TODOs críticos

---

## 🎯 PLANO DE 3 DIAS

### DIA 1: Consolidar Migrations (8-12h) 🔴 CRÍTICO

#### Problema
- 120 migrations desorganizadas
- Nomes duplicados
- Impossível fresh install

#### Solução
Criar 1 migration consolidada com estado atual do banco.

#### Passo a Passo

**1. Exportar schema atual** (5 min)
```bash
cd f:\Antigravity\FinCore\Projeto\database

# Conectar ao seu banco e exportar estrutura
pg_dump --schema-only -h SEU_HOST -U SEU_USUARIO -d fincore > schema_atual.sql

# Se estiver usando Supabase, use as credenciais do Supabase
# Exemplo:
# pg_dump --schema-only -h db.xxx.supabase.co -U postgres -d postgres > schema_atual.sql
```

**2. Criar estrutura de diretórios** (2 min)
```bash
# Criar diretórios
mkdir -p migrations\_archive
mkdir -p migrations\consolidated

# Arquivar migrations antigas
move migrations\*.sql migrations\_archive\
```

**3. Criar migration consolidada** (6-10h)
```bash
# Copiar schema atual para nova migration
copy schema_atual.sql migrations\consolidated\001_initial_schema.sql

# Editar o arquivo e adicionar cabeçalho
notepad migrations\consolidated\001_initial_schema.sql
```

Adicionar no início do arquivo:
```sql
-- ============================================
-- FINCORE - INITIAL SCHEMA (CONSOLIDATED)
-- ============================================
-- Data: 04/01/2026
-- Versão: 1.0
-- Descrição: Schema consolidado com todas as tabelas e estruturas
-- 
-- IMPORTANTE: Este arquivo substitui as 120 migrations anteriores
-- Para fresh install, execute APENAS este arquivo
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ... resto do schema
```

**4. Testar em banco limpo** (1-2h)
```bash
# Criar banco de teste
createdb fincore_test

# Executar migration consolidada
psql -d fincore_test -f migrations\consolidated\001_initial_schema.sql

# Validar
psql -d fincore_test -c "\dt"
psql -d fincore_test -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# Deve listar todas as tabelas (cerca de 20-25 tabelas)
```

**5. Documentar** (30 min)
```bash
# Criar README de migrations
notepad migrations\README.md
```

Conteúdo:
```markdown
# Migrations - FinCore

## Fresh Install

Para criar banco do zero:

```bash
psql -d seu_banco -f consolidated/001_initial_schema.sql
```

## Migrations Antigas

As 120 migrations antigas foram arquivadas em `_archive/`.
Elas foram consolidadas em `001_initial_schema.sql`.

## Próximas Migrations

Novas migrations devem seguir o padrão:
- `002_add_feature_x.sql`
- `003_fix_issue_y.sql`
- etc.

Sempre testar em banco limpo antes de commit!
```

**6. Commit** (5 min)
```bash
git add database/migrations/
git commit -m "chore: consolidate 120 migrations into single initial schema"
git push
```

#### ✅ Resultado Esperado
- ✅ 1 arquivo de migration consolidado
- ✅ Fresh install funciona
- ✅ Todas as tabelas criadas corretamente
- ✅ Documentação clara

---

### DIA 2: Limpar Código (2-4h) 🔴 CRÍTICO

#### Problema
- 80+ arquivos de debug no diretório raiz
- Código comentado em produção
- Dificulta manutenção

#### Solução
Organizar scripts e remover código morto.

#### Passo a Passo

**1. Criar estrutura de scripts** (2 min)
```bash
cd f:\Antigravity\FinCore\Projeto\backend

mkdir -p scripts\debug
mkdir -p scripts\fixes
mkdir -p scripts\migrations
```

**2. Mover arquivos de debug** (10 min)
```bash
# Mover arquivos check_*
move check_*.go scripts\debug\

# Mover arquivos diagnose_*
move diagnose_*.go scripts\debug\

# Mover arquivos fix_*
move fix_*.go scripts\fixes\

# Mover arquivos migrate_*
move migrate_*.go scripts\migrations\

# Mover outros scripts
move restore_*.go scripts\fixes\
move sync_*.go scripts\fixes\
move inspect_*.go scripts\debug\
move list_*.go scripts\debug\
```

**3. Criar README nos scripts** (15 min)
```bash
notepad scripts\README.md
```

Conteúdo:
```markdown
# Scripts de Desenvolvimento - FinCore

## Estrutura

- `debug/` - Scripts de diagnóstico e inspeção
- `fixes/` - Scripts de correção de dados
- `migrations/` - Scripts de migração manual

## ⚠️ ATENÇÃO

Estes scripts foram usados durante desenvolvimento.
**NÃO executar em produção sem revisar!**

## Como Usar

1. Revisar código do script
2. Testar em banco de desenvolvimento
3. Validar resultados
4. Documentar execução

## Scripts Principais

### Debug
- `check_*.go` - Verificação de estruturas
- `diagnose_*.go` - Diagnóstico de problemas
- `inspect_*.go` - Inspeção de dados

### Fixes
- `fix_*.go` - Correção de dados
- `restore_*.go` - Restauração de estados
- `sync_*.go` - Sincronização de dados

### Migrations
- `migrate_*.go` - Migrações manuais de dados
```

**4. Limpar código comentado** (1-2h)

Abrir `backend\cmd\api\main.go` e revisar:

```go
// ANTES (linhas 60, 74, 85-86)
// invoiceRepo := repository.NewInvoiceRepository(dbPool) // TEMPORARIAMENTE COMENTADO
// invoiceService := usecase.NewInvoiceService(invoiceRepo, transactionRepo) // TEMPORARIAMENTE COMENTADO
// invoiceHandler := handler.NewInvoiceHandler(invoiceService) // TEMPORARIAMENTE COMENTADO
// invoiceHandlerV2 := handler.NewInvoiceHandlerV2(invoiceService) // TEMPORARIAMENTE COMENTADO

// DECISÃO:
// Opção A: Se funcional, ativar
invoiceRepo := repository.NewInvoiceRepository(dbPool)
invoiceService := usecase.NewInvoiceService(invoiceRepo, transactionRepo)
invoiceHandler := handler.NewInvoiceHandler(invoiceService)

// Opção B: Se não usado, remover completamente
// (apagar linhas)
```

**5. Revisar TODOs** (30 min)
```bash
# Listar todos os TODOs
findstr /S /I "TODO" *.go > todos.txt
notepad todos.txt

# Categorizar:
# - Críticos (resolver hoje)
# - Importantes (resolver esta semana)
# - Melhorias (backlog)
```

**6. Commit** (5 min)
```bash
git add .
git commit -m "chore: organize debug scripts and clean commented code"
git push
```

#### ✅ Resultado Esperado
- ✅ Diretório raiz limpo
- ✅ Scripts organizados em `backend/scripts/`
- ✅ Código comentado removido ou ativado
- ✅ TODOs categorizados

---

### DIA 3: Resolver TODOs Críticos (4-6h) 🔴 CRÍTICO

#### Problema
- TODOs críticos de segurança
- Funcionalidades incompletas
- Sem tracking

#### Solução
Resolver TODOs críticos e criar issues para os demais.

#### Passo a Passo

**1. Identificar TODOs críticos** (30 min)
```bash
cd f:\Antigravity\FinCore\Projeto\backend

# Buscar TODOs críticos
findstr /S /I "TODO.*PRODUÇÃO" *.go
findstr /S /I "TODO.*SECURITY" *.go
findstr /S /I "TODO.*CRITICAL" *.go
```

**2. Resolver TODO #1: auth_bypass** (1h) 🔴 CRÍTICO

**Arquivo**: `internal\infra\handler\middleware\auth_bypass.go`

```go
// ANTES
// TODO: REMOVER ANTES DE PRODUÇÃO!
func AuthBypass() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Set("user_id", "f47ac10b-58cc-4372-a567-0e02b2c3d479")
        c.Next()
    }
}
```

**Ação**: 
```bash
# 1. Verificar se está sendo usado
findstr /S "AuthBypass" cmd\api\main.go

# 2. Se estiver comentado, deletar arquivo
del internal\infra\handler\middleware\auth_bypass.go

# 3. Garantir que AuthMiddleware está ativo
# Editar cmd\api\main.go linha 124
notepad cmd\api\main.go
```

Verificar que está assim:
```go
// ✅ CORRETO
api.Use(middleware.AuthMiddleware())

// ❌ ERRADO (se estiver assim, corrigir)
// api.Use(middleware.AuthBypass())
```

**3. Resolver TODO #2: promo_codes** (2-3h)

**Arquivo**: `internal\usecase\user_service.go` linha 77

```go
// ANTES
// TODO: Replace with DB lookup
validCodes := map[string]PromoCodeInfo{
    "PREMIUM14": {Plan: "premium", Days: 14},
    "IA7":       {Plan: "premium_ia", Days: 7},
}
```

**Ação**:

Editar `internal\infra\repository\user_repository.go`:
```go
// Adicionar método
func (r *UserRepository) GetPromoCode(ctx context.Context, code string) (*PromoCode, error) {
    var promo PromoCode
    query := `
        SELECT code, plan_type, duration_days, active
        FROM promo_codes
        WHERE code = $1 AND active = true
    `
    err := r.db.QueryRow(ctx, query, code).Scan(
        &promo.Code,
        &promo.PlanType,
        &promo.DurationDays,
        &promo.Active,
    )
    if err != nil {
        return nil, fmt.Errorf("promo code not found: %w", err)
    }
    return &promo, nil
}
```

Editar `internal\usecase\user_service.go`:
```go
// DEPOIS
promoCode, err := s.repo.GetPromoCode(ctx, code)
if err != nil {
    return fmt.Errorf("código promocional inválido")
}

if !promoCode.Active {
    return fmt.Errorf("código promocional expirado")
}

// Usar promoCode.PlanType e promoCode.DurationDays
```

**4. Resolver TODO #3: card ownership** (30 min)

**Arquivo**: `internal\usecase\user_service.go` linha 127

```go
// ANTES
// TODO: Verify if card belongs to user?
func (s *UserService) SetPrimaryCard(ctx context.Context, userID, cardID string) error {
    // ...
}
```

**Ação**:
```go
// DEPOIS
func (s *UserService) SetPrimaryCard(ctx context.Context, userID, cardID string) error {
    // Verificar se cartão pertence ao usuário
    var ownerID string
    err := s.repo.GetCardOwner(ctx, cardID, &ownerID)
    if err != nil {
        return fmt.Errorf("cartão não encontrado")
    }
    
    if ownerID != userID {
        return fmt.Errorf("cartão não pertence ao usuário")
    }
    
    // Continuar com lógica original
    return s.repo.UpdatePrimaryCard(ctx, userID, cardID)
}
```

**5. Resolver TODO #4: feriados** (1h)

**Arquivo**: `internal\infra\scheduler\yield_scheduler.go` linha 145

```go
// ANTES
// TODO: Check against Brazilian holidays calendar
if time.Now().Weekday() == time.Saturday || time.Now().Weekday() == time.Sunday {
    return false
}
```

**Ação**:
```go
// DEPOIS
var brazilianHolidays = map[string]bool{
    "01-01": true, // Ano Novo
    "04-21": true, // Tiradentes
    "05-01": true, // Dia do Trabalho
    "09-07": true, // Independência
    "10-12": true, // Nossa Senhora Aparecida
    "11-02": true, // Finados
    "11-15": true, // Proclamação da República
    "12-25": true, // Natal
    // Feriados móveis devem ser calculados (Carnaval, Páscoa, Corpus Christi)
}

func (s *YieldScheduler) isBusinessDay(date time.Time) bool {
    // Fim de semana
    if date.Weekday() == time.Saturday || date.Weekday() == time.Sunday {
        return false
    }
    
    // Feriado fixo
    dateKey := date.Format("01-02")
    if brazilianHolidays[dateKey] {
        return false
    }
    
    // TODO: Adicionar feriados móveis (Carnaval, Páscoa, Corpus Christi)
    
    return true
}
```

**6. Criar issues para TODOs restantes** (30 min)

Criar arquivo `BACKLOG_TODOS.md`:
```markdown
# Backlog de TODOs - FinCore

## 🟡 Importantes (Próxima Sprint)

### Backend
- [ ] Adicionar feriados móveis (Carnaval, Páscoa, Corpus Christi)
- [ ] Implementar rate limiting
- [ ] Adicionar logs estruturados

### Frontend
- [ ] Migrar payment-methods/actions.ts para API
- [ ] Implementar análise de padrões de gastos (IA)
- [ ] Adicionar validação de formulários com Zod

## 🟢 Melhorias (Backlog)

- [ ] Adicionar testes unitários
- [ ] Implementar cache Redis
- [ ] Otimizar queries N+1
- [ ] Adicionar monitoramento (Sentry)
```

**7. Commit** (5 min)
```bash
git add .
git commit -m "fix: resolve critical TODOs (security and business logic)"
git push
```

#### ✅ Resultado Esperado
- ✅ auth_bypass removido
- ✅ Promo codes usando banco de dados
- ✅ Validação de ownership implementada
- ✅ Feriados brasileiros adicionados
- ✅ TODOs restantes documentados no backlog

---

## 📊 CHECKLIST DE PROGRESSO

### Dia 1: Migrations ✅
- [ ] Schema atual exportado
- [ ] Diretórios criados (_archive, consolidated)
- [ ] Migration consolidada criada
- [ ] Testado em banco limpo
- [ ] README criado
- [ ] Commit realizado

### Dia 2: Código Limpo ✅
- [ ] Diretórios de scripts criados
- [ ] Arquivos de debug movidos
- [ ] README de scripts criado
- [ ] Código comentado revisado
- [ ] TODOs listados
- [ ] Commit realizado

### Dia 3: TODOs Críticos ✅
- [ ] auth_bypass removido
- [ ] Promo codes migrados para DB
- [ ] Card ownership validado
- [ ] Feriados brasileiros adicionados
- [ ] Backlog de TODOs criado
- [ ] Commit realizado

---

## 🎯 PRÓXIMOS PASSOS (Semana 2)

Após completar os 3 dias acima, seguir para:

### Semana 2: Testes e Validação (18-24h)

**Dia 4-6**: Implementar testes automatizados (12-16h)
- Configurar framework de testes (testify)
- Criar testes unitários para repositories
- Criar testes de integração para handlers
- Configurar CI/CD (GitHub Actions)

**Dia 7-8**: Validar sistema de faturas (6-8h)
- Executar testes E2E de faturas
- Validar todas as regras de negócio
- Corrigir bugs encontrados
- Documentar casos de uso

---

## 💡 DICAS IMPORTANTES

### Durante a Execução

1. **Faça backup antes de tudo**
   ```bash
   pg_dump -h SEU_HOST -U SEU_USUARIO -d fincore > backup_antes_correcoes.sql
   ```

2. **Teste em ambiente de desenvolvimento**
   - Nunca execute direto em produção
   - Use banco de teste para validar

3. **Commit frequentemente**
   - Após cada tarefa concluída
   - Mensagens claras e descritivas

4. **Documente decisões**
   - Por que escolheu esta abordagem?
   - Que alternativas considerou?

### Se Encontrar Problemas

1. **Migrations não funcionam**
   - Verificar ordem de criação de tabelas
   - Verificar dependências de FKs
   - Revisar schema_atual.sql

2. **Código não compila após limpeza**
   - Verificar imports
   - Verificar se removeu algo necessário
   - Reverter commit e revisar

3. **TODOs muito complexos**
   - Criar issue no GitHub
   - Marcar como "help wanted"
   - Pedir code review

---

## 📞 SUPORTE

Se precisar de ajuda:

1. **Revisar documentação completa**
   - `AUDITORIA_TECNICA_COMPLETA_2026.md`

2. **Consultar logs**
   ```bash
   # Backend
   go run cmd/api/main.go
   
   # Banco de dados
   psql -d fincore -c "SELECT version();"
   ```

3. **Pedir ajuda**
   - Code review com colega
   - Consultar documentação oficial
   - Buscar em fóruns (Stack Overflow, Reddit)

---

## ✅ RESULTADO FINAL

Após completar este guia (3 dias + 2 semanas):

- ✅ Migrations consolidadas e organizadas
- ✅ Código limpo e sem débito técnico
- ✅ TODOs críticos resolvidos
- ✅ Testes automatizados implementados
- ✅ Sistema de faturas validado
- ✅ Pronto para deploy em produção
- ✅ Pronto para iniciar mobile

**Investimento**: 30-40 horas  
**Retorno**: Projeto profissional, escalável e manutenível

---

**Comece AGORA!** 🚀

**Primeiro comando**:
```bash
cd f:\Antigravity\FinCore\Projeto\database
pg_dump --schema-only -h SEU_HOST -U SEU_USUARIO -d fincore > schema_atual.sql
```

**Boa sorte!** 💪

---

*Guia criado por: Antigravity AI*  
*Data: 04/01/2026*  
*Versão: 1.0*
