# Padrão de Versionamento e Fluxo de Trabalho - FinCore

Este documento define os padrões oficiais de versionamento, branches e commits para o projeto FinCore Platform. O objetivo é garantir um histórico limpo, rastreável e profissional.

## 1. Versionamento Semântico (SemVer)

O projeto segue estritamente o padrão [SemVer 2.0.0](https://semver.org/).
Formato: `MAJOR.MINOR.PATCH` (Ex: `1.2.4`)

- **MAJOR**: Alterações incompatíveis na API ou quebras de contrato.
- **MINOR**: Novas funcionalidades adicionadas de forma retrocompatível.
- **PATCH**: Correções de bugs retrocompatíveis.

## 2. Estratégia de Branches

Utilizamos nomes de branches estritamente em **Português (PT-BR)**.

### Branches Principais
| Branch | Descrição | Regras |
| :--- | :--- | :--- |
| `main` | **Produção**. Código estável. | Protegida. Apenas Merge via PR. |
| `desenvolvimento` | **Integração**. Base de trabalho. | Protegida. Base para novas features. |

### Branches de Trabalho
| Tipo | Prefixo | Exemplo | Uso |
| :--- | :--- | :--- | :--- |
| **Funcionalidade** | `funcionalidade/` | `funcionalidade/login-biometria` | Novas features ou melhorias visíveis. |
| **Correção** | `correcao/` | `correcao/erro-calculo-taxa` | Bugs encontrados em desenvolvimento. |
| **Emergência** | `emergencia/` | `emergencia/fix-prod-travado` | Bugs críticos em **Produção** (Hotfix). |
| **Melhoria** | `melhoria/` | `melhoria/refatoracao-auth` | Refatoração técnica, limpeza de código. |
| **Experimento** | `experimento/` | `experimento/poc-nova-ui` | Testes de conceito (POCs). |

## 3. Padrão de Commits (Conventional Commits)

As mensagens de commit devem seguir o padrão Conventional Commits, mas escritas em **PT-BR**.

**Estrutura:**
`tipo(escopo): descrição no imperativo`

**Tipos Aceitos:**
- `feat`: Nova funcionalidade para o usuário.
- `fix`: Correção de um bug.
- `docs`: Alterações na documentação.
- `style`: Formatação, falta de ponto e vírgula, etc (sem mudança de código de produção).
- `refactor`: Refatoração de código de produção (ex: renomear variável).
- `perf`: Mudança de código que melhora o desempenho.
- `test`: Adicionar testes ou corrigir testes existentes.
- `chore`: Atualização de tarefas de build, gerenciador de pacotes, etc.

**Exemplos Corretos:**
```text
feat(cartoes): adiciona limite dinâmico por categoria
fix(api): corrige erro 500 ao listar transações vazias
docs(readme): atualiza instruções de instalação
style(ui): padroniza cores dos botões de ação
refactor(auth): migra verificação de token para middleware
perf(db): adiciona índice na tabela de logs
chore(deps): atualiza dependência do react-query
```

## 4. Fluxo de Trabalho Completo

### Passo 1: Criar Branch
Sempre crie a partir de `desenvolvimento` (exceto `emergencia` que sai da `main`).
```bash
git checkout desenvolvimento
git pull origin desenvolvimento
git checkout -b funcionalidade/minha-nova-feature
```

### Passo 2: Commitar
Faça commits pequenos e frequentes seguindo o padrão acima.

### Passo 3: Pull Request (PR)
1. Envie a branch: `git push origin funcionalidade/minha-nova-feature`
2. Abra o PR para `desenvolvimento`.
3. Preencha a descrição do PR detalhando o que foi feito.

### Passo 4: Revisão e Merge
1. Aguarde a aprovação de pelo menos 1 revisor.
2. Realize o **Squash and Merge** (para condensar os commits da feature em um só no histórico da branch principal).

### Passo 5: Release (Líder/DevOps)
1. Merge de `desenvolvimento` em `main`.
2. Criar Tag: `git tag v1.0.0`.
3. Atualizar `CHANGELOG.md`.
