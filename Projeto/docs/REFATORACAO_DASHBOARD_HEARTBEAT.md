# 🫀 REFATORAÇÃO: Dashboard & Heartbeat Core

**Data:** 21/12/2025 01:37  
**Componente:** `HeartbeatCore` (Coração com batimento cardíaco)  
**Status:** ⚠️ Animação não funciona na tela

---

## 🔍 DIAGNÓSTICO

### ✅ **O que está CORRETO:**

1. **Animações configuradas no Tailwind** (`tailwind.config.js`)
   - `animate-heartbeat-slow` - 2s (ritmo lento/saudável)
   - `animate-heartbeat-fast` - 0.8s (ritmo acelerado)
   - `animate-heartbeat-irregular` - 2s (arritmia)
   - `animate-ecg-move` - 4s (movimento do ECG)

2. **Componente bem estruturado**
   - Lógica de mapeamento de status
   - ECG background animado
   - Cores semânticas (wealth, risk, danger)

3. **Dependências instaladas**
   - `tw-animate-css` - Plugin de animações
   - `@radix-ui/react-tooltip` - Tooltips

### ⚠️ **PROBLEMAS IDENTIFICADOS:**

#### **1. Falta TooltipProvider no Layout**
O componente usa `<Tooltip>` mas não tem o provider global.

#### **2. Possível conflito de especificidade CSS**
As classes do Tailwind 4 podem estar sendo sobrescritas.

#### **3. Transform-gpu pode não estar aplicando**
A classe `transform-gpu` precisa de configuração adicional.

---

## 🔧 SOLUÇÕES

### **SOLUÇÃO 1: Adicionar TooltipProvider**

O componente `HeartbeatCore` usa tooltips, mas precisa do provider no layout.

**Arquivo:** `apps/web/app/(protected)/layout.tsx`

```tsx
import { TooltipProvider } from "@/components/ui/tooltip"

export default function ProtectedLayout({ children }: { children: React.Node }) {
  return (
    <TooltipProvider delayDuration={200}>
      {children}
    </TooltipProvider>
  )
}
```

---

### **SOLUÇÃO 2: Verificar se o Tooltip Component está correto**

**Arquivo:** `apps/web/components/ui/tooltip.tsx`

Deve ter esta estrutura:

```tsx
"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
```

---

### **SOLUÇÃO 3: Forçar animação com CSS inline (Fallback)**

Se as classes do Tailwind não funcionarem, adicione CSS inline como fallback:

**Arquivo:** `apps/web/components/heartbeat-core.tsx`

Adicione um `style` ao ícone do coração:

```tsx
<Heart 
  className={cn("w-10 h-10 fill-current transform-gpu origin-center",
    config.color,
    config.animation
  )}
  style={{
    animation: visualStatus === 'STABLE' ? 'heartbeat-slow 2s infinite ease-in-out' :
               visualStatus === 'ATTENTION' ? 'heartbeat-fast 0.8s infinite ease-in-out' :
               'heartbeat-irregular 2s infinite ease-in-out'
  }}
/>
```

E adicione os keyframes no `globals.css`:

```css
@keyframes heartbeat-slow {
  0% { transform: scale(1); }
  14% { transform: scale(1.3); }
  28% { transform: scale(1); }
  42% { transform: scale(1.3); }
  56% { transform: scale(1); }
  100% { transform: scale(1); }
}

@keyframes heartbeat-fast {
  0% { transform: scale(1); }
  10% { transform: scale(1.3); }
  20% { transform: scale(1); }
  30% { transform: scale(1.3); }
  40% { transform: scale(1); }
  100% { transform: scale(1); }
}

@keyframes heartbeat-irregular {
  0% { transform: scale(1); }
  5% { transform: scale(1.3); }
  10% { transform: scale(1); }
  20% { transform: scale(1.2); }
  30% { transform: scale(1); }
  60% { transform: scale(1.3); }
  70% { transform: scale(1); }
  100% { transform: scale(1); }
}

@keyframes ecg-move {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

---

### **SOLUÇÃO 4: Atualizar Tailwind Config (Garantir compatibilidade)**

**Arquivo:** `apps/web/tailwind.config.js`

Certifique-se de que está assim:

```js
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './features/**/*.{js,ts,jsx,tsx}', // ← ADICIONAR ESTA LINHA
  ],
  theme: {
    extend: {
      // ... suas cores ...
      keyframes: {
        // ... suas animações já estão corretas ...
      },
      animation: {
        'heartbeat-slow': 'heartbeat-slow 2s infinite ease-in-out',
        'heartbeat-fast': 'heartbeat-fast 0.8s infinite ease-in-out',
        'heartbeat-irregular': 'heartbeat-irregular 2s infinite ease-in-out',
        'ecg-move': 'ecg-move 4s linear infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), 
    require('@tailwindcss/typography')
  ],
}
```

---

## 📋 SUGESTÕES DE REFATORAÇÃO GERAL

### **1. Separar Lógica de Apresentação**

**Criar:** `apps/web/src/features/dashboard/hooks/use-heartbeat-state.ts`

```typescript
import { useFinancialSummary } from "@/hooks/use-financial-summary"

export function useHeartbeatState() {
  const { 
    liquidez, 
    invoicesTotal, 
    totalBalance, 
    healthStatus, 
    score, 
    runway,
    invoices,
    isLoading 
  } = useFinancialSummary()

  const realBalance = totalBalance !== undefined ? totalBalance : (liquidez - invoicesTotal)
  const overdueInvoices = invoices.filter(inv => inv.days_remaining < 0)

  const getMainInsight = () => {
    if (healthStatus === 'Excelente') return { 
      title: "Excelente. Seu coração financeiro bate forte.", 
      subtitle: "Você tem fôlego de sobra para investir e crescer." 
    }
    if (healthStatus === 'Estável') return { 
      title: "Estável. Seu coração financeiro bate no ritmo certo.", 
      subtitle: "Você tem fôlego real para manter seus planos e compromissos em dia." 
    }
    if (healthStatus === 'Atenção') return { 
      title: "Atenção ao ritmo do seu coração financeiro.", 
      subtitle: "O saldo é positivo, mas a margem é curta. Cuidado com novos gastos." 
    }
    return { 
      title: "Atenção: Arritmia Financeira detectada.", 
      subtitle: "A situação exige organização para recuperar o fôlego." 
    }
  }

  return {
    state: {
      totalBalance: realBalance,
      commitments: invoicesTotal,
      available: liquidez,
      status: healthStatus || 'Estável',
      score: score !== undefined ? score : 500,
      runwayMonths: runway !== undefined ? runway : 0,
      overdueCount: overdueInvoices.length
    },
    insight: getMainInsight(),
    isLoading
  }
}
```

**Usar no Dashboard:**

```tsx
import { useHeartbeatState } from "@/features/dashboard/hooks/use-heartbeat-state"

export function DashboardClient({ userData }: DashboardClientProps) {
  const { state, insight, isLoading } = useHeartbeatState()

  return (
    <HeartbeatCore 
      state={state}
      insight={insight}
      isLoading={isLoading}
    />
  )
}
```

---

### **2. Mover HeartbeatCore para Features**

**De:** `apps/web/components/heartbeat-core.tsx`  
**Para:** `apps/web/src/features/dashboard/components/heartbeat-core.tsx`

Isso mantém a organização modular.

---

### **3. Criar Componente de ECG Separado**

**Criar:** `apps/web/src/features/dashboard/components/ecg-background.tsx`

```tsx
"use client"

import { cn } from "@/lib/utils"

type HeartbeatStatus = 'STABLE' | 'ATTENTION' | 'ARRHYTHMIA' | 'CRITICAL'

interface EcgBackgroundProps {
  visualStatus: HeartbeatStatus
  className?: string
}

const STATUS_CONFIG = {
  STABLE: { color: 'text-wealth', duration: '4s' },
  ATTENTION: { color: 'text-risk', duration: '3s' },
  ARRHYTHMIA: { color: 'text-danger', duration: '2s' },
  CRITICAL: { color: 'text-danger', duration: '2s' }
}

export function EcgBackground({ visualStatus, className }: EcgBackgroundProps) {
  const config = STATUS_CONFIG[visualStatus]
  
  const pathNormal = "M0,50 L20,50 L30,50 L40,50 L50,45 L60,55 L70,50 L100,50 L110,50 L120,50 L130,20 L140,80 L150,50 L180,50 L190,50 L200,50 L210,40 L220,60 L230,50 L300,50"
  const pathIrregular = "M0,50 L10,50 L15,20 L20,80 L25,50 L40,50 L45,40 L50,60 L55,50 L70,50 L80,50 L85,10 L90,90 L95,50 L110,50 L120,50 L125,45 L130,55 L135,50 L300,50"

  const path = (visualStatus === 'CRITICAL' || visualStatus === 'ARRHYTHMIA') ? pathIrregular : pathNormal

  return (
    <div className={cn("absolute inset-0 z-0 pointer-events-none opacity-[0.07] overflow-hidden flex items-center", className)}>
      <div className="flex animate-ecg-move w-[200%]" style={{ animationDuration: config.duration }}>
        <svg viewBox="0 0 300 100" className={cn("w-1/2 h-32", config.color)} preserveAspectRatio="none">
          <path d={path} vectorEffect="non-scaling-stroke" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <svg viewBox="0 0 300 100" className={cn("w-1/2 h-32", config.color)} preserveAspectRatio="none">
          <path d={path} vectorEffect="non-scaling-stroke" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-card via-transparent to-card" />
    </div>
  )
}
```

---

### **4. Adicionar Testes de Animação**

**Criar:** `apps/web/src/features/dashboard/components/__tests__/heartbeat-core.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import { HeartbeatCore } from '../heartbeat-core'

describe('HeartbeatCore', () => {
  it('should render with STABLE status', () => {
    const state = {
      totalBalance: 10000,
      commitments: 5000,
      available: 5000,
      status: 'Excelente',
      score: 800,
      runwayMonths: 12,
      overdueCount: 0
    }

    const insight = {
      title: "Excelente",
      subtitle: "Tudo certo"
    }

    render(<HeartbeatCore state={state} insight={insight} isLoading={false} />)
    
    expect(screen.getByText('Excelente')).toBeInTheDocument()
  })

  it('should apply correct animation class for CRITICAL status', () => {
    const state = {
      totalBalance: -1000,
      commitments: 5000,
      available: 0,
      status: 'Arritmia Financeira',
      score: 200,
      runwayMonths: 0,
      overdueCount: 3
    }

    const insight = {
      title: "Arritmia",
      subtitle: "Atenção"
    }

    const { container } = render(<HeartbeatCore state={state} insight={insight} isLoading={false} />)
    
    const heartIcon = container.querySelector('.animate-heartbeat-irregular')
    expect(heartIcon).toBeInTheDocument()
  })
})
```

---

## 🎯 CHECKLIST DE IMPLEMENTAÇÃO

### **Passo 1: Verificar Tooltip Provider**
- [ ] Adicionar `TooltipProvider` no layout protegido
- [ ] Verificar se o componente `tooltip.tsx` existe em `components/ui/`

### **Passo 2: Testar Animação**
- [ ] Abrir o dashboard no navegador
- [ ] Verificar se o coração está batendo
- [ ] Testar com diferentes status (Excelente, Atenção, Arritmia)

### **Passo 3: Fallback CSS (se necessário)**
- [ ] Se a animação não funcionar, adicionar CSS inline
- [ ] Adicionar keyframes no `globals.css`

### **Passo 4: Refatoração (Opcional)**
- [ ] Mover `HeartbeatCore` para `src/features/dashboard/components/`
- [ ] Criar hook `use-heartbeat-state.ts`
- [ ] Separar `EcgBackground` em componente próprio

### **Passo 5: Testes**
- [ ] Criar testes unitários
- [ ] Testar responsividade
- [ ] Validar acessibilidade

---

## 🐛 DEBUG: Como testar se a animação está funcionando

### **1. Inspecionar Elemento**
Abra o DevTools e inspecione o ícone do coração:

```html
<svg class="w-10 h-10 fill-current transform-gpu origin-center text-wealth animate-heartbeat-slow">
  ...
</svg>
```

**Verificar:**
- ✅ Classe `animate-heartbeat-slow` está aplicada?
- ✅ Computed styles mostram a animação?

### **2. Console do Navegador**
Execute no console:

```javascript
const heart = document.querySelector('.animate-heartbeat-slow')
console.log(getComputedStyle(heart).animation)
// Deve mostrar: heartbeat-slow 2s infinite ease-in-out
```

### **3. Forçar Animação Manualmente**
No console:

```javascript
const heart = document.querySelector('svg[class*="heartbeat"]')
heart.style.animation = 'heartbeat-slow 2s infinite ease-in-out'
```

Se funcionar, o problema é com o Tailwind. Se não funcionar, o problema é com os keyframes.

---

## 📊 RESULTADO ESPERADO

Após implementar as soluções:

1. **Coração batendo** - Animação suave e contínua
2. **ECG animado** - Linha de eletrocardiograma se movendo
3. **Cores dinâmicas** - Verde (saudável), Amarelo (atenção), Vermelho (crítico)
4. **Tooltips funcionando** - Informações ao passar o mouse
5. **Responsivo** - Funciona em mobile e desktop

---

## 🚀 PRÓXIMOS PASSOS

1. **Implementar SOLUÇÃO 1** (TooltipProvider)
2. **Testar no navegador**
3. **Se não funcionar, implementar SOLUÇÃO 3** (CSS inline)
4. **Refatorar conforme sugestões**
5. **Adicionar testes**

---

**Última Atualização:** 21/12/2025 01:37  
**Status:** 🟡 Aguardando implementação  
**Prioridade:** 🔴 Alta (Feature visual importante)
