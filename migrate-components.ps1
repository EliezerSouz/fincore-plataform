# Script de Migração de Componentes - Fase 2
# Move componentes para nova estrutura e atualiza imports

param(
    [string]$Module = "",  # Módulo específico ou vazio para todos
    [switch]$DryRun = $false,
    [switch]$UpdateImports = $false
)

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "     MIGRACAO DE COMPONENTES - FINCORE" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "MODO DRY-RUN: Apenas simulacao`n" -ForegroundColor Yellow
}

$webPath = "apps\web"

# Mapeamento de componentes (baseado no plano gerado)
$migrations = @{
    "accounts"     = @(
        @{ From = "components\accounts\account-card.tsx"; To = "features\accounts\components\account-card.tsx" },
        @{ From = "components\accounts\balance-adjustment-dialog.tsx"; To = "features\accounts\components\balance-adjustment-dialog.tsx" },
        @{ From = "components\accounts\balance-adjustment-history.tsx"; To = "features\accounts\components\balance-adjustment-history.tsx" },
        @{ From = "components\accounts\consolidated-balance-card.tsx"; To = "features\accounts\components\consolidated-balance-card.tsx" },
        @{ From = "components\accounts\create-account-dialog.tsx"; To = "features\accounts\components\create-account-dialog.tsx" },
        @{ From = "components\accounts\edit-account-dialog.tsx"; To = "features\accounts\components\edit-account-dialog.tsx" }
    )
    "transactions" = @(
        @{ From = "components\transactions\create-transaction-dialog.tsx"; To = "features\transactions\components\create-transaction-dialog.tsx" },
        @{ From = "components\transactions\delete-transaction-button.tsx"; To = "features\transactions\components\delete-transaction-button.tsx" },
        @{ From = "components\transactions\edit-transaction-dialog.tsx"; To = "features\transactions\components\edit-transaction-dialog.tsx" },
        @{ From = "components\transactions\transaction-actions.tsx"; To = "features\transactions\components\transaction-actions.tsx" },
        @{ From = "components\transactions\transaction-balance-card.tsx"; To = "features\transactions\components\transaction-balance-card.tsx" },
        @{ From = "components\transactions\transaction-type-detector.tsx"; To = "features\transactions\components\transaction-type-detector.tsx" },
        @{ From = "components\transactions\transactions-filters.tsx"; To = "features\transactions\components\transactions-filters.tsx" },
        @{ From = "components\transactions\transactions-row.tsx"; To = "features\transactions\components\transactions-row.tsx" },
        @{ From = "components\transactions\transactions-table.tsx"; To = "features\transactions\components\transactions-table.tsx" }
    )
}

# Função para mover um componente
function Move-Component {
    param($fromPath, $toPath, $moduleName)
    
    $fullFrom = Join-Path $webPath $fromPath
    $fullTo = Join-Path $webPath $toPath
    
    if (-not (Test-Path $fullFrom)) {
        Write-Host "  AVISO: Arquivo nao encontrado: $fromPath" -ForegroundColor Yellow
        return $false
    }
    
    if ($DryRun) {
        Write-Host "  [DRY-RUN] Moveria: $fromPath" -ForegroundColor Gray
        Write-Host "            Para: $toPath" -ForegroundColor Gray
        return $true
    }
    
    try {
        # Criar diretório de destino se não existir
        $destDir = Split-Path $fullTo -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        # Copiar arquivo (não mover ainda, para segurança)
        Copy-Item -Path $fullFrom -Destination $fullTo -Force
        
        Write-Host "  OK: $($fromPath.Split('\')[-1])" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "  ERRO: $fromPath" -ForegroundColor Red
        Write-Host "    $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Executar migração
if ($Module -eq "") {
    Write-Host "Modulos disponiveis:" -ForegroundColor Cyan
    foreach ($mod in $migrations.Keys | Sort-Object) {
        $count = $migrations[$mod].Count
        Write-Host "  - $mod ($count componentes)" -ForegroundColor White
    }
    Write-Host "`nUse: .\migrate-components.ps1 -Module <nome>`n" -ForegroundColor Yellow
    exit 0
}

if (-not $migrations.ContainsKey($Module)) {
    Write-Host "Modulo '$Module' nao encontrado!" -ForegroundColor Red
    Write-Host "Modulos disponiveis: $($migrations.Keys -join ', ')" -ForegroundColor Yellow
    exit 1
}

Write-Host "Migrando modulo: $Module" -ForegroundColor Cyan
Write-Host "Componentes: $($migrations[$Module].Count)`n" -ForegroundColor White

$successCount = 0
$errorCount = 0
$notFoundCount = 0

foreach ($migration in $migrations[$Module]) {
    $result = Move-Component -fromPath $migration.From -toPath $migration.To -moduleName $Module
    
    if ($result) {
        $successCount++
    }
    else {
        if (Test-Path (Join-Path $webPath $migration.From)) {
            $errorCount++
        }
        else {
            $notFoundCount++
        }
    }
}

Write-Host "`n================================================================" -ForegroundColor Gray
Write-Host "Migracao do modulo '$Module' concluida!" -ForegroundColor Green
Write-Host "  Sucesso: $successCount" -ForegroundColor Green
if ($errorCount -gt 0) {
    Write-Host "  Erros: $errorCount" -ForegroundColor Red
}
if ($notFoundCount -gt 0) {
    Write-Host "  Nao encontrados: $notFoundCount" -ForegroundColor Yellow
}
Write-Host "================================================================`n" -ForegroundColor Gray

if (-not $DryRun -and $successCount -gt 0) {
    Write-Host "IMPORTANTE:" -ForegroundColor Yellow
    Write-Host "1. Os arquivos foram COPIADOS (nao movidos)" -ForegroundColor White
    Write-Host "2. Arquivos originais ainda existem" -ForegroundColor White
    Write-Host "3. Teste a aplicacao antes de deletar originais" -ForegroundColor White
    Write-Host "4. Atualize os imports manualmente ou use -UpdateImports`n" -ForegroundColor White
}

if ($DryRun) {
    Write-Host "Execute sem -DryRun para realizar a migracao" -ForegroundColor Yellow
}

Write-Host ""
