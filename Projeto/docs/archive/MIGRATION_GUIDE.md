# 🚀 Guia Rápido de Migração

Este guia ajuda você a trabalhar com a nova estrutura do projeto.

---

## 📁 Nova Estrutura de Pastas

```
web/
├── src/                    # 🆕 NOVA estrutura organizada
│   ├── features/           # Features modulares
│   ├── lib/               # Bibliotecas e configurações
│   ├── config/            # Configurações centralizadas
│   ├── types/             # Types TypeScript
│   └── services/          # Serviços de API
│
├── app/                   # ✅ MANTIDO - Next.js App Router
├── components/            # ⚠️  SERÁ MIGRADO para src/features
├── hooks/                 # ⚠️  SERÁ MIGRADO para src/hooks
└── providers/             # ✅ MANTIDO
```

---

## 🔧 Como Usar os Novos Aliases

### Antes (❌ Evitar):
```typescript
import { formatCurrency } from '../../../lib/utils'
import { supabase } from '../../utils/supabase/client'
```

### Agora (✅ Recomendado):
```typescript
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
```

---

## 📦 Imports Disponíveis

### Utilitários
```typescript
import { cn, formatCurrency, formatDate, formatNumber } from '@/lib/utils'
```

### Supabase
```typescript
import { supabase } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/server'
```

### Configurações
```typescript
import { ROUTES, siteConfig, TRANSACTION_TYPES } from '@/config'
```

### AI (se habilitado)
```typescript
import { generateInsights } from '@/lib/ai/ai-insights'
import { getInsightsByRules } from '@/lib/ai/insights-rules'
```

---

## 🎯 Padrão de Organização por Feature

Cada feature deve seguir esta estrutura:

```
src/features/[nome-da-feature]/
├── components/          # Componentes específicos
│   ├── FeatureCard.tsx
│   └── FeatureForm.tsx
│
├── hooks/              # Hooks específicos
│   └── use-feature.ts
│
├── services/           # Lógica de API
│   └── feature-service.ts
│
├── types/              # Types específicos
│   └── feature.types.ts
│
└── index.ts            # Exports públicos
```

### Exemplo de `index.ts`:
```typescript
// src/features/accounts/index.ts
export * from './components/AccountCard'
export * from './hooks/use-accounts'
export * from './services/account-service'
export type * from './types/account.types'
```

---

## 📝 Ordem Padrão de Imports

Sempre organize seus imports nesta ordem:

```typescript
// 1️⃣ Bibliotecas externas
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

// 2️⃣ Componentes UI
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// 3️⃣ Features
import { AccountCard, useAccounts } from '@/features/accounts'

// 4️⃣ Hooks globais
import { useMobile } from '@/hooks/use-mobile'

// 5️⃣ Libs e serviços
import { supabase } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

// 6️⃣ Types
import type { Account, Transaction } from '@/types/entities'

// 7️⃣ Configurações
import { ROUTES } from '@/config'

// 8️⃣ Estilos (se necessário)
import styles from './styles.module.css'
```

---

## 🔄 Migração Gradual

### Passo 1: Criar arquivo na nova estrutura
```
src/features/accounts/components/AccountCard.tsx
```

### Passo 2: Copiar código e atualizar imports
```typescript
// Antes
import { formatCurrency } from '../../../lib/utils'

// Depois
import { formatCurrency } from '@/lib/utils'
```

### Passo 3: Exportar no index.ts
```typescript
// src/features/accounts/index.ts
export { AccountCard } from './components/AccountCard'
```

### Passo 4: Usar onde necessário
```typescript
import { AccountCard } from '@/features/accounts'
```

---

## 🛠️ Comandos Úteis

### Verificar estrutura
```bash
npm run dev
```

### Verificar tipos
```bash
npx tsc --noEmit
```

### Lint
```bash
npm run lint
```

---

## ⚡ Dicas Rápidas

### ✅ FAZER:
- Use aliases (`@/`) para todos os imports
- Organize imports por categoria
- Mantenha features isoladas
- Exporte apenas o necessário no `index.ts`

### ❌ EVITAR:
- Imports relativos profundos (`../../../`)
- Misturar lógica de negócio com UI
- Duplicar código entre features
- Imports circulares

---

## 🆘 Problemas Comuns

### Erro: "Cannot find module '@/lib/utils'"
**Solução:** Verifique se o `tsconfig.json` está configurado corretamente.

### Erro: "Module not found"
**Solução:** Reinicie o servidor de desenvolvimento (`npm run dev`).

### Imports não funcionam
**Solução:** Verifique se está usando o alias correto e se o arquivo existe.

---

## 📚 Referências

- [Plano de Refatoração Completo](./ARCHITECTURE_REFACTORING_PLAN.md)
- [Progresso da Refatoração](./REFACTORING_PROGRESS.md)
- [Documentação Next.js](https://nextjs.org/docs)

---

**Última Atualização:** 14/12/2025  
**Dúvidas?** Consulte a documentação ou abra uma issue.
