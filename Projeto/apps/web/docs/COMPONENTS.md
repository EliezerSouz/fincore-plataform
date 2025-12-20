# Documentação de Componentes Reutilizáveis (FinCore)

Este documento descreve os componentes reutilizáveis criados e padronizados para garantir consistência visual, acessibilidade (touch target 44px) e facilidade de manutenção.

## 1. SwitchTile (`src/components/ui/switch-tile.tsx`)
**Responsabilidade:** Exibir um interruptor (toggle) com título, descrição e ícone opcional, formatado como um "azulejo" (tile) clicável.
**Props:**
- `checked`: boolean (estado atual)
- `onCheckedChange`: function (callback de alteração)
- `label`: string (título)
- `description`: string (texto de apoio)
- `icon`: LucideIcon (opcional)
- `iconClassName`: string (estilos para o ícone)
- `disabled`: boolean
**Uso:** Configurações, preferências, formulários onde uma opção binária precisa de contexto visual.
**Não usar:** Quando precisar apenas do switch simples sem layout (use `Switch` direto).

## 2. BaseModal (`src/components/ui/base-modal.tsx`)
**Responsabilidade:** Fornecer um container modal responsivo que se comporta como `Dialog` (centralizado) no Desktop e `Sheet` (gaveta inferior) no Mobile.
**Props:**
- `open`: boolean
- `onOpenChange`: function
- `title`: ReactNode (título do modal)
- `description`: string (subtítulo/instrução)
- `children`: ReactNode (conteúdo)
- `primaryButton`: objeto (configuração do botão principal: label, onClick/form, isLoading, etc.)
- `secondaryButton`: objeto (configuração do botão secundário: label, onClick)
- `maxWidth`: string (largura máxima no desktop)
**Uso:** Todas as interações modais do sistema (criação, edição, confirmação).
**Padronização:** Garante que botões de ação estejam sempre acessíveis e com tamanho adequado (44px).

## 3. FinancialTransactionForm (`src/features/transactions/components/financial-transaction-form.tsx`)
**Responsabilidade:** Formulário unificado para criar e editar transações financeiras (Receita, Despesa, Transferência, Compra no Crédito).
**Props:**
- `mode`: 'create' | 'edit'
- `initialData`: objeto (dados para edição)
- `onSubmit`: function (handler de submissão)
- `onCancel`: function
- `isLoading`: boolean
- `showTypeSelector`: boolean (se pode alterar o tipo de transação)
- `showAccountSelector`: boolean
- `showPaymentMethodSelector`: boolean
**Uso:** Em modais de criação/edição de transações (`CreateTransactionDialog`, `EditTransactionDialog`).
**Destaque:** Gerencia lógica complexa de parcelamento, lançamentos retroativos e validações de categorias/subcategorias.

## 4. Switch (`src/components/ui/switch.tsx`)
**Responsabilidade:** Componente atômico de interruptor (baseado no Radix UI).
**Props:** Padrão do Radix UI Switch.
**Uso:** Base para `SwitchTile` ou em locais onde apenas o controle é necessário.

## 5. Input / Select / Button (Padronização)
**Regra Global:** Todos os elementos interativos (inputs, selects, buttons) devem ter altura mínima de **44px** (`h-11`) para conformidade com diretrizes de acessibilidade touch.
**Implementação:**
- Inputs/Selects: `className="h-11"`
- Buttons: `className="h-11"` (ou uso de `BaseModal` que já padroniza os botões de ação).

## Diretrizes de Cores e Estilos
- **Design Tokens:** Centralizados em `app/globals.css`.
- **Cores Semânticas:**
  - Receita: `emerald-600` (texto), `emerald-100` (fundo leve)
  - Despesa: `red-600` (texto), `red-100` (fundo leve)
  - Transferência: `blue-600` (texto), `blue-100` (fundo leve)
- **Bordas:** `rounded-xl` para cards e containers maiores, `rounded-lg` para elementos internos.
