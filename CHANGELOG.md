# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-12-19
### Adicionado
- Componente base `FinancialTransactionForm` para unificação de UI.
- Filtros dinâmicos de modalidades de pagamento baseados em flags do banco (`allows_income`, `allows_expense`, `allows_transfer`).
- Suporte a forma de pagamento em Contas a Pagar (`payables`).
- Documentação de arquitetura de transações financeiras.
- Migration SQL para vincular modalidades a contas a pagar.

### Alterado
- Refatoração completa do `CreateTransactionDialog`.
- Refatoração completa do `EditTransactionDialog` (Caixa).
- Refatoração completa do `EditPayableDialog` (Contas a Pagar).
- Refatoração completa do `EditCardTransactionDialog` (Faturas).
- Padronização visual (Labels em caixa alta, grid unificado, inputs de valor destacados).

### Corrigido
- Erro de fetching em payables causado por coluna inexistente.
- Inconsistência visual entre telas de criação e edição.
- Filtro de modalidades que não respeitava o tipo de transação selecionado.

## [1.0.0] - 2025-12-17
### Added
- Modular feature-based frontend architecture.
- Go backend API implementation.
- GitHub Flow strategy with Conventional Commits.
- Consolidated database migrations.
