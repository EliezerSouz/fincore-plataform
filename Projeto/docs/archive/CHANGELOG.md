# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-12-19
### Adicionado
- **Inteligência Financeira (IA)**: Integração com Groq LLM (Llama 3.3) para geração de insights financeiros contextuais.
- **Análise Contextual**: Novo modal de IA na tela de transações que analisa o período filtrado pelo usuário.
- **Backend Aggregator**: Módulo em Go para agregação de dados financeiros antes do processamento pela IA, garantindo privacidade e precisão.
- **Design de Insights**: Cards visuais estilizados para alertas, oportunidades e ações sugeridas pela IA.

### Alterado
- **Padronização de Dados**: Agora todos os nomes de Contas, Categorias e Subcategorias são salvos automaticamente em **CAIXA ALTA** para consistência de interface e banco.
- **Performance de Insights**: Otimização do envio de dados para a IA (limite aumentado para 5.000 transações por análise).
- **Estruturação de Variáveis**: Migração de configurações sensíveis (Groq API Key) para o `.env` do backend.

### Corrigido
- Filtro de Contas que retornava vazio em cenários de contas inativas.
- Erro de renderização no modal de IA ao receber objetos estruturados.
- Exclusão de transferências internas da análise de gastos reais.


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
