# 🏗️ PLANO DE REFATORAÇÃO PROFISSIONAL - FINCORE
**Arquiteto**: Sistema de Refatoração Segura  
**Data**: 17/12/2025  
**Status**: 🔴 AGUARDANDO APROVAÇÃO

---

## 📊 ANÁLISE EXECUTIVA

### Situação Atual
- **89 migrations** distribuídas em 3 locais diferentes
- **Padrões inconsistentes**: numeração simples (001-016) vs timestamps (20251214...)
- **Estrutura funcional** mas desorganizada
- **Duplicações** em utils, types e helpers
- **Projeto multiplataforma** (Web + Mobile + Backend)

### Risco Atual
🟡 **MÉDIO** - Projeto funcional mas com risco de conflitos em produção devido a migrations desorganizadas

---

## 🎯 OBJETIVOS DA REFATORAÇÃO

### 1. CRÍTICO (Fazer PRIMEIRO)
- ✅ Consolidar todas as migrations em local único
- ✅ Padronizar nomenclatura cronológica
- ✅ Garantir ordem de execução correta

### 2. ALTA PRIORIDADE
- 🔄 Reorganizar estrutura de pastas
- 🧹 Remover código duplicado
- 📁 Centralizar types e interfaces
- 🔗 Padronizar sistema de imports

### 3. MÉDIA PRIORIDADE
- 📦 Separar lógica de negócio de UI
- 🎨 Organizar componentes por domínio
- 🪝 Agrupar hooks por funcionalidade
- ⚙️ Centralizar configurações

### 4. BAIXA PRIORIDADE
- 📚 Documentação completa
- 🧪 Testes automatizados
- 🚀 CI/CD pipeline

---

## 📋 FASE 1: CONSOLIDAÇÃO DE MIGRATIONS (CRÍTICO)

### Situação Atual

#### 📁 Local 1: `supabase/migrations_backup/`
- **16 migrations**
- Padrão: `001_nome.sql` a `016_nome.sql`
- Mais antigas (estrutura base)

#### 📁 Local 2: `backend/migrations/`
- **14 migrations**
- Padrão: `20251214HHMMSS_nome.sql`
- Migrations de backend (subscriptions, billing)

#### 📁 Local 3: `apps/web/supabase/migrations/`
- **59 migrations**
- Padrão: `001_nome.sql` a `059_nome.sql`
- Migrations mais recentes (invoices, payables, transfers)

### Problema Identificado
❌ **Conflito de numeração**: Existem `001_create_users_table.sql` em 2 locais diferentes  
❌ **Ordem cronológica perdida**: Impossível saber qual executar primeiro  
❌ **Risco em produção**: Migrations podem executar fora de ordem

### Solução Proposta

#### Novo Local Único
```
database/
└── migrations/
    ├── 20251201120000_create_users_table.sql
    ├── 20251201120100_fix_permissions.sql
    ├── 20251201120200_create_accounts_table.sql
    ├── ...
    └── 20251217125555_add_balance_adjustments.sql
```

#### Padrão de Nomenclatura
```
YYYYMMDDHHMMSS_descricao_acao.sql

Onde:
- YYYY: Ano (2025)
- MM: Mês (01-12)
- DD: Dia (01-31)
- HH: Hora (00-23)
- MM: Minuto (00-59)
- SS: Segundo (00-59)
- descricao_acao: snake_case, descritivo
```

#### Processo de Consolidação

1. **Análise Cronológica**
   - Ler `CreationTime` de cada arquivo
   - Ordenar por data/hora real
   - Identificar dependências (FK, triggers, etc.)

2. **Renomeação Segura**
   - Manter conteúdo SQL intacto
   - Apenas renomear arquivo
   - Preservar histórico

3. **Validação**
   - Verificar ordem de dependências
   - Garantir que FKs referenciam tabelas já criadas
   - Testar em ambiente de desenvolvimento

4. **Migração**
   - Mover para `database/migrations/`
   - Remover pastas antigas
   - Atualizar documentação

### Mapeamento Inicial (Exemplo)

| Arquivo Original | Data Criação | Novo Nome |
|-----------------|--------------|-----------|
| supabase/migrations_backup/001_create_users_table.sql | 01/12/2025 12:00 | 20251201120000_create_users_table.sql |
| supabase/migrations_backup/002_fix_permissions.sql | 01/12/2025 12:05 | 20251201120500_fix_permissions.sql |
| apps/web/supabase/migrations/043_create_payables_table.sql | 14/12/2025 18:30 | 20251214183000_create_payables_table.sql |
| backend/migrations/20251214204500_create_promo_codes.sql | 14/12/2025 20:45 | 20251214204500_create_promo_codes.sql |

---

## 📋 FASE 2: REORGANIZAÇÃO DE ESTRUTURA

### Estrutura Atual (apps/web)
```
apps/web/
├── app/              (54 arquivos - rotas + lógica misturada)
├── components/       (77 componentes - sem organização por domínio)
├── hooks/            (9 hooks - genéricos)
├── lib/              (8 arquivos - utils misturados)
├── services/         (2 serviços - incompleto)
├── utils/            (4 arquivos - duplicação com lib/)
└── src/              (15 arquivos - propósito unclear)
```

### Estrutura Proposta (Clean Architecture)
```
apps/web/
├── app/                          # Next.js App Router (apenas rotas)
│   ├── (auth)/                   # Grupo: Autenticação
│   ├── (protected)/              # Grupo: Área protegida
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── accounts/
│   │   ├── cards/
│   │   └── reports/
│   └── api/                      # API Routes
│
├── features/                     # Módulos de negócio (NOVO)
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── transactions/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── accounts/
│   ├── cards/
│   ├── invoices/
│   ├── payables/
│   └── reports/
│
├── shared/                       # Código compartilhado (NOVO)
│   ├── components/               # Componentes genéricos (Button, Input, etc.)
│   │   ├── ui/                   # shadcn/ui
│   │   ├── layout/               # Header, Sidebar, etc.
│   │   └── feedback/             # Toasts, Modals, etc.
│   ├── hooks/                    # Hooks genéricos
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   └── useMediaQuery.ts
│   ├── lib/                      # Bibliotecas e configurações
│   │   ├── supabase/
│   │   ├── api/
│   │   └── utils/
│   ├── types/                    # Types globais
│   │   ├── database.ts
│   │   ├── api.ts
│   │   └── common.ts
│   └── constants/                # Constantes globais
│       ├── routes.ts
│       ├── config.ts
│       └── messages.ts
│
├── services/                     # Camada de serviços (API)
│   ├── api/
│   │   ├── client.ts
│   │   ├── accounts.ts
│   │   ├── transactions.ts
│   │   └── ...
│   └── supabase/
│       ├── client.ts
│       └── queries.ts
│
└── config/                       # Configurações
    ├── env.ts
    ├── routes.ts
    └── theme.ts
```

### Benefícios
✅ **Modularidade**: Cada feature é autocontida  
✅ **Escalabilidade**: Fácil adicionar novos módulos  
✅ **Manutenibilidade**: Código organizado por domínio  
✅ **Reusabilidade**: Shared components e hooks  
✅ **Testabilidade**: Isolamento de lógica

---

## 📋 FASE 3: LIMPEZA E PADRONIZAÇÃO

### Arquivos para Remover
```
❌ apps/web/AI_PROMPTS_BACKUP.md
❌ apps/web/AI_RESPONSE_LOG.md
❌ apps/web/debug-gemini.js
❌ apps/web/src/ (se não estiver em uso)
❌ Duplicações em utils/ e lib/
```

### Arquivos para Consolidar
```
🔄 utils/ + lib/ → shared/lib/
🔄 types espalhados → shared/types/
🔄 constants espalhados → shared/constants/
```

### Padrões de Código

#### Imports
```typescript
// ❌ Evitar imports relativos profundos
import { Button } from '../../../components/ui/button'

// ✅ Usar imports absolutos
import { Button } from '@/shared/components/ui/button'
```

#### Nomenclatura
```typescript
// Componentes: PascalCase
export function TransactionCard() {}

// Hooks: camelCase com 'use'
export function useTransactions() {}

// Services: camelCase
export const transactionService = {}

// Types: PascalCase
export type Transaction = {}

// Constants: UPPER_SNAKE_CASE
export const API_BASE_URL = ''
```

---

## 📋 FASE 4: PREPARAÇÃO MULTIPLATAFORMA

### Estrutura Compartilhada
```
packages/
└── shared/
    ├── types/          # Types compartilhados
    ├── utils/          # Funções utilitárias
    ├── constants/      # Constantes
    └── services/       # Lógica de negócio
```

### Uso
```typescript
// Web
import { Transaction } from '@fincore/shared/types'

// Mobile
import { Transaction } from '@fincore/shared/types'

// Backend (se necessário)
// Mesma interface de dados
```

---

## 📋 FASE 5: RESPONSIVIDADE

### Breakpoints Padrão
```typescript
// shared/constants/breakpoints.ts
export const BREAKPOINTS = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const
```

### Componentes Responsivos
```typescript
// Usar Tailwind responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Cards */}
</div>
```

---

## 🚀 CRONOGRAMA DE EXECUÇÃO

### Semana 1: Migrations (CRÍTICO)
- [ ] Dia 1-2: Análise e mapeamento cronológico
- [ ] Dia 3-4: Renomeação e consolidação
- [ ] Dia 5: Testes e validação

### Semana 2: Estrutura de Pastas
- [ ] Dia 1-2: Criar nova estrutura
- [ ] Dia 3-4: Mover arquivos gradualmente
- [ ] Dia 5: Atualizar imports

### Semana 3: Limpeza e Padronização
- [ ] Dia 1-2: Remover duplicações
- [ ] Dia 3-4: Padronizar código
- [ ] Dia 5: Documentação

### Semana 4: Validação Final
- [ ] Dia 1-2: Testes de regressão
- [ ] Dia 3-4: Ajustes finais
- [ ] Dia 5: Deploy e monitoramento

---

## ⚠️ RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Quebra de imports | Alta | Alto | Fazer gradualmente, testar a cada mudança |
| Perda de funcionalidade | Baixa | Crítico | Backup completo, testes de regressão |
| Conflito de migrations | Média | Alto | Validar ordem cronológica, testar em dev |
| Downtime em produção | Baixa | Crítico | Fazer em ambiente de dev primeiro |

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Antes de Cada Fase
- [ ] Backup completo realizado
- [ ] Plano de rollback definido
- [ ] Testes de regressão preparados

### Após Cada Fase
- [ ] Aplicação compila sem erros
- [ ] Todas as rotas funcionam
- [ ] Testes passam
- [ ] Funcionalidades validadas
- [ ] Documentação atualizada

---

## 📝 PRÓXIMA AÇÃO RECOMENDADA

### OPÇÃO 1: Começar pelas Migrations (RECOMENDADO)
**Por quê?** É o mais crítico e tem menor risco de quebrar funcionalidades

**Passos**:
1. Criar script de consolidação automática
2. Mapear todas as migrations cronologicamente
3. Renomear e mover para local único
4. Validar em ambiente de desenvolvimento
5. Documentar ordem de execução

### OPÇÃO 2: Começar pela Estrutura de Pastas
**Por quê?** Melhora organização mas requer mais tempo

**Passos**:
1. Criar nova estrutura de pastas
2. Mover arquivos gradualmente por módulo
3. Atualizar imports
4. Testar cada módulo movido

### OPÇÃO 3: Fazer Tudo de Uma Vez
**Por quê?** ❌ NÃO RECOMENDADO - Alto risco

---

## 🎯 DECISÃO NECESSÁRIA

**Qual abordagem você prefere?**

1. ✅ **Conservadora** (Recomendada)
   - Fazer fase por fase
   - Validar cada etapa
   - Menor risco

2. ⚡ **Agressiva**
   - Fazer múltiplas fases simultaneamente
   - Mais rápido
   - Maior risco

3. 🎯 **Customizada**
   - Você define as prioridades
   - Flexível
   - Risco variável

---

**Aguardando sua aprovação para iniciar** 🚦
