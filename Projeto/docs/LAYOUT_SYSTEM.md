# 🎨 Sistema de Layout Padronizado

## 📦 Componentes Criados

### 1. `PageLayout` (`components/page-layout.tsx`)
Layout padrão para todas as páginas do sistema.

**Props:**
- `title` - Título da página
- `description` - Descrição/subtítulo
- `action` - Botão de ação (ex: "Novo Cartão")
- `summaryCards` - Cards de resumo (opcional)
- `children` - Conteúdo principal
- `icon` - Ícone para watermark de fundo
- `className` - Classes CSS adicionais (opcional)

**Exemplo de uso:**
```tsx
<PageLayout
  title="Cartões de Crédito"
  description="Gerencie limites, faturas e controle seus gastos."
  action={<CreateCardDialog />}
  icon={CreditCard}
  summaryCards={<SummaryCardsGrid>...</SummaryCardsGrid>}
>
  {/* Conteúdo da página */}
</PageLayout>
```

---

### 2. `SummaryCard` (`components/summary-card.tsx`)
Card de resumo com variantes de cor.

**Props:**
- `title` - Título do card
- `subtitle` - Subtítulo (opcional)
- `value` - Valor principal (string ou ReactNode)
- `footer` - Texto de rodapé (opcional)
- `icon` - Ícone do Lucide
- `variant` - Variante de cor: `'default' | 'success' | 'warning' | 'danger' | 'info'`

**Variantes:**
- `default` - Cinza neutro
- `success` - Verde (positivo)
- `warning` - Amarelo/Laranja (atenção)
- `danger` - Vermelho (crítico)
- `info` - Azul (informativo)

**Exemplo:**
```tsx
<SummaryCard
  title="Limite Total"
  subtitle="Soma de todos os cartões"
  value={formatCurrency(totalLimit)}
  footer="3 cartões"
  icon={Wallet}
  variant="info"
/>
```

---

### 3. `SummaryCardsGrid`
Grid responsivo para os cards de resumo.

**Props:**
- `children` - Cards de resumo
- `columns` - Número de colunas: `2 | 3 | 4 | 5` (padrão: 4)

**Exemplo:**
```tsx
<SummaryCardsGrid columns={4}>
  <SummaryCard ... />
  <SummaryCard ... />
  <SummaryCard ... />
  <SummaryCard ... />
</SummaryCardsGrid>
```

---

## 🎯 Como Usar em Novas Páginas

### Estrutura Básica:

```tsx
import { PageLayout } from "@/components/page-layout"
import { SummaryCard, SummaryCardsGrid } from "@/components/summary-card"
import { IconName } from "lucide-react"

export default async function MyPage() {
  // 1. Buscar dados
  const data = await getData()
  
  // 2. Calcular resumos
  const total = calculateTotal(data)
  
  return (
    <PageLayout
      title="Minha Página"
      description="Descrição da página"
      action={<CreateButton />}
      icon={IconName}
      summaryCards={
        <SummaryCardsGrid columns={4}>
          <SummaryCard
            title="Total"
            value={formatCurrency(total)}
            icon={Wallet}
            variant="info"
          />
          {/* Mais cards... */}
        </SummaryCardsGrid>
      }
    >
      {/* Conteúdo principal */}
      <MyContent data={data} />
    </PageLayout>
  )
}
```

---

## 📋 Páginas Atualizadas

### ✅ Cartões de Crédito (`/compromissos/cards`)
- Usa `PageLayout`
- 4 `SummaryCard`: Limite Total, Disponível, Usado, Status
- Agrupamento por bandeira
- Watermark: ícone `CreditCard`

### 🔄 Para Atualizar: Contas (`/caixa/accounts`)

**Antes:**
```tsx
<div className="flex-1 space-y-8 p-8 pt-6...">
  <div className="flex items-center justify-between...">
    <h2>Minhas Contas</h2>
    <CreateAccountDialog />
  </div>
  {/* Cards de resumo manuais */}
  {/* Conteúdo */}
</div>
```

**Depois:**
```tsx
<PageLayout
  title="Minhas Contas"
  description="Gerencie seus saldos e fontes de recursos."
  action={<CreateAccountDialog />}
  icon={Wallet}
  summaryCards={
    <SummaryCardsGrid columns={5}>
      <SummaryCard
        title="Saldo Consolidado"
        value={formatCurrency(totalBalance)}
        icon={Wallet}
        variant="info"
      />
      {/* Outros cards por tipo... */}
    </SummaryCardsGrid>
  }
>
  {/* Conteúdo existente */}
</PageLayout>
```

---

## 🎨 Benefícios

1. **Consistência Visual**: Todas as páginas seguem o mesmo padrão
2. **Manutenção Fácil**: Mudanças no layout afetam todas as páginas
3. **Código Limpo**: Menos duplicação, mais reutilização
4. **Responsivo**: Grid automático para diferentes telas
5. **Acessível**: Estrutura semântica consistente

---

## 🚀 Próximas Páginas a Padronizar

- [ ] Contas Bancárias (`/caixa/accounts`)
- [ ] Transações (`/caixa/transactions`)
- [ ] Categorias (`/sistema/categories`)
- [ ] Visão Geral (`/visao-geral`)
- [ ] Faturas de Cartão (`/compromissos/cards/[id]`)

---

## 📝 Notas

- O `PageWatermark` já está integrado no `PageLayout`
- Todos os cards de resumo têm hover effect automático
- As variantes de cor são consistentes em todo o sistema
- O grid é responsivo: 1 coluna (mobile) → 2 (tablet) → 4-5 (desktop)

---

**Criado em:** 13/12/2024  
**Versão:** 1.0.0
