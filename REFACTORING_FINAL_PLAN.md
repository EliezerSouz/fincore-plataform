# 📋 PLANO FINAL DE REFATORAÇÃO - FASE 2

## 🎯 OBJETIVO
Finalizar a reorganização da estrutura do projeto para 100%

---

## 📊 STATUS ATUAL: 40%

### ✅ Módulos Concluídos (4)
1. ✅ **accounts** - 6 componentes
2. ✅ **transactions** - 11 componentes  
3. ✅ **cards** - 2 componentes
4. ✅ **payables** - 2 componentes

**Total migrado**: 21 componentes

---

## 🚀 FASES RESTANTES (60%)

### FASE 3: Componentes UI Compartilhados (30%)
**Destino**: `apps/web/src/components/ui/`

**Componentes a manter em `/components/ui/`** (já estão no local correto):
- ✅ alert.tsx
- ✅ alert-dialog.tsx
- ✅ avatar.tsx
- ✅ avatar-upload.tsx
- ✅ badge.tsx
- ✅ breadcrumb.tsx
- ✅ button.tsx
- ✅ calendar.tsx
- ✅ card.tsx
- ✅ chart.tsx
- ✅ create-button.tsx
- ✅ date-range-filter.tsx
- ✅ delete-dialog.tsx
- ✅ dialog.tsx
- ✅ dropdown-menu.tsx
- ✅ input.tsx
- ✅ label.tsx
- ✅ page-header.tsx
- ✅ password-input.tsx
- ✅ popover.tsx
- ✅ progress.tsx
- ✅ radio-group.tsx
- ✅ select.tsx
- ✅ separator.tsx
- ✅ sheet.tsx
- ✅ sidebar.tsx
- ✅ skeleton.tsx
- ✅ switch.tsx
- ✅ table.tsx
- ✅ tabs.tsx
- ✅ tooltip.tsx
- ✅ upsell-modal.tsx

**Ação**: Mover de `apps/web/components/ui/` para `apps/web/src/components/ui/`

**Estimativa**: 15 minutos

---

### FASE 4: Componentes de Layout (10%)
**Destino**: `apps/web/src/components/layout/`

**Componentes**:
- app-sidebar.tsx
- user-dropdown.tsx

**Ação**: Criar pasta `layout` e mover componentes

**Estimativa**: 5 minutos

---

### FASE 5: Componentes de Negócio (10%)
**Destino**: `apps/web/src/features/`

#### 5.1 Categories
**Destino**: `apps/web/src/features/categories/components/`
- category-list.tsx

#### 5.2 Accounts (adicional)
**Destino**: `apps/web/src/features/accounts/components/`
- convert-period-dialog.tsx
- pay-invoice-dialog.tsx (mover para cards)

**Estimativa**: 10 minutos

---

### FASE 6: Limpeza de Duplicados (10%)
**Ação**: Deletar componentes antigos em `apps/web/components/`

**Diretórios a remover**:
- `apps/web/components/accounts/` (duplicados)
- `apps/web/components/transactions/` (duplicados, se existirem)
- `apps/web/components/categories/` (após migração)

**Estimativa**: 5 minutos

---

## 📝 PLANO DE EXECUÇÃO

### Etapa 1: Mover Componentes UI (CRÍTICO)
```powershell
# Criar diretório de destino
New-Item -ItemType Directory -Path "apps\web\src\components\ui" -Force

# Mover todos os componentes UI
robocopy "apps\web\components\ui" "apps\web\src\components\ui" /E /MOVE
```

**Impacto**: ALTO - Muitos imports precisarão ser atualizados
**Prioridade**: MÁXIMA

---

### Etapa 2: Mover Componentes de Layout
```powershell
# Criar diretório
New-Item -ItemType Directory -Path "apps\web\src\components\layout" -Force

# Mover componentes
Move-Item "apps\web\components\app-sidebar.tsx" "apps\web\src\components\layout\"
Move-Item "apps\web\components\user-dropdown.tsx" "apps\web\src\components\layout\"
```

**Impacto**: MÉDIO
**Prioridade**: ALTA

---

### Etapa 3: Mover Componentes de Negócio
```powershell
# Categories
New-Item -ItemType Directory -Path "apps\web\src\features\categories\components" -Force
Move-Item "apps\web\components\categories\category-list.tsx" "apps\web\src\features\categories\components\"

# Accounts (adicional)
Move-Item "apps\web\components\accounts\convert-period-dialog.tsx" "apps\web\src\features\accounts\components\"

# Cards (pay-invoice-dialog já existe, verificar duplicação)
```

**Impacto**: BAIXO
**Prioridade**: MÉDIA

---

### Etapa 4: Atualizar Imports
**Ferramenta**: Script PowerShell ou busca/substituição manual

**Principais mudanças**:
```tsx
// ANTES
import { Button } from "@/components/ui/button"

// DEPOIS
import { Button } from "@/components/ui/button"
// (Sem mudança, pois @/components já aponta para src/components)
```

**IMPORTANTE**: Verificar se o alias `@/components` aponta para `apps/web/src/components`

**Impacto**: CRÍTICO
**Prioridade**: MÁXIMA

---

### Etapa 5: Limpar Duplicados
```powershell
# ATENÇÃO: Executar APENAS após testes completos!

# Remover diretórios antigos
Remove-Item "apps\web\components\accounts" -Recurse -Force
Remove-Item "apps\web\components\categories" -Recurse -Force
Remove-Item "apps\web\components\ui" -Recurse -Force

# Remover arquivos soltos
Remove-Item "apps\web\components\app-sidebar.tsx" -Force
Remove-Item "apps\web\components\user-dropdown.tsx" -Force
```

**Impacto**: BAIXO (se tudo estiver funcionando)
**Prioridade**: BAIXA

---

## ⚠️ RISCOS E MITIGAÇÕES

### Risco 1: Imports quebrados
**Mitigação**: 
- Fazer backup antes de cada etapa
- Testar compilação após cada mudança
- Usar busca global para encontrar todos os imports

### Risco 2: Componentes UI já em src/components/ui
**Mitigação**:
- Verificar se `apps/web/src/components/ui` já existe
- Se existir, fazer merge ao invés de mover

### Risco 3: Alias @/components não configurado
**Mitigação**:
- Verificar `tsconfig.json`
- Ajustar paths se necessário

---

## 🎯 ESTRUTURA FINAL ESPERADA

```
apps/web/
├── src/
│   ├── components/
│   │   ├── ui/              (32 componentes UI)
│   │   └── layout/          (2 componentes)
│   └── features/
│       ├── accounts/
│       │   └── components/  (8 componentes)
│       ├── cards/
│       │   └── components/  (3 componentes)
│       ├── categories/
│       │   └── components/  (1 componente)
│       ├── payables/
│       │   └── components/  (2 componentes)
│       └── transactions/
│           └── components/  (11 componentes)
└── components/              (VAZIO - para deletar)
```

---

## ✅ CHECKLIST DE FINALIZAÇÃO

### Antes de Começar
- [ ] Criar backup completo
- [ ] Verificar se frontend está rodando
- [ ] Verificar se não há erros de compilação

### Durante a Execução
- [ ] Etapa 1: Mover componentes UI
- [ ] Etapa 2: Mover componentes de layout
- [ ] Etapa 3: Mover componentes de negócio
- [ ] Etapa 4: Atualizar imports
- [ ] Testar compilação
- [ ] Testar funcionalidades principais

### Após Conclusão
- [ ] Etapa 5: Limpar duplicados
- [ ] Commit e push
- [ ] Atualizar documentação
- [ ] Marcar refatoração como 100% completa

---

## ⏱️ TEMPO ESTIMADO TOTAL

- **Etapa 1**: 15 minutos
- **Etapa 2**: 5 minutos
- **Etapa 3**: 10 minutos
- **Etapa 4**: 20 minutos (atualizar imports)
- **Etapa 5**: 5 minutos
- **Testes**: 15 minutos

**TOTAL**: ~70 minutos (1h10min)

---

## 🚨 DECISÃO CRÍTICA

**IMPORTANTE**: Verificar se `apps/web/src/components/ui` já existe!

Se SIM: Os componentes UI já estão no local correto, apenas precisamos:
1. Deletar `apps/web/components/ui`
2. Atualizar imports que ainda apontam para o local antigo

Se NÃO: Precisamos mover os componentes conforme o plano.

**Vamos verificar agora!**
