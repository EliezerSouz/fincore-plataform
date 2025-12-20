---
description: Profissional Git Strategy & Conventional Commits
---

A partir de agora, todo o desenvolvimento deve seguir o **GitHub Flow** e **Conventional Commits**.

## Estratégia de Branches
- **main**: Sempre estável (produção).
- **feature/nome-curto**: Novas funcionalidades.
- **fix/nome-curto**: Correção de bugs.
- **refactor/nome-curto**: Refatoração.
- **chore/nome-curto**: Configurações e dependências.

## Fluxo de Trabalho
1. **Atualizar main**:
   ```powershell
   git checkout main
   git pull origin main
   ```
2. **Criar branch de trabalho**:
   ```powershell
   git checkout -b feature/minha-feature
   ```
3. **Trabalhar e realizar commits atômicos**:
   ```powershell
   git add .
   git commit -m "tipo(escopo): descrição clara"
   ```
4. **Finalizar e Merge**:
   ```powershell
   git checkout main
   git merge feature/minha-feature
   git push origin main
   ```
5. **Remover branch local**:
   ```powershell
   git branch -d feature/minha-feature
   ```

## Conventional Commits
Padrao: `<tipo>(escopo): descrição clara e objetiva`

- **feat**: Nova funcionalidade.
- **fix**: Correção de bug.
- **refactor**: Refatoração.
- **chore**: Configurações/Deps.
- **docs**: Documentação.
- **test**: Testes.

## Versionamento e Changelog
- Seguir **SemVer** (MAJOR.MINOR.PATCH).
- Manter o arquivo `CHANGELOG.md` atualizado em cada release ou mudança significativa.
- Utilizar git tags para versões: `git tag -a v1.0.0 -m "mensagem"`.
