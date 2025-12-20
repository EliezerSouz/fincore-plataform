# Script de Atualização de Imports - Fase 2
# Atualiza imports para apontar para nova estrutura

param(
    [string]$Module = "",
    [switch]$DryRun = $false
)

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "     ATUALIZACAO DE IMPORTS - FINCORE" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "MODO DRY-RUN: Apenas simulacao`n" -ForegroundColor Yellow
}

$webPath = "apps\web"

# Mapeamento de imports antigos -> novos
$importMappings = @{
    "accounts" = @{
        "@/components/accounts/account-card" = "@/features/accounts/components/account-card"
        "@/components/accounts/balance-adjustment-dialog" = "@/features/accounts/components/balance-adjustment-dialog"
        "@/components/accounts/balance-adjustment-history" = "@/features/accounts/components/balance-adjustment-history"
        "@/components/accounts/consolidated-balance-card" = "@/features/accounts/components/consolidated-balance-card"
        "@/components/accounts/create-account-dialog" = "@/features/accounts/components/create-account-dialog"
        "@/components/accounts/edit-account-dialog" = "@/features/accounts/components/edit-account-dialog"
    }
    "transactions" = @{
        "@/components/transactions/create-transaction-dialog" = "@/features/transactions/components/create-transaction-dialog"
        "@/components/transactions/delete-transaction-button" = "@/features/transactions/components/delete-transaction-button"
        "@/components/transactions/edit-transaction-dialog" = "@/features/transactions/components/edit-transaction-dialog"
        "@/components/transactions/transaction-actions" = "@/features/transactions/components/transaction-actions"
        "@/components/transactions/transaction-balance-card" = "@/features/transactions/components/transaction-balance-card"
        "@/components/transactions/transaction-type-detector" = "@/features/transactions/components/transaction-type-detector"
        "@/components/transactions/transactions-filters" = "@/features/transactions/components/transactions-filters"
        "@/components/transactions/transactions-row" = "@/features/transactions/components/transactions-row"
        "@/components/transactions/transactions-table" = "@/features/transactions/components/transactions-table"
    }
}

# Função para atualizar imports em um arquivo
function Update-ImportsInFile {
    param($filePath, $mappings)
    
    if (-not (Test-Path $filePath)) {
        return @{ Changed = $false; Count = 0 }
    }
    
    $content = Get-Content $filePath -Raw -Encoding UTF8
    $originalContent = $content
    $changeCount = 0
    
    foreach ($oldImport in $mappings.Keys) {
        $newImport = $mappings[$oldImport]
        
        # Padrões de import para detectar
        $patterns = @(
            "from ['""]$oldImport['""]",
            "from ['""]$oldImport\.tsx['""]",
            "import\(['""]$oldImport['""]",
            "import\(['""]$oldImport\.tsx['""]"
        )
        
        foreach ($pattern in $patterns) {
            if ($content -match $pattern) {
                $content = $content -replace [regex]::Escape($oldImport), $newImport
                $changeCount++
            }
        }
    }
    
    if ($content -ne $originalContent) {
        if (-not $DryRun) {
            Set-Content -Path $filePath -Value $content -Encoding UTF8 -NoNewline
        }
        return @{ Changed = $true; Count = $changeCount }
    }
    
    return @{ Changed = $false; Count = 0 }
}

# Função para processar todos os arquivos
function Process-AllFiles {
    param($moduleName, $mappings)
    
    Write-Host "Processando modulo: $moduleName`n" -ForegroundColor Cyan
    
    # Buscar todos os arquivos TypeScript/TSX
    $files = Get-ChildItem -Path $webPath -Include "*.ts","*.tsx" -Recurse -File | 
        Where-Object { $_.FullName -notmatch "node_modules|\.next|\.turbo|dist|build" }
    
    $totalFiles = $files.Count
    $changedFiles = 0
    $totalChanges = 0
    
    Write-Host "Analisando $totalFiles arquivos...`n" -ForegroundColor White
    
    foreach ($file in $files) {
        $result = Update-ImportsInFile -filePath $file.FullName -mappings $mappings
        
        if ($result.Changed) {
            $changedFiles++
            $totalChanges += $result.Count
            $relativePath = $file.FullName.Replace("$PWD\$webPath\", "")
            
            if ($DryRun) {
                Write-Host "  [DRY-RUN] Atualizaria: $relativePath ($($result.Count) imports)" -ForegroundColor Gray
            } else {
                Write-Host "  OK: $relativePath ($($result.Count) imports)" -ForegroundColor Green
            }
        }
    }
    
    return @{
        TotalFiles = $totalFiles
        ChangedFiles = $changedFiles
        TotalChanges = $totalChanges
    }
}

# Executar
if ($Module -eq "") {
    Write-Host "Modulos disponiveis:" -ForegroundColor Cyan
    foreach ($mod in $importMappings.Keys | Sort-Object) {
        $count = $importMappings[$mod].Count
        Write-Host "  - $mod ($count imports)" -ForegroundColor White
    }
    Write-Host "`nUse: .\update-imports.ps1 -Module <nome>`n" -ForegroundColor Yellow
    exit 0
}

if (-not $importMappings.ContainsKey($Module)) {
    Write-Host "Modulo '$Module' nao encontrado!" -ForegroundColor Red
    Write-Host "Modulos disponiveis: $($importMappings.Keys -join ', ')" -ForegroundColor Yellow
    exit 1
}

$result = Process-AllFiles -moduleName $Module -mappings $importMappings[$Module]

Write-Host "`n================================================================" -ForegroundColor Gray
Write-Host "Atualizacao de imports concluida!" -ForegroundColor Green
Write-Host "  Arquivos analisados: $($result.TotalFiles)" -ForegroundColor White
Write-Host "  Arquivos modificados: $($result.ChangedFiles)" -ForegroundColor Green
Write-Host "  Total de imports atualizados: $($result.TotalChanges)" -ForegroundColor Green
Write-Host "================================================================`n" -ForegroundColor Gray

if ($DryRun) {
    Write-Host "Execute sem -DryRun para aplicar as mudancas" -ForegroundColor Yellow
} else {
    Write-Host "IMPORTANTE: Teste a aplicacao agora!" -ForegroundColor Yellow
    Write-Host "  1. Verifique se compila sem erros" -ForegroundColor White
    Write-Host "  2. Teste as funcionalidades do modulo $Module" -ForegroundColor White
    Write-Host "  3. Se tudo OK, delete os arquivos antigos`n" -ForegroundColor White
}

Write-Host ""
