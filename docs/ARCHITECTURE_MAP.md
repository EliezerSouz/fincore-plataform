# 🗺️ Mapa Visual da Arquitetura

**Projeto:** Financeiro Platform  
**Versão:** 0.2.0 (Refatorado)  
**Data:** 14/12/2025

---

## 📊 Visão Geral da Estrutura

```
Financeiro/
│
├── 📱 apps/                          # Aplicações
│   ├── web/                          # Frontend Web (Next.js)
│   └── api/                          # Backend API (Golang)
│
├── 📦 packages/                      # Código compartilhado (futuro)
│   └── shared/                       # Types, utils, validators
│
├── 🏗️ infra/                         # Infraestrutura
│   └── database/
│       └── migrations/               # 51 migrations SQL
│
└── 📚 docs/                          # Documentação
    ├── ARCHITECTURE_REFACTORING_PLAN.md
    ├── REFACTORING_PROGRESS.md
    ├── MIGRATION_GUIDE.md
    ├── EXECUTIVE_SUMMARY.md
    └── ARCHITECTURE_MAP.md (este arquivo)
```

---

## 🌐 Frontend Web - Estrutura Detalhada

```
web/
│
├── 📂 src/                           # 🆕 NOVA estrutura organizada
│   │
│   ├── 🎯 features/                  # Features modulares (Domain-Driven)
│   │   │
│   │   ├── 💰 accounts/              # Feature: Contas Bancárias
│   │   │   ├── components/           # UI específica de contas
│   │   │   ├── hooks/                # useAccounts, useAccountBalance
│   │   │   ├── services/             # account-service.ts
│   │   │   ├── types/                # account.types.ts
│   │   │   └── index.ts              # Exports públicos
│   │   │
│   │   ├── 💸 transactions/          # Feature: Transações
│   │   │   ├── components/           # TransactionCard, TransactionForm
│   │   │   ├── hooks/                # useTransactions, useCreateTransaction
│   │   │   ├── services/             # transaction-service.ts
│   │   │   ├── types/                # transaction.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── 🏷️ categories/            # Feature: Categorias
│   │   │   ├── components/           # CategoryPicker, CategoryBadge
│   │   │   ├── hooks/                # useCategories
│   │   │   ├── services/             # category-service.ts
│   │   │   ├── types/                # category.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── 💳 credit-cards/          # Feature: Cartões de Crédito
│   │   │   ├── components/           # CreditCardItem, InvoiceList
│   │   │   ├── hooks/                # useCreditCards, useInvoices
│   │   │   ├── services/             # credit-card-service.ts
│   │   │   ├── types/                # credit-card.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── 📅 payables/              # Feature: Contas a Pagar
│   │   │   ├── components/           # PayableCard, PayableForm
│   │   │   ├── hooks/                # usePayables
│   │   │   ├── services/             # payable-service.ts
│   │   │   ├── types/                # payable.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── 📊 dashboard/             # Feature: Dashboard
│   │   │   ├── components/           # FinancialChart, SummaryCards
│   │   │   ├── hooks/                # useFinancialSummary, useDashboard
│   │   │   ├── services/             # dashboard-service.ts
│   │   │   └── index.ts
│   │   │
│   │   └── 🔐 auth/                  # Feature: Autenticação
│   │       ├── components/           # LoginForm, SignupForm
│   │       ├── hooks/                # useAuth, useUser
│   │       ├── services/             # auth-service.ts
│   │       └── index.ts
│   │
│   ├── 📚 lib/                       # Bibliotecas e configurações
│   │   │
│   │   ├── 🗄️ supabase/              # Cliente Supabase
│   │   │   ├── client.ts             # Cliente browser
│   │   │   ├── server.ts             # Cliente server-side
│   │   │   └── middleware.ts         # Middleware de auth
│   │   │
│   │   ├── 🤖 ai/                    # Integrações AI
│   │   │   ├── ai-insights.ts        # Groq AI integration
│   │   │   ├── insights-engine.ts    # Engine de processamento
│   │   │   └── insights-rules.ts     # Regras de negócio
│   │   │
│   │   └── 🛠️ utils/                 # Utilitários
│   │       ├── cn.ts                 # Class names utility
│   │       ├── format.ts             # Formatação (moeda, data)
│   │       └── index.ts              # Exports
│   │
│   ├── 🔌 services/                  # Serviços globais
│   │   ├── api/                      # HTTP clients
│   │   └── storage/                  # Cache e storage
│   │
│   ├── 📝 types/                     # Types TypeScript globais
│   │   ├── database.ts               # Types do Supabase
│   │   ├── entities.ts               # Entidades de negócio
│   │   └── api.ts                    # Types de API
│   │
│   ├── ⚙️ config/                    # Configurações
│   │   ├── site.ts                   # Config do site
│   │   ├── constants.ts              # Constantes globais
│   │   └── index.ts                  # Exports
│   │
│   └── 🎨 styles/                    # Estilos globais
│       └── globals.css               # CSS global
│
├── 📄 app/                           # Next.js App Router
│   ├── (auth)/                       # Grupo: Autenticação
│   │   ├── login/
│   │   ├── signup/
│   │   └── logout/
│   │
│   ├── (dashboard)/                  # Grupo: Dashboard (protegido)
│   │   ├── layout.tsx
│   │   ├── caixa/                    # Seção: Caixa
│   │   │   ├── accounts/
│   │   │   ├── transactions/
│   │   │   └── categories/
│   │   │
│   │   ├── compromissos/             # Seção: Compromissos
│   │   │   ├── cards/
│   │   │   └── payables/
│   │   │
│   │   └── patrimonio/               # Seção: Patrimônio (futuro)
│   │
│   ├── api/                          # API Routes
│   ├── layout.tsx                    # Layout raiz
│   └── page.tsx                      # Home page
│
├── 🧩 components/                    # Componentes compartilhados
│   ├── ui/                           # Componentes base (shadcn)
│   ├── layouts/                      # Layouts reutilizáveis
│   ├── forms/                        # Componentes de formulário
│   └── common/                       # Componentes comuns
│
├── 🪝 hooks/                         # Hooks globais
│   ├── use-mobile.ts                 # Detecção mobile
│   ├── use-permission.ts             # Permissões
│   └── use-toast.ts                  # Notificações
│
├── 🎭 providers/                     # Context Providers
│   └── theme-provider.tsx            # Provider de tema
│
├── 🌍 public/                        # Assets estáticos
│   ├── images/
│   └── icons/
│
├── ⚙️ Configurações
│   ├── tsconfig.json                 # TypeScript config
│   ├── tailwind.config.js            # Tailwind config
│   ├── next.config.ts                # Next.js config
│   └── package.json                  # Dependencies
│
└── 📝 Documentação
    └── README.md                     # README do web
```

---

## 🔧 Backend (Golang) - Clean Architecture

```
backend/
│
├── 📂 cmd/                           # Entry points
│   └── api/
│       └── main.go                   # Main application
│
├── 📂 internal/                      # Código privado
│   │
│   ├── 🏛️ domain/                    # Camada de Domínio
│   │   ├── entities/                 # Entidades de negócio
│   │   ├── repositories/             # Interfaces de repositórios
│   │   └── services/                 # Serviços de domínio
│   │
│   ├── 💼 application/               # Camada de Aplicação
│   │   ├── usecases/                 # Casos de uso
│   │   └── dto/                      # Data Transfer Objects
│   │
│   ├── 🏗️ infrastructure/            # Camada de Infraestrutura
│   │   ├── database/                 # Implementação de DB
│   │   ├── http/                     # Handlers HTTP
│   │   ├── middleware/               # Middlewares
│   │   └── config/                   # Configurações
│   │
│   └── 🔧 shared/                    # Código compartilhado
│       ├── errors/                   # Tratamento de erros
│       └── utils/                    # Utilitários
│
└── 📦 pkg/                           # Pacotes públicos
    └── logger/                       # Logger customizado
```

---

## 🔗 Fluxo de Dados

### Frontend → Backend → Database

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │   Feature    │──────│   Service    │                   │
│  │  Component   │      │   (API Call) │                   │
│  └──────────────┘      └──────┬───────┘                   │
│         │                      │                            │
│         │                      │                            │
│    ┌────▼─────┐          ┌────▼─────┐                     │
│    │   Hook   │          │ Supabase │                     │
│    │ (State)  │          │  Client  │                     │
│    └──────────┘          └────┬─────┘                     │
│                               │                            │
└───────────────────────────────┼────────────────────────────┘
                                │
                                │ HTTP/WebSocket
                                │
┌───────────────────────────────▼────────────────────────────┐
│                        SUPABASE                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │     Auth     │      │  PostgreSQL  │                   │
│  │   Service    │      │   Database   │                   │
│  └──────────────┘      └──────────────┘                   │
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │     RLS      │      │  Functions   │                   │
│  │   Policies   │      │   (PL/pgSQL) │                   │
│  └──────────────┘      └──────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Padrão de Imports

### Hierarquia de Imports

```typescript
// 1️⃣ Bibliotecas externas (React, Next, etc)
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

// 2️⃣ Componentes UI (shadcn, Radix)
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'

// 3️⃣ Features (módulos de negócio)
import { AccountCard, useAccounts } from '@/features/accounts'
import { TransactionForm } from '@/features/transactions'

// 4️⃣ Hooks globais
import { useMobile } from '@/hooks/use-mobile'
import { usePermission } from '@/hooks/use-permission'

// 5️⃣ Libs e serviços
import { supabase } from '@/lib/supabase/client'
import { cn, formatCurrency } from '@/lib/utils'

// 6️⃣ Types
import type { Account, Transaction } from '@/types/entities'
import type { Database } from '@/types/database'

// 7️⃣ Configurações
import { ROUTES, TRANSACTION_TYPES } from '@/config'

// 8️⃣ Estilos (se necessário)
import styles from './styles.module.css'
```

---

## 🗂️ Organização por Feature

### Exemplo: Feature "Accounts"

```
features/accounts/
│
├── 📁 components/                    # UI Components
│   ├── AccountCard.tsx               # Card de conta
│   ├── AccountForm.tsx               # Formulário de conta
│   ├── AccountList.tsx               # Lista de contas
│   └── AccountBalance.tsx            # Saldo da conta
│
├── 🪝 hooks/                         # Custom Hooks
│   ├── use-accounts.ts               # Hook principal
│   ├── use-account-balance.ts        # Hook de saldo
│   └── use-create-account.ts         # Hook de criação
│
├── 🔌 services/                      # API Services
│   └── account-service.ts            # Serviço de API
│       ├── getAccounts()
│       ├── createAccount()
│       ├── updateAccount()
│       └── deleteAccount()
│
├── 📝 types/                         # TypeScript Types
│   └── account.types.ts
│       ├── Account
│       ├── AccountType
│       └── CreateAccountDTO
│
└── 📄 index.ts                       # Public Exports
    export * from './components/AccountCard'
    export * from './hooks/use-accounts'
    export type * from './types/account.types'
```

---

## 🔐 Segurança e Autenticação

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE AUTENTICAÇÃO                    │
└─────────────────────────────────────────────────────────────┘

1. Login/Signup
   ↓
2. Supabase Auth
   ↓
3. JWT Token
   ↓
4. Middleware (Next.js)
   ↓
5. Protected Routes
   ↓
6. RLS Policies (Database)
   ↓
7. Data Access
```

---

## 📊 Database Schema (Simplificado)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    users     │     │   accounts   │     │ transactions │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │────<│ user_id (FK) │────<│ account_id   │
│ email        │     │ name         │     │ amount       │
│ created_at   │     │ type         │     │ type         │
└──────────────┘     │ balance      │     │ category_id  │
                     └──────────────┘     └──────────────┘
                            │
                            │
                     ┌──────▼───────┐
                     │ credit_cards │
                     ├──────────────┤
                     │ id (PK)      │
                     │ user_id (FK) │
                     │ name         │
                     │ limit        │
                     └──────────────┘
```

---

## 🚀 Deploy e CI/CD (Futuro)

```
┌─────────────┐
│   GitHub    │
│ Repository  │
└──────┬──────┘
       │
       │ Push/PR
       │
┌──────▼──────┐
│   GitHub    │
│   Actions   │
└──────┬──────┘
       │
       ├─────> Build & Test
       ├─────> Lint & Type Check
       │
┌──────▼──────┐
│   Vercel    │
│   Deploy    │
└─────────────┘
```

---

## 📱 Mobile (Futuro)

```
packages/shared/
├── types/              # Compartilhado com Web
├── utils/              # Compartilhado com Web
├── validators/         # Compartilhado com Web
└── constants/          # Compartilhado com Web

apps/mobile/
├── src/
│   ├── features/       # Mesma estrutura do Web
│   ├── components/     # Componentes React Native
│   └── navigation/     # React Navigation
```

---

**Última Atualização:** 14/12/2025  
**Versão:** 0.2.0  
**Status:** ✅ Arquitetura Refatorada
