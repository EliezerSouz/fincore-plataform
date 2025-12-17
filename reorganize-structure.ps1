# Script de Reorganização de Estrutura - Fase 2
# Reorganiza o projeto em estrutura modular sem quebrar funcionalidades

param(
    [switch]$DryRun = $false,
    [string]$Module = "all"  # all, transactions, accounts, cards, etc.
)

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "     REORGANIZACAO DE ESTRUTURA - FINCORE (FASE 2)" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "MODO DRY-RUN: Apenas simulacao`n" -ForegroundColor Yellow
}

$webPath = "apps\web"

# Definir estrutura alvo
$targetStructure = @{
    "features" = @(
        "auth",
        "transactions", 
        "accounts",
        "cards",
        "invoices",
        "payables",
        "reports",
        "dashboard"
    )
    "shared"   = @(
        "components\ui",
        "components\layout",
        "components\feedback",
        "components\charts",
        "hooks",
        "lib\supabase",
        "lib\api",
        "lib\utils",
        "types",
        "constants"
    )
}

# Função para criar estrutura de pastas
function Create-TargetStructure {
    Write-Host "Criando estrutura de pastas alvo..." -ForegroundColor Cyan
    
    # Criar features/
    foreach ($feature in $targetStructure["features"]) {
        $featurePath = Join-Path $webPath "features\$feature"
        
        $subfolders = @("components", "hooks", "services", "types")
        foreach ($subfolder in $subfolders) {
            $fullPath = Join-Path $featurePath $subfolder
            
            if (-not $DryRun) {
                if (-not (Test-Path $fullPath)) {
                    New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
                    Write-Host "  Criado: features\$feature\$subfolder" -ForegroundColor Green
                }
            }
            else {
                Write-Host "  [DRY-RUN] Criaria: features\$feature\$subfolder" -ForegroundColor Gray
            }
        }
    }
    
    # Criar shared/
    foreach ($sharedPath in $targetStructure["shared"]) {
        $fullPath = Join-Path $webPath "shared\$sharedPath"
        
        if (-not $DryRun) {
            if (-not (Test-Path $fullPath)) {
                New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
                Write-Host "  Criado: shared\$sharedPath" -ForegroundColor Green
            }
        }
        else {
            Write-Host "  [DRY-RUN] Criaria: shared\$sharedPath" -ForegroundColor Gray
        }
    }
}

# Função para mapear componentes atuais
function Map-CurrentComponents {
    Write-Host "`nMapeando componentes atuais..." -ForegroundColor Cyan
    
    $componentsPath = Join-Path $webPath "components"
    $components = Get-ChildItem -Path $componentsPath -Filter "*.tsx" -Recurse -File
    
    $mapping = @{}
    
    foreach ($component in $components) {
        $name = $component.Name
        $relativePath = $component.FullName.Replace("$PWD\$webPath\", "")
        
        # Detectar módulo baseado no nome
        $module = "shared"  # default
        
        if ($name -match "transaction|Transaction") { $module = "transactions" }
        elseif ($name -match "account|Account|balance|Balance") { $module = "accounts" }
        elseif ($name -match "card|Card|invoice|Invoice") { $module = "cards" }
        elseif ($name -match "payable|Payable") { $module = "payables" }
        elseif ($name -match "report|Report|chart|Chart") { $module = "reports" }
        elseif ($name -match "dashboard|Dashboard") { $module = "dashboard" }
        elseif ($name -match "auth|Auth|login|Login|register|Register") { $module = "auth" }
        elseif ($name -match "button|input|dialog|card|alert|badge|select|checkbox") { $module = "shared" }
        
        if (-not $mapping.ContainsKey($module)) {
            $mapping[$module] = @()
        }
        
        $mapping[$module] += @{
            Name        = $name
            CurrentPath = $relativePath
            FullPath    = $component.FullName
        }
    }
    
    return $mapping
}

# Função para gerar relatório
function Generate-Report {
    param($mapping)
    
    Write-Host "`n================================================================" -ForegroundColor Gray
    Write-Host "RELATORIO DE MAPEAMENTO" -ForegroundColor Yellow
    Write-Host "================================================================`n" -ForegroundColor Gray
    
    foreach ($module in $mapping.Keys | Sort-Object) {
        $count = $mapping[$module].Count
        Write-Host "  $module : $count componentes" -ForegroundColor Cyan
        
        if ($count -le 5) {
            foreach ($comp in $mapping[$module]) {
                Write-Host "    - $($comp.Name)" -ForegroundColor Gray
            }
        }
        else {
            foreach ($comp in $mapping[$module] | Select-Object -First 3) {
                Write-Host "    - $($comp.Name)" -ForegroundColor Gray
            }
            Write-Host "    ... e mais $($count - 3) componentes" -ForegroundColor DarkGray
        }
        Write-Host ""
    }
    
    Write-Host "================================================================`n" -ForegroundColor Gray
}

# Função para gerar plano de migração
function Generate-MigrationPlan {
    param($mapping)
    
    $planPath = "MIGRATION_PLAN_PHASE2.md"
    
    $content = "# Plano de Migracao - Fase 2`n"
    $content += "**Gerado em**: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')`n`n"
    $content += "---`n`n"
    $content += "## Resumo`n`n"
    
    $totalComponents = 0
    foreach ($module in $mapping.Keys) {
        $totalComponents += $mapping[$module].Count
    }
    
    $content += "- **Total de componentes**: $totalComponents`n"
    $content += "- **Modulos identificados**: $($mapping.Keys.Count)`n`n"
    $content += "---`n`n"
    $content += "## Mapeamento por Modulo`n`n"
    
    foreach ($module in $mapping.Keys | Sort-Object) {
        $content += "### $module ($($mapping[$module].Count) componentes)`n`n"
        
        $content += "Estrutura alvo:`n"
        $content += "``````"
        $content += "features/$module/`n"
        $content += "  components/`n"
        $content += "  hooks/`n"
        $content += "  services/`n"
        $content += "  types/`n"
        $content += "``````n`n"
        
        $content += "Componentes a mover:`n"
        foreach ($comp in $mapping[$module]) {
            $content += "- ``$($comp.CurrentPath)`` -> ``features/$module/components/$($comp.Name)```n"
        }
        $content += "`n"
    }
    
    $content += "---`n`n"
    $content += "## Ordem de Execucao Recomendada`n`n"
    $content += "1. **shared** - Componentes genericos (UI, layout, etc.)`n"
    $content += "2. **auth** - Autenticacao`n"
    $content += "3. **accounts** - Contas`n"
    $content += "4. **transactions** - Transacoes`n"
    $content += "5. **cards** - Cartoes de credito`n"
    $content += "6. **payables** - Contas a pagar`n"
    $content += "7. **reports** - Relatorios`n"
    $content += "8. **dashboard** - Dashboard`n`n"
    $content += "---`n`n"
    $content += "## Proximos Passos`n`n"
    $content += "1. Revisar este plano`n"
    $content += "2. Executar migracao modulo por modulo`n"
    $content += "3. Atualizar imports apos cada modulo`n"
    $content += "4. Testar funcionalidades`n"
    $content += "5. Commit incremental`n"
    
    Set-Content -Path $planPath -Value $content -Encoding UTF8
    Write-Host "Plano de migracao gerado: $planPath" -ForegroundColor Green
}

# Executar
Write-Host "Iniciando analise...`n" -ForegroundColor Cyan

# Criar estrutura
Create-TargetStructure

# Mapear componentes
$mapping = Map-CurrentComponents

# Gerar relatório
Generate-Report -mapping $mapping

# Gerar plano
if (-not $DryRun) {
    Generate-MigrationPlan -mapping $mapping
}
else {
    Write-Host "Plano de migracao seria gerado (use sem -DryRun)" -ForegroundColor Yellow
}

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "Analise concluida!" -ForegroundColor Green
Write-Host "================================================================`n" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "Execute sem -DryRun para criar a estrutura" -ForegroundColor Yellow
}
else {
    Write-Host "Estrutura criada! Revise o plano em MIGRATION_PLAN_PHASE2.md" -ForegroundColor Green
}

Write-Host ""
