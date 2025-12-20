# Script de Análise Completa do Projeto
# Gera relatório detalhado para refatoração segura

Write-Host "=== ANÁLISE COMPLETA DO PROJETO FINCORE ===" -ForegroundColor Cyan
Write-Host ""

$reportPath = "REFACTORING_ANALYSIS_REPORT.md"
$report = @"
# 📊 Relatório de Análise - Projeto FINCORE
**Data**: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")

---

## 1. ESTRUTURA DE MIGRATIONS

### Locais Identificados:
"@

# Analisar migrations
Write-Host "Analisando migrations..." -ForegroundColor Yellow

$migrationLocations = @(
    "supabase\migrations_backup",
    "backend\migrations",
    "apps\web\supabase\migrations"
)

foreach ($location in $migrationLocations) {
    $fullPath = Join-Path $PWD $location
    if (Test-Path $fullPath) {
        $files = Get-ChildItem -Path $fullPath -Filter "*.sql" -ErrorAction SilentlyContinue
        $count = ($files | Measure-Object).Count
        
        $report += @"

#### 📁 $location
- **Arquivos**: $count migrations
- **Padrão de nomenclatura**: 
"@
        
        if ($files) {
            $report += "`n``````"
            foreach ($file in $files | Select-Object -First 5) {
                $report += "`n$($file.Name)"
            }
            if ($count -gt 5) {
                $report += "`n... e mais $($count - 5) arquivos"
            }
            $report += "`n``````"
        }
    }
}

$report += @"


---

## 2. ESTRUTURA DE PASTAS (apps/web)

"@

# Analisar estrutura do web
Write-Host "Analisando estrutura do projeto web..." -ForegroundColor Yellow

$webPath = "apps\web"
$folders = @("app", "components", "hooks", "lib", "services", "utils", "src")

foreach ($folder in $folders) {
    $fullPath = Join-Path $webPath $folder
    if (Test-Path $fullPath) {
        $items = Get-ChildItem -Path $fullPath -Recurse -File -ErrorAction SilentlyContinue
        $count = ($items | Measure-Object).Count
        $tsxCount = ($items | Where-Object { $_.Extension -eq ".tsx" } | Measure-Object).Count
        $tsCount = ($items | Where-Object { $_.Extension -eq ".ts" } | Measure-Object).Count
        
        $report += @"

### 📂 $folder/
- **Total de arquivos**: $count
- **TypeScript (.ts)**: $tsCount
- **React (.tsx)**: $tsxCount

"@
    }
}

$report += @"


---

## 3. DUPLICAÇÕES POTENCIAIS

"@

Write-Host "Identificando possíveis duplicações..." -ForegroundColor Yellow

# Procurar por nomes comuns duplicados
$commonNames = @("utils", "helpers", "types", "constants", "config")
foreach ($name in $commonNames) {
    $files = Get-ChildItem -Path "apps\web" -Recurse -Filter "*$name*" -File -ErrorAction SilentlyContinue
    if ($files) {
        $report += "`n### Arquivos com '$name' no nome:"
        $report += "`n``````"
        foreach ($file in $files | Select-Object -First 10) {
            $relativePath = $file.FullName.Replace($PWD, ".")
            $report += "`n$relativePath"
        }
        $report += "`n``````"
        $report += "`n"
    }
}

$report += @"


---

## 4. BACKEND (Golang)

"@

Write-Host "Analisando backend..." -ForegroundColor Yellow

$backendPath = "backend"
if (Test-Path $backendPath) {
    $goFiles = Get-ChildItem -Path $backendPath -Recurse -Filter "*.go" -ErrorAction SilentlyContinue
    $count = ($goFiles | Measure-Object).Count
    
    $report += @"

- **Arquivos Go**: $count
- **Estrutura**:
``````
"@
    
    $dirs = Get-ChildItem -Path $backendPath -Directory -ErrorAction SilentlyContinue
    foreach ($dir in $dirs) {
        $report += "`n$($dir.Name)/"
    }
    
    $report += @"

``````

"@
}

$report += @"


---

## 5. MOBILE (React Native)

"@

Write-Host "Analisando mobile..." -ForegroundColor Yellow

$mobilePath = "apps\mobile"
if (Test-Path $mobilePath) {
    $mobileFiles = Get-ChildItem -Path $mobilePath -Recurse -File -ErrorAction SilentlyContinue
    $count = ($mobileFiles | Measure-Object).Count
    
    $report += @"

- **Total de arquivos**: $count
- **Status**: $(if ($count -gt 20) { "Em desenvolvimento" } else { "Estrutura inicial" })

"@
}

$report += @"


---

## 6. ARQUIVOS DE CONFIGURAÇÃO

"@

Write-Host "Analisando configurações..." -ForegroundColor Yellow

$configFiles = @(
    "package.json",
    "tsconfig.json",
    "next.config.ts",
    "tailwind.config.js",
    "turbo.json"
)

foreach ($file in $configFiles) {
    $fullPath = Join-Path "apps\web" $file
    if (Test-Path $fullPath) {
        $report += "`n- ✅ $file"
    }
    else {
        $report += "`n- ❌ $file (não encontrado)"
    }
}

$report += @"


---

## 7. DOCUMENTAÇÃO EXISTENTE

"@

Write-Host "Verificando documentação..." -ForegroundColor Yellow

$docs = Get-ChildItem -Path "." -Filter "*.md" -Recurse -ErrorAction SilentlyContinue | 
Where-Object { $_.DirectoryName -notlike "*node_modules*" } |
Select-Object -First 20

$report += "`n``````"
foreach ($doc in $docs) {
    $relativePath = $doc.FullName.Replace($PWD, ".")
    $report += "`n$relativePath"
}
$report += "`n``````"

$report += @"


---

## 8. RECOMENDAÇÕES INICIAIS

### 🎯 Prioridade ALTA
1. **Consolidar migrations** em uma única pasta com nomenclatura padronizada
2. **Remover duplicações** de utils/helpers
3. **Organizar types** em local centralizado
4. **Padronizar imports** absolutos vs relativos

### 🔧 Prioridade MÉDIA
1. Separar lógica de negócio de componentes UI
2. Criar camada de services consistente
3. Organizar hooks por domínio
4. Centralizar constantes e configurações

### 📚 Prioridade BAIXA
1. Documentar arquitetura final
2. Criar guia de contribuição
3. Padronizar nomenclatura de componentes

---

## 9. PRÓXIMOS PASSOS SUGERIDOS

1. ✅ **BACKUP COMPLETO** (já realizado)
2. 🔄 **Consolidar Migrations** (CRÍTICO)
3. 🧹 **Limpar arquivos não utilizados**
4. 📁 **Reorganizar estrutura de pastas**
5. 🔗 **Atualizar imports**
6. ✅ **Validar funcionalidades**
7. 📝 **Documentar mudanças**

---

**Gerado automaticamente em**: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")
"@

# Salvar relatório
Set-Content -Path $reportPath -Value $report -Encoding UTF8

Write-Host ""
Write-Host "✅ Relatório gerado: $reportPath" -ForegroundColor Green
Write-Host ""
Write-Host "Abrindo relatório..." -ForegroundColor Cyan

# Abrir no editor padrão
Invoke-Item $reportPath
