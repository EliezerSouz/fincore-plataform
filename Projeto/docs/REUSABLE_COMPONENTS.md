# Biblioteca de Componentes Reutilizáveis

Este documento lista os componentes globais criados e padronizados durante a refatoração do projeto FinCore, visando padronização visual, acessibilidade (44px target) e manutenção facilitada.

## Componentes UI Globais

### 1. BaseModal
**Caminho:** `src/components/ui/base-modal.tsx`
**Responsabilidade:** Container de diálogo responsivo que atua como `Dialog` (modal centralizado) em Desktop e `Sheet` (gaveta inferior) em Mobile.
**Props Principais:**
- `open`, `onOpenChange`: Controle de estado.
- `title`, `description`: Cabeçalho padrão.
- `primaryButton`, `secondaryButton`: Configuração de botões de ação padronizados.
- `children`: Conteúdo do modal.
**Uso:** Use para qualquer interação que exija foco exclusivo (formulários, confirmações). Substitui `Dialog` e `Sheet` isolados.

### 2. SwitchTile
**Caminho:** `src/components/ui/switch-tile.tsx`
**Responsabilidade:** Checkbox/Toggle com visual de "tile" (cartão clicável), ideal para configurações booleanas em listas.
**Props Principais:**
- `checked`, `onCheckedChange`: Controle de estado.
- `title`, `description`: Texto explicativo.
- `icon`: Ícone opcional.
**Uso:** Configurações de usuário, filtros booleanos. Garante área de toque de 44px.

### 3. DataTableWrapper
**Caminho:** `src/components/ui/data-table-wrapper.tsx`
**Responsabilidade:** Container padronizado para tabelas de dados, gerenciando estados de carregamento e estado vazio.
**Props Principais:**
- `isLoading`: Mostra skeleton loader.
- `isEmpty`: Mostra estado vazio ilustrado.
- `children`: A tabela em si.
**Uso:** Envolver qualquer listagem de dados (transações, contas, categorias).

## Componentes de Domínio (Financeiro)

### 4. FinancialTransactionForm
**Caminho:** `src/features/transactions/components/financial-transaction-form.tsx`
**Responsabilidade:** Formulário unificado para criar/editar transações (Receita, Despesa, Transferência). Gerencia validação, máscaras e estados condicionais.
**Props Principais:**
- `mode`: 'create' | 'edit'.
- `initialData`: Dados para edição.
- `onSubmit`: Handler de submissão.
**Uso:** Único ponto de entrada para dados de transação.

### 5. TransactionsFilters
**Caminho:** `src/features/transactions/components/transactions-filters.tsx`
**Responsabilidade:** Barra de filtros para listagens de transações.
**Padronização:** Garante altura de 44px (`h-11`) para todos os selects e botões de ação em dispositivos móveis.

## Helpers e Utilitários

### 6. toTransactionFormData
**Caminho:** `src/features/transactions/utils/form-data.ts`
**Responsabilidade:** Converte o objeto de dados do formulário (`FinancialTransactionFormData`) para `FormData` compatível com as Server Actions.
**Detalhes:** Centraliza a lógica de mapeamento de campos (snake_case vs camelCase, lógica de parcelamento, campos retroativos), evitando duplicação nos dialogs de criação e edição.
