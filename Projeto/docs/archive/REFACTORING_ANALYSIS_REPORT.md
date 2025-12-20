# ðŸ“Š RelatÃ³rio de AnÃ¡lise - Projeto FINCORE
**Data**: 17/12/2025 19:04:20

---

## 1. ESTRUTURA DE MIGRATIONS

### Locais Identificados:
#### ðŸ“ supabase\migrations_backup
- **Arquivos**: 16 migrations
- **PadrÃ£o de nomenclatura**: 
```
001_create_users_table.sql
002_fix_permissions.sql
003_create_accounts_table.sql
004_create_categories_table.sql
005_create_transactions_table.sql
... e mais 11 arquivos
```
#### ðŸ“ backend\migrations
- **Arquivos**: 14 migrations
- **PadrÃ£o de nomenclatura**: 
```
20251214204500_create_promo_codes.sql
20251214213000_add_subscription_dates.sql
20251214214500_add_billing_cycle.sql
20251214215000_add_premium_ia_enum.sql
20251214215500_force_recreate_enum.sql
... e mais 9 arquivos
```
#### ðŸ“ apps\web\supabase\migrations
- **Arquivos**: 59 migrations
- **PadrÃ£o de nomenclatura**: 
```
001_create_users_table.sql
002_fix_permissions.sql
003_create_accounts_table.sql
004_create_transactions_table.sql
005_update_account_types.sql
... e mais 54 arquivos
```

---

## 2. ESTRUTURA DE PASTAS (apps/web)

### ðŸ“‚ app/
- **Total de arquivos**: 54
- **TypeScript (.ts)**: 17
- **React (.tsx)**: 35

### ðŸ“‚ components/
- **Total de arquivos**: 77
- **TypeScript (.ts)**: 0
- **React (.tsx)**: 77

### ðŸ“‚ hooks/
- **Total de arquivos**: 9
- **TypeScript (.ts)**: 9
- **React (.tsx)**: 0

### ðŸ“‚ lib/
- **Total de arquivos**: 8
- **TypeScript (.ts)**: 8
- **React (.tsx)**: 0

### ðŸ“‚ services/
- **Total de arquivos**: 2
- **TypeScript (.ts)**: 2
- **React (.tsx)**: 0

### ðŸ“‚ utils/
- **Total de arquivos**: 4
- **TypeScript (.ts)**: 4
- **React (.tsx)**: 0

### ðŸ“‚ src/
- **Total de arquivos**: 15
- **TypeScript (.ts)**: 15
- **React (.tsx)**: 0


---

## 3. DUPLICAÃ‡Ã•ES POTENCIAIS

### Arquivos com 'utils' no nome:
```
.\apps\web\.next\dev\server\chunks\ssr\apps_web_utils_supabase_client_ts_c866e3c4._.js
.\apps\web\.next\dev\server\chunks\ssr\apps_web_utils_supabase_client_ts_c866e3c4._.js.map
.\apps\web\.next\dev\static\chunks\apps_web_utils_supabase_client_ts_53c92678._.js
.\apps\web\.next\dev\static\chunks\apps_web_utils_supabase_client_ts_53c92678._.js.map
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\build\preview-key-utils.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\build\utils.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\build\static-paths\utils.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\build\webpack\utils.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\build\webpack\config\utils.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\build\webpack\loaders\utils.js
```

### Arquivos com 'helpers' no nome:
```
.\apps\web\.next\dev\static\chunks\5bcb1_@swc_helpers_cjs_50725933._.js
.\apps\web\.next\dev\static\chunks\5bcb1_@swc_helpers_cjs_50725933._.js.map
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\build\swc\helpers.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\build\templates\helpers.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\build\turborepo-access-trace\helpers.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\build\webpack\config\helpers.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\client\flight-data-helpers.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\server\base-http\helpers.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\server\stream-utils\uint8array-helpers.js
.\apps\web\node_modules\@google\generative-ai\dist\server\src\methods\chat-session-helpers.d.ts
```

### Arquivos com 'types' no nome:
```
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\build\static-paths\types.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\build\swc\types.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\build\turborepo-access-trace\types.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\build\webpack\loaders\metadata\types.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\client\components\router-reducer\router-reducer-types.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\client\components\segment-cache\types.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\lib\page-types.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\lib\verify-typescript-setup.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\lib\metadata\types\alternative-urls-types.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\lib\metadata\types\extra-types.js
```

### Arquivos com 'constants' no nome:
```
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\lib\constants.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\lib\framework\boundary-constants.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\lib\metadata\constants.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\server\lib\trace\constants.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\server\use-cache\constants.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\shared\lib\constants.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\shared\lib\entry-constants.js
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\shared\lib\errors\constants.js
.\apps\web\.next\standalone\apps\web\node_modules\semver\internal\constants.js
.\apps\web\node_modules\@anthropic-ai\sdk\internal\constants.d.mts
```

### Arquivos com 'config' no nome:
```
.\apps\web\eslint.config.mjs
.\apps\web\next.config.ts
.\apps\web\postcss.config.mjs
.\apps\web\tailwind.config.js
.\apps\web\tsconfig.json
.\apps\web\tsconfig.tsbuildinfo
.\apps\web\.next\dev\cache\next-devtools-config.json
.\apps\web\.next\server\functions-config-manifest.json
.\apps\web\.next\standalone\apps\web\.next\server\functions-config-manifest.json
.\apps\web\.next\standalone\apps\web\node_modules\next\dist\build\get-babel-config-file.js
```


---

## 4. BACKEND (Golang)

- **Arquivos Go**: 22
- **Estrutura**:
```
cmd/
internal/
migrations/
tmp/
```


---

## 5. MOBILE (React Native)

- **Total de arquivos**: 41
- **Status**: Em desenvolvimento


---

## 6. ARQUIVOS DE CONFIGURAÃ‡ÃƒO

- âœ… package.json
- âœ… tsconfig.json
- âœ… next.config.ts
- âœ… tailwind.config.js
- âŒ turbo.json (nÃ£o encontrado)

---

## 7. DOCUMENTAÃ‡ÃƒO EXISTENTE

```
.\IMPLEMENTACAO_SALDO_INICIAL.md
.\LEIA-ME_MIGRATIONS.md
.\Prompt_IA.md
.\README.md
.\SETUP_DATABASE.md
.\apps\web\AI_PROMPTS_BACKUP.md
.\apps\web\AI_RESPONSE_LOG.md
.\apps\web\README.md
.\apps\web\docs\AI_INSIGHTS_SETUP.md
.\apps\web\docs\INSIGHTS_SYSTEM.md
.\apps\web\docs\SESSION_INSIGHTS_AI.md
.\apps\web\docs\SUPABASE_ACCESS_RULES.md
.\apps\web\supabase\migrations\MIGRATIONS_ORDER.md
.\backend\README.md
.\docs\ARCHITECTURE_DIAGRAMS.md
.\docs\ARCHITECTURE_MAP.md
.\docs\ARCHITECTURE_REFACTORING_PLAN.md
.\docs\BACKEND_ARCHITECTURE_ANALYSIS.md
.\docs\BACKEND_IMPLEMENTATION_PLAN.md
.\docs\BALANCE_ADJUSTMENTS.md
```

---

## 8. RECOMENDAÃ‡Ã•ES INICIAIS

### ðŸŽ¯ Prioridade ALTA
1. **Consolidar migrations** em uma Ãºnica pasta com nomenclatura padronizada
2. **Remover duplicaÃ§Ãµes** de utils/helpers
3. **Organizar types** em local centralizado
4. **Padronizar imports** absolutos vs relativos

### ðŸ”§ Prioridade MÃ‰DIA
1. Separar lÃ³gica de negÃ³cio de componentes UI
2. Criar camada de services consistente
3. Organizar hooks por domÃ­nio
4. Centralizar constantes e configuraÃ§Ãµes

### ðŸ“š Prioridade BAIXA
1. Documentar arquitetura final
2. Criar guia de contribuiÃ§Ã£o
3. Padronizar nomenclatura de componentes

---

## 9. PRÃ“XIMOS PASSOS SUGERIDOS

1. âœ… **BACKUP COMPLETO** (jÃ¡ realizado)
2. ðŸ”„ **Consolidar Migrations** (CRÃTICO)
3. ðŸ§¹ **Limpar arquivos nÃ£o utilizados**
4. ðŸ“ **Reorganizar estrutura de pastas**
5. ðŸ”— **Atualizar imports**
6. âœ… **Validar funcionalidades**
7. ðŸ“ **Documentar mudanÃ§as**

---

**Gerado automaticamente em**: 17/12/2025 19:04:24
