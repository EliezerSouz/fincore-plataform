# Plano de Migracao - Fase 2
**Gerado em**: 17/12/2025 19:20:06

---

## Resumo

- **Total de componentes**: 77
- **Modulos identificados**: 6

---

## Mapeamento por Modulo

### accounts (6 componentes)

Estrutura alvo:
```features/accounts/
  components/
  hooks/
  services/
  types/
```n
Componentes a mover:
- `components\accounts\account-card.tsx` -> `features/accounts/components/account-card.tsx`
- `components\accounts\balance-adjustment-dialog.tsx` -> `features/accounts/components/balance-adjustment-dialog.tsx`
- `components\accounts\balance-adjustment-history.tsx` -> `features/accounts/components/balance-adjustment-history.tsx`
- `components\accounts\consolidated-balance-card.tsx` -> `features/accounts/components/consolidated-balance-card.tsx`
- `components\accounts\create-account-dialog.tsx` -> `features/accounts/components/create-account-dialog.tsx`
- `components\accounts\edit-account-dialog.tsx` -> `features/accounts/components/edit-account-dialog.tsx`

### cards (5 componentes)

Estrutura alvo:
```features/cards/
  components/
  hooks/
  services/
  types/
```n
Componentes a mover:
- `components\summary-card.tsx` -> `features/cards/components/summary-card.tsx`
- `components\accounts\pay-invoice-dialog.tsx` -> `features/cards/components/pay-invoice-dialog.tsx`
- `components\transactions\invoice-details-modal.tsx` -> `features/cards/components/invoice-details-modal.tsx`
- `components\transactions\invoice-link-icon.tsx` -> `features/cards/components/invoice-link-icon.tsx`
- `components\ui\card.tsx` -> `features/cards/components/card.tsx`

### payables (3 componentes)

Estrutura alvo:
```features/payables/
  components/
  hooks/
  services/
  types/
```n
Componentes a mover:
- `components\payable-status-filter.tsx` -> `features/payables/components/payable-status-filter.tsx`
- `components\transactions\payable-details-modal.tsx` -> `features/payables/components/payable-details-modal.tsx`
- `components\transactions\payable-link-icon.tsx` -> `features/payables/components/payable-link-icon.tsx`

### reports (3 componentes)

Estrutura alvo:
```features/reports/
  components/
  hooks/
  services/
  types/
```n
Componentes a mover:
- `components\overview-chart.tsx` -> `features/reports/components/overview-chart.tsx`
- `components\dashboard\overview-chart.tsx` -> `features/reports/components/overview-chart.tsx`
- `components\ui\chart.tsx` -> `features/reports/components/chart.tsx`

### shared (51 componentes)

Estrutura alvo:
```features/shared/
  components/
  hooks/
  services/
  types/
```n
Componentes a mover:
- `components\app-sidebar.tsx` -> `features/shared/components/app-sidebar.tsx`
- `components\core-initializer.tsx` -> `features/shared/components/core-initializer.tsx`
- `components\filter-bar.tsx` -> `features/shared/components/filter-bar.tsx`
- `components\free-plan-alerts.tsx` -> `features/shared/components/free-plan-alerts.tsx`
- `components\inline-insight.tsx` -> `features/shared/components/inline-insight.tsx`
- `components\insights-panel.tsx` -> `features/shared/components/insights-panel.tsx`
- `components\logo.tsx` -> `features/shared/components/logo.tsx`
- `components\mode-toggle.tsx` -> `features/shared/components/mode-toggle.tsx`
- `components\onboarding-modal.tsx` -> `features/shared/components/onboarding-modal.tsx`
- `components\page-layout.tsx` -> `features/shared/components/page-layout.tsx`
- `components\page-watermark.tsx` -> `features/shared/components/page-watermark.tsx`
- `components\premium-passive-tip.tsx` -> `features/shared/components/premium-passive-tip.tsx`
- `components\theme-provider.tsx` -> `features/shared/components/theme-provider.tsx`
- `components\top-bar.tsx` -> `features/shared/components/top-bar.tsx`
- `components\user-dropdown.tsx` -> `features/shared/components/user-dropdown.tsx`
- `components\accounts\convert-period-dialog.tsx` -> `features/shared/components/convert-period-dialog.tsx`
- `components\categories\category-list.tsx` -> `features/shared/components/category-list.tsx`
- `components\categories\create-category-dialog.tsx` -> `features/shared/components/create-category-dialog.tsx`
- `components\categories\edit-category-dialog.tsx` -> `features/shared/components/edit-category-dialog.tsx`
- `components\finance\unified-payment-dialog.tsx` -> `features/shared/components/unified-payment-dialog.tsx`
- `components\transactions\brand-icon.tsx` -> `features/shared/components/brand-icon.tsx`
- `components\ui\alert-dialog.tsx` -> `features/shared/components/alert-dialog.tsx`
- `components\ui\alert.tsx` -> `features/shared/components/alert.tsx`
- `components\ui\avatar-upload.tsx` -> `features/shared/components/avatar-upload.tsx`
- `components\ui\avatar.tsx` -> `features/shared/components/avatar.tsx`
- `components\ui\badge.tsx` -> `features/shared/components/badge.tsx`
- `components\ui\breadcrumb.tsx` -> `features/shared/components/breadcrumb.tsx`
- `components\ui\button.tsx` -> `features/shared/components/button.tsx`
- `components\ui\calendar.tsx` -> `features/shared/components/calendar.tsx`
- `components\ui\create-button.tsx` -> `features/shared/components/create-button.tsx`
- `components\ui\date-range-filter.tsx` -> `features/shared/components/date-range-filter.tsx`
- `components\ui\delete-dialog.tsx` -> `features/shared/components/delete-dialog.tsx`
- `components\ui\dialog.tsx` -> `features/shared/components/dialog.tsx`
- `components\ui\dropdown-menu.tsx` -> `features/shared/components/dropdown-menu.tsx`
- `components\ui\input.tsx` -> `features/shared/components/input.tsx`
- `components\ui\label.tsx` -> `features/shared/components/label.tsx`
- `components\ui\page-header.tsx` -> `features/shared/components/page-header.tsx`
- `components\ui\password-input.tsx` -> `features/shared/components/password-input.tsx`
- `components\ui\popover.tsx` -> `features/shared/components/popover.tsx`
- `components\ui\progress.tsx` -> `features/shared/components/progress.tsx`
- `components\ui\radio-group.tsx` -> `features/shared/components/radio-group.tsx`
- `components\ui\select.tsx` -> `features/shared/components/select.tsx`
- `components\ui\separator.tsx` -> `features/shared/components/separator.tsx`
- `components\ui\sheet.tsx` -> `features/shared/components/sheet.tsx`
- `components\ui\sidebar.tsx` -> `features/shared/components/sidebar.tsx`
- `components\ui\skeleton.tsx` -> `features/shared/components/skeleton.tsx`
- `components\ui\switch.tsx` -> `features/shared/components/switch.tsx`
- `components\ui\table.tsx` -> `features/shared/components/table.tsx`
- `components\ui\tabs.tsx` -> `features/shared/components/tabs.tsx`
- `components\ui\tooltip.tsx` -> `features/shared/components/tooltip.tsx`
- `components\ui\upsell-modal.tsx` -> `features/shared/components/upsell-modal.tsx`

### transactions (9 componentes)

Estrutura alvo:
```features/transactions/
  components/
  hooks/
  services/
  types/
```n
Componentes a mover:
- `components\transactions\create-transaction-dialog.tsx` -> `features/transactions/components/create-transaction-dialog.tsx`
- `components\transactions\delete-transaction-button.tsx` -> `features/transactions/components/delete-transaction-button.tsx`
- `components\transactions\edit-transaction-dialog.tsx` -> `features/transactions/components/edit-transaction-dialog.tsx`
- `components\transactions\transaction-actions.tsx` -> `features/transactions/components/transaction-actions.tsx`
- `components\transactions\transaction-balance-card.tsx` -> `features/transactions/components/transaction-balance-card.tsx`
- `components\transactions\transaction-type-detector.tsx` -> `features/transactions/components/transaction-type-detector.tsx`
- `components\transactions\transactions-filters.tsx` -> `features/transactions/components/transactions-filters.tsx`
- `components\transactions\transactions-row.tsx` -> `features/transactions/components/transactions-row.tsx`
- `components\transactions\transactions-table.tsx` -> `features/transactions/components/transactions-table.tsx`

---

## Ordem de Execucao Recomendada

1. **shared** - Componentes genericos (UI, layout, etc.)
2. **auth** - Autenticacao
3. **accounts** - Contas
4. **transactions** - Transacoes
5. **cards** - Cartoes de credito
6. **payables** - Contas a pagar
7. **reports** - Relatorios
8. **dashboard** - Dashboard

---

## Proximos Passos

1. Revisar este plano
2. Executar migracao modulo por modulo
3. Atualizar imports apos cada modulo
4. Testar funcionalidades
5. Commit incremental

