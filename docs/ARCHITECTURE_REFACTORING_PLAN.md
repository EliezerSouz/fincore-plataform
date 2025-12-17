# 🏗️ Plano de Refatoração Arquitetural - Financeiro Platform

**Data:** 14/12/2025  
**Arquiteto:** Sistema de Análise Sênior  
**Status:** 🔄 Em Execução

---

## 📊 ANÁLISE DA ESTRUTURA ATUAL

### Problemas Identificados

#### 1. **Estrutura de Pastas Confusa**
- ❌ Pastas `lib` e `utils` com responsabilidades sobrepostas
- ❌ Componentes misturados com lógica de negócio
- ❌ Falta de separação clara entre features
- ❌ Migrations duplicadas em múltiplas pastas (já resolvido)
- ❌ Arquivos soltos na raiz do projeto

#### 2. **Imports Desorganizados**
- ❌ Uso inconsistente de paths relativos (`../../..`)
- ❌ Falta de aliases padronizados
- ❌ Imports não organizados por categoria

#### 3. **Duplicação de Código**
- ❌ Lógica de Supabase em `utils/supabase` e potencialmente em `lib`
- ❌ Possível duplicação de tipos e interfaces
- ❌ Componentes de UI sem reutilização adequada

#### 4. **Falta de Escalabilidade**
- ❌ Estrutura não preparada para Mobile
- ❌ Sem separação clara de código compartilhado
- ❌ Backend isolado sem integração clara

---

## 🎯 NOVA ESTRUTURA PROPOSTA

### Estrutura Global do Repositório

```
Financeiro/
├── apps/                          # Aplicações (Monorepo approach)
│   ├── web/                       # Frontend Web (Next.js)
│   ├── mobile/                    # Mobile (React Native - futuro)
│   └── api/                       # Backend API (Golang)
│
├── packages/                      # Código compartilhado
│   ├── shared/                    # Código compartilhado entre apps
│   │   ├── types/                 # TypeScript types/interfaces
│   │   ├── constants/             # Constantes globais
│   │   ├── utils/                 # Utilitários compartilhados
│   │   └── validators/            # Validações de negócio
│   │
│   └── ui/                        # Componentes UI compartilhados (futuro)
│
├── infra/                         # Infraestrutura
│   ├── database/                  # Schemas, migrations
│   │   ├── migrations/            # Migrations SQL
│   │   └── schemas/               # Schemas de referência
│   │
│   └── scripts/                   # Scripts de automação
│
├── docs/                          # Documentação
│   ├── architecture/              # Documentação arquitetural
│   ├── api/                       # Documentação de APIs
│   └── guides/                    # Guias de desenvolvimento
│
└── tools/                         # Ferramentas de desenvolvimento
    └── scripts/                   # Scripts auxiliares
```

---

## 🌐 ESTRUTURA DETALHADA - WEB (Next.js)

### Nova Estrutura `apps/web/`

```
apps/web/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/                # Grupo de rotas de autenticação
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── logout/
│   │   │
│   │   ├── (dashboard)/           # Grupo de rotas protegidas
│   │   │   ├── layout.tsx
│   │   │   ├── caixa/             # Feature: Caixa
│   │   │   ├── compromissos/      # Feature: Compromissos
│   │   │   └── patrimonio/        # Feature: Patrimônio
│   │   │
│   │   ├── api/                   # API Routes
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── features/                  # Features modulares
│   │   ├── accounts/              # Feature: Contas
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   │
│   │   ├── transactions/          # Feature: Transações
│   │   ├── categories/            # Feature: Categorias
│   │   ├── credit-cards/          # Feature: Cartões de Crédito
│   │   ├── payables/              # Feature: Contas a Pagar
│   │   ├── dashboard/             # Feature: Dashboard
│   │   └── auth/                  # Feature: Autenticação
│   │
│   ├── components/                # Componentes compartilhados
│   │   ├── ui/                    # Componentes UI base (shadcn)
│   │   ├── layouts/               # Layouts reutilizáveis
│   │   ├── forms/                 # Componentes de formulário
│   │   └── common/                # Componentes comuns
│   │
│   ├── lib/                       # Bibliotecas e configurações
│   │   ├── supabase/              # Cliente Supabase
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   │
│   │   ├── ai/                    # Integrações AI
│   │   │   ├── groq.ts
│   │   │   └── insights.ts
│   │   │
│   │   └── utils/                 # Utilitários gerais
│   │       ├── cn.ts              # Class names utility
│   │       ├── format.ts          # Formatação
│   │       └── date.ts            # Manipulação de datas
│   │
│   ├── hooks/                     # Hooks globais
│   │   ├── use-mobile.ts
│   │   ├── use-permission.ts
│   │   └── use-toast.ts
│   │
│   ├── services/                  # Serviços de API
│   │   ├── api/                   # Chamadas HTTP
│   │   └── storage/               # Storage/Cache
│   │
│   ├── providers/                 # Context Providers
│   │   ├── theme-provider.tsx
│   │   └── auth-provider.tsx
│   │
│   ├── types/                     # Types globais
│   │   ├── database.ts            # Types do banco
│   │   ├── entities.ts            # Entidades
│   │   └── api.ts                 # Types de API
│   │
│   ├── styles/                    # Estilos globais
│   │   └── globals.css
│   │
│   ├── config/                    # Configurações
│   │   ├── site.ts                # Configurações do site
│   │   └── constants.ts           # Constantes
│   │
│   └── middleware.ts              # Middleware Next.js
│
├── public/                        # Assets estáticos
│   ├── images/
│   └── icons/
│
├── tests/                         # Testes
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.local
├── .env.example
├── next.config.ts
├── tsconfig.json
├── tailwind.config.js
└── package.json
```

---

## 🔧 BACKEND (Golang) - Clean Architecture

### Estrutura `apps/api/`

```
apps/api/
├── cmd/
│   └── api/
│       └── main.go                # Entry point
│
├── internal/
│   ├── domain/                    # Camada de Domínio
│   │   ├── entities/              # Entidades de negócio
│   │   ├── repositories/          # Interfaces de repositórios
│   │   └── services/              # Serviços de domínio
│   │
│   ├── application/               # Camada de Aplicação
│   │   ├── usecases/              # Casos de uso
│   │   └── dto/                   # Data Transfer Objects
│   │
│   ├── infrastructure/            # Camada de Infraestrutura
│   │   ├── database/              # Implementação de DB
│   │   ├── http/                  # Handlers HTTP
│   │   ├── middleware/            # Middlewares
│   │   └── config/                # Configurações
│   │
│   └── shared/                    # Código compartilhado
│       ├── errors/                # Tratamento de erros
│       └── utils/                 # Utilitários
│
├── pkg/                           # Pacotes públicos
│   └── logger/                    # Logger customizado
│
├── go.mod
└── go.sum
```

---

## 📦 PACKAGES COMPARTILHADOS

### `packages/shared/`

```
packages/shared/
├── types/                         # Types TypeScript
│   ├── account.ts
│   ├── transaction.ts
│   ├── category.ts
│   └── index.ts
│
├── constants/                     # Constantes
│   ├── routes.ts
│   ├── status.ts
│   └── index.ts
│
├── utils/                         # Utilitários
│   ├── validation.ts
│   ├── formatting.ts
│   └── index.ts
│
└── validators/                    # Validadores
    ├── account-validator.ts
    └── index.ts
```

---

## 🎨 ESTRATÉGIA DE IMPORTS E ALIASES

### Path Aliases (tsconfig.json)

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/features/*": ["./src/features/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"],
      "@/services/*": ["./src/services/*"],
      "@/config/*": ["./src/config/*"],
      "@/styles/*": ["./src/styles/*"],
      "@/shared/*": ["../../packages/shared/*"]
    }
  }
}
```

### Ordem Padrão de Imports

```typescript
// 1. Bibliotecas externas (React, Next, etc)
import React from 'react'
import { useRouter } from 'next/navigation'

// 2. Componentes UI externos
import { Button } from '@/components/ui/button'

// 3. Features e módulos internos
import { useAccounts } from '@/features/accounts'

// 4. Hooks
import { useMobile } from '@/hooks/use-mobile'

// 5. Serviços e libs
import { supabase } from '@/lib/supabase/client'

// 6. Types
import type { Account } from '@/types/entities'

// 7. Utils e helpers
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/format'

// 8. Estilos e assets
import '@/styles/custom.css'
```

---

## 🔄 PLANO DE MIGRAÇÃO

### Fase 1: Preparação (Atual)
- [x] Análise completa da estrutura
- [x] Consolidação de migrations
- [ ] Criação da nova estrutura de pastas
- [ ] Configuração de aliases

### Fase 2: Reorganização de Código
- [ ] Mover componentes para features
- [ ] Consolidar lib e utils
- [ ] Reorganizar hooks
- [ ] Centralizar types

### Fase 3: Atualização de Imports
- [ ] Atualizar todos os imports para usar aliases
- [ ] Remover imports não utilizados
- [ ] Padronizar ordem de imports

### Fase 4: Backend
- [ ] Reestruturar seguindo Clean Architecture
- [ ] Separar camadas claramente
- [ ] Criar interfaces de repositórios

### Fase 5: Preparação Mobile
- [ ] Criar estrutura base
- [ ] Mover código compartilhado para packages
- [ ] Documentar APIs

### Fase 6: Validação e Testes
- [ ] Verificar build
- [ ] Testar funcionalidades
- [ ] Atualizar documentação

---

## ✅ BENEFÍCIOS ESPERADOS

### 1. **Manutenibilidade**
- ✅ Código organizado por features
- ✅ Responsabilidades claras
- ✅ Fácil localização de arquivos

### 2. **Escalabilidade**
- ✅ Estrutura preparada para crescimento
- ✅ Código compartilhado entre Web e Mobile
- ✅ Padrões consistentes

### 3. **Onboarding**
- ✅ Estrutura intuitiva
- ✅ Documentação clara
- ✅ Padrões bem definidos

### 4. **Performance de Desenvolvimento**
- ✅ Imports rápidos com aliases
- ✅ Menos navegação entre pastas
- ✅ Reutilização de código

### 5. **Qualidade de Código**
- ✅ Separação de responsabilidades
- ✅ Testabilidade melhorada
- ✅ Menos duplicação

---

## 📝 PRÓXIMOS PASSOS

1. **Criar nova estrutura de pastas**
2. **Configurar aliases no tsconfig.json**
3. **Migrar código gradualmente por feature**
4. **Atualizar imports**
5. **Validar e testar**

---

**Última atualização:** 14/12/2025 12:54  
**Responsável:** Arquiteto de Software Sênior
