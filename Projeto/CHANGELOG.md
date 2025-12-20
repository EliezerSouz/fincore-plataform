# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Não Publicado]

### Adicionado
- Nova estrutura de pastas do projeto (`Projeto/`).
- Documentação de fluxo de trabalho Git (`docs/standards/GIT_WORKFLOW.md`).
- Funcionalidade de Lançamento Retroativo em Transações.
- Filtros de categorias ativas/inativas na criação de transações.
- Nova tela de gerenciamento de Categorias com separação visual de inativas.
- Componente `EditCategorySheet` para edição moderna de categorias.

### Alterado
- Refatoração completa da estrutura do repositório para monorepo híbrido.
- Melhoria na performance da lista de categorias (remoção de reload).
- Ajuste no formulário de transação para ocultar parcelas em modo retroativo.

### Corrigido
- Correção de bug onde categorias inativas apareciam na seleção.
- Correção de conflito de rotas no Backend Go.

---
## [0.1.0] - 2024-01-01
### Adicionado
- Versão inicial do projeto.
- Estrutura básica de Backend (Go) e Frontend (Next.js).
- Autenticação via Supabase.
