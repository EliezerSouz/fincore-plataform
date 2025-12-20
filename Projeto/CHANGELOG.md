# Changelog

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.1.0] - 2025-12-19

### Adicionado
- **Backend Go**: Implementação completa de microsserviço em Go seguindo Clean Architecture (Handler -> Service -> Repository).
- **ApiClient**: Nova camada de comunicação frontend-backend (`api-client.ts`) com suporte a JWT e tratamento de erros centralizado.
- **Lançamento Retroativo**: Funcionalidade de lançamento parcelado retroativo na criação de transações de cartão de crédito.
- **Formatação de Datas**: Componente `DatePicker` com máscara automática (DD/MM/YYYY), validação em tempo real e feedback visual.
- **Git Workflow**: Documentação oficial de fluxo de trabalho, versionamento e padrões de commit (`docs/standards/GIT_WORKFLOW.md`).

### Alterado
- **UX - Tela de Categorias**: Novo layout responsivo com visualização em Grade/Lista, barra de pesquisa e seção dedicada para categorias arquivadas.
- **UX - Lançamentos**: Reorganização dos tipos de lançamento (Despesa | Receita | Transferência | Cartões) e melhorias de legibilidade no modal.
- **Performance**: Substituição massiva de `window.location.reload()` por `router.refresh()` do Next.js para eliminar flickering e recarregamentos desnecessários.
- **Clean Code**: Remoção de dependências legadas `@financeiro/core` em favor de implementações locais tipadas.

### Corrigido
- Correção de atualização de saldo no mini-gráfico após exclusão, edição ou duplicação de transações.
- Correção de conflitos de rota na API Go (`:card_id` vs `:id`).
- Correção de erro `ECONNREFUSED` ao iniciar serviços localmente.
- Correção de bugs visuais em inputs de moeda e data.
- Correção na lógica de exibição de subcategorias inativas.

## [1.0.0] - 2024-05-20

### Adicionado
- Lançamento inicial do sistema FinCore.
- Módulo de Contas (Criar, Editar, Excluir, Listar).
- Módulo de Transações (Receitas, Despesas, Transferências).
- Módulo de Cartões de Crédito.
- Módulo de Categorias e Subcategorias.
- Autenticação e Autorização via JWT.
- Dashboard com resumo financeiro.

### Segurança
- Implementação de middleware de autenticação no Backend (Go).
- Proteção de rotas privadas no Frontend (Next.js).
