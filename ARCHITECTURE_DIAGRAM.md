# 🏗️ ARQUITETURA PROPOSTA - FINCORE

## 📁 Estrutura Completa do Projeto

```
Financeiro/
│
├── 📦 apps/
│   ├── 🌐 web/                              # Aplicação Web (Next.js)
│   │   ├── app/                             # Next.js App Router
│   │   │   ├── (auth)/                      # Grupo: Autenticação
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── forgot-password/
│   │   │   │
│   │   │   ├── (protected)/                 # Grupo: Área Protegida
│   │   │   │   ├── dashboard/               # Dashboard principal
│   │   │   │   ├── transactions/            # Transações
│   │   │   │   ├── accounts/                # Contas
│   │   │   │   ├── cards/                   # Cartões de crédito
│   │   │   │   │   ├── [id]/               # Detalhes do cartão
│   │   │   │   │   └── invoices/            # Faturas
│   │   │   │   ├── payables/                # Contas a pagar
│   │   │   │   ├── reports/                 # Relatórios
│   │   │   │   └── settings/                # Configurações
│   │   │   │
│   │   │   └── api/                         # API Routes
│   │   │       ├── auth/
│   │   │       ├── transactions/
│   │   │       └── webhooks/
│   │   │
│   │   ├── features/                        # 🆕 Módulos de Negócio
│   │   │   ├── auth/
│   │   │   │   ├── components/
│   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   └── RegisterForm.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useAuth.ts
│   │   │   │   │   └── useSession.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── authService.ts
│   │   │   │   └── types/
│   │   │   │       └── auth.types.ts
│   │   │   │
│   │   │   ├── transactions/
│   │   │   │   ├── components/
│   │   │   │   │   ├── TransactionCard.tsx
│   │   │   │   │   ├── TransactionList.tsx
│   │   │   │   │   ├── NewTransactionDialog.tsx
│   │   │   │   │   └── EditTransactionDialog.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useTransactions.ts
│   │   │   │   │   └── useTransactionMutations.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── transactionService.ts
│   │   │   │   └── types/
│   │   │   │       └── transaction.types.ts
│   │   │   │
│   │   │   ├── accounts/
│   │   │   │   ├── components/
│   │   │   │   │   ├── AccountCard.tsx
│   │   │   │   │   ├── AccountList.tsx
│   │   │   │   │   ├── BalanceAdjustmentDialog.tsx    # 🆕
│   │   │   │   │   └── BalanceAdjustmentHistory.tsx   # 🆕
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useAccounts.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── accountService.ts
│   │   │   │   └── types/
│   │   │   │       └── account.types.ts
│   │   │   │
│   │   │   ├── cards/
│   │   │   │   ├── components/
│   │   │   │   │   ├── CreditCardItem.tsx
│   │   │   │   │   ├── InvoiceList.tsx
│   │   │   │   │   └── InvoiceDetailsModal.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useCards.ts
│   │   │   │   │   └── useInvoices.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── cardService.ts
│   │   │   │   │   └── invoiceService.ts
│   │   │   │   └── types/
│   │   │   │       ├── card.types.ts
│   │   │   │       └── invoice.types.ts
│   │   │   │
│   │   │   ├── payables/
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── services/
│   │   │   │   └── types/
│   │   │   │
│   │   │   └── reports/
│   │   │       ├── components/
│   │   │       ├── hooks/
│   │   │       ├── services/
│   │   │       └── types/
│   │   │
│   │   ├── shared/                          # 🆕 Código Compartilhado
│   │   │   ├── components/
│   │   │   │   ├── ui/                      # shadcn/ui components
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   ├── card.tsx
│   │   │   │   │   └── ...
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   ├── Footer.tsx
│   │   │   │   │   └── PageContainer.tsx
│   │   │   │   ├── feedback/
│   │   │   │   │   ├── Toast.tsx
│   │   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   │   └── ErrorBoundary.tsx
│   │   │   │   └── charts/
│   │   │   │       ├── LineChart.tsx
│   │   │   │       ├── BarChart.tsx
│   │   │   │       └── PieChart.tsx
│   │   │   │
│   │   │   ├── hooks/                       # Hooks genéricos
│   │   │   │   ├── useDebounce.ts
│   │   │   │   ├── useLocalStorage.ts
│   │   │   │   ├── useMediaQuery.ts
│   │   │   │   ├── usePagination.ts
│   │   │   │   └── useInfiniteScroll.ts
│   │   │   │
│   │   │   ├── lib/                         # Bibliotecas e utilitários
│   │   │   │   ├── supabase/
│   │   │   │   │   ├── client.ts
│   │   │   │   │   ├── server.ts
│   │   │   │   │   └── middleware.ts
│   │   │   │   ├── api/
│   │   │   │   │   ├── client.ts
│   │   │   │   │   └── errorHandler.ts
│   │   │   │   ├── utils/
│   │   │   │   │   ├── formatters.ts        # formatCurrency, formatDate
│   │   │   │   │   ├── validators.ts
│   │   │   │   │   └── helpers.ts
│   │   │   │   └── icons.ts
│   │   │   │
│   │   │   ├── types/                       # Types globais
│   │   │   │   ├── database.ts              # Tipos do banco
│   │   │   │   ├── api.ts                   # Tipos de API
│   │   │   │   ├── common.ts                # Tipos comuns
│   │   │   │   └── enums.ts                 # Enums
│   │   │   │
│   │   │   └── constants/                   # Constantes globais
│   │   │       ├── routes.ts                # Rotas da aplicação
│   │   │       ├── config.ts                # Configurações
│   │   │       ├── messages.ts              # Mensagens de erro/sucesso
│   │   │       └── breakpoints.ts           # Breakpoints responsivos
│   │   │
│   │   ├── services/                        # Camada de Serviços (API)
│   │   │   ├── api/
│   │   │   │   ├── client.ts
│   │   │   │   ├── accounts.ts
│   │   │   │   ├── transactions.ts
│   │   │   │   ├── cards.ts
│   │   │   │   └── ...
│   │   │   └── supabase/
│   │   │       ├── client.ts
│   │   │       └── queries.ts
│   │   │
│   │   ├── config/                          # Configurações
│   │   │   ├── env.ts
│   │   │   ├── routes.ts
│   │   │   └── theme.ts
│   │   │
│   │   ├── public/                          # Assets estáticos
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   └── fonts/
│   │   │
│   │   └── [arquivos de config]
│   │       ├── package.json
│   │       ├── tsconfig.json
│   │       ├── next.config.ts
│   │       ├── tailwind.config.js
│   │       └── .env.local
│   │
│   └── 📱 mobile/                           # Aplicação Mobile (React Native)
│       ├── app/                             # Expo Router
│       ├── features/                        # Mesma estrutura do web
│       ├── shared/                          # Compartilhado com web
│       └── [arquivos de config]
│
├── 🔧 backend/                              # Backend (Golang)
│   ├── cmd/
│   │   └── api/
│   │       └── main.go
│   ├── internal/
│   │   ├── handlers/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── models/
│   └── [arquivos de config]
│
├── 📦 packages/                             # Pacotes compartilhados
│   └── shared/                              # Código compartilhado entre apps
│       ├── types/
│       ├── utils/
│       ├── constants/
│       └── package.json
│
├── 🗄️ database/                             # 🆕 Database (NOVO LOCAL ÚNICO)
│   ├── migrations/                          # 🆕 Todas as migrations aqui
│   │   ├── 20251201120000_create_users_table.sql
│   │   ├── 20251201120500_fix_permissions.sql
│   │   ├── 20251201121000_create_accounts_table.sql
│   │   ├── ...
│   │   ├── 20251217125555_add_balance_adjustments.sql
│   │   └── MIGRATIONS_INDEX.md             # 🆕 Índice de execução
│   │
│   ├── schema.sql                           # Schema completo
│   └── seeds/                               # Dados de exemplo
│       ├── dev/
│       └── prod/
│
├── 📚 docs/                                 # Documentação
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── CONTRIBUTING.md
│
└── [arquivos raiz]
    ├── package.json                         # Workspace root
    ├── turbo.json                           # Turborepo config
    ├── .gitignore
    ├── README.md
    └── REFACTORING_MASTER_PLAN.md          # Este plano
```

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐ │
│  │   Pages     │───▶│   Features   │───▶│    Shared     │ │
│  │  (Routes)   │    │  (Business)  │    │  (UI/Utils)   │ │
│  └─────────────┘    └──────────────┘    └───────────────┘ │
│         │                   │                     │         │
│         └───────────────────┴─────────────────────┘         │
│                             │                               │
└─────────────────────────────┼───────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │    SERVICES      │
                    │  (API Layer)     │
                    └──────────────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
                 ▼                         ▼
        ┌─────────────────┐      ┌─────────────────┐
        │    SUPABASE     │      │  BACKEND (Go)   │
        │   (Database)    │      │   (REST API)    │
        └─────────────────┘      └─────────────────┘
```

---

## 🎯 Benefícios da Nova Estrutura

### 1. Modularidade
✅ Cada feature é independente  
✅ Fácil adicionar/remover módulos  
✅ Código isolado por domínio

### 2. Reusabilidade
✅ Componentes compartilhados em `shared/`  
✅ Hooks genéricos reutilizáveis  
✅ Types centralizados

### 3. Escalabilidade
✅ Estrutura preparada para crescimento  
✅ Fácil adicionar novas features  
✅ Suporta múltiplas plataformas

### 4. Manutenibilidade
✅ Código organizado e previsível  
✅ Fácil encontrar arquivos  
✅ Imports consistentes

### 5. Testabilidade
✅ Lógica separada de UI  
✅ Fácil mockar services  
✅ Testes isolados por feature

---

## 📝 Convenções de Nomenclatura

### Arquivos
```
PascalCase:  TransactionCard.tsx, UserService.ts
camelCase:   useTransactions.ts, formatCurrency.ts
kebab-case:  transaction-card.css, user-service.test.ts
```

### Pastas
```
kebab-case:  balance-adjustments/, credit-cards/
lowercase:   components/, hooks/, services/
```

### Imports
```typescript
// Absolutos (preferir)
import { Button } from '@/shared/components/ui/button'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'

// Relativos (evitar quando possível)
import { Button } from '../../../components/ui/button'
```

---

## 🚀 Migração Gradual

### Fase 1: Criar Estrutura
```bash
mkdir -p apps/web/features
mkdir -p apps/web/shared/{components,hooks,lib,types,constants}
mkdir -p database/migrations
```

### Fase 2: Mover Módulos (um por vez)
```
1. Criar features/transactions/
2. Mover componentes relacionados
3. Mover hooks relacionados
4. Atualizar imports
5. Testar
6. Repetir para próximo módulo
```

### Fase 3: Limpar
```
1. Remover pastas antigas vazias
2. Deletar código duplicado
3. Atualizar documentação
```

---

**Esta é a estrutura alvo final** 🎯
