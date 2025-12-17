# Script de Consolidação Automática de Migrations
# Consolida todas as migrations em um único local com nomenclatura padronizada

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "     CONSOLIDACAO AUTOMATICA DE MIGRATIONS - FINCORE" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "MODO DRY-RUN: Apenas simulacao, nenhuma alteracao sera feita`n" -ForegroundColor Yellow
}

# Definir locais de origem
$migrationSources = @(
    @{
        Path        = "supabase\migrations_backup"
        Priority    = 1
        Description = "Migrations base (Supabase)"
    },
    @{
        Path        = "apps\web\supabase\migrations"
        Priority    = 2
        Description = "Migrations web (Features)"
    },
    @{
        Path        = "backend\migrations"
        Priority    = 3
        Description = "Migrations backend (Subscriptions)"
    }
)

# Definir destino
$destinationPath = "database\migrations"

# Criar estrutura de destino
if (-not $DryRun) {
    if (-not (Test-Path $destinationPath)) {
        New-Item -ItemType Directory -Path $destinationPath -Force | Out-Null
        Write-Host "Pasta de destino criada: $destinationPath" -ForegroundColor Green
    }
}

# Coletar todas as migrations
Write-Host "Coletando migrations de todos os locais...`n" -ForegroundColor Cyan

$allMigrations = @()
$totalFiles = 0

foreach ($source in $migrationSources) {
    $sourcePath = $source.Path
    
    if (Test-Path $sourcePath) {
        Write-Host "  $($source.Description)" -ForegroundColor White
        Write-Host "     Caminho: $sourcePath" -ForegroundColor Gray
        
        $files = Get-ChildItem -Path $sourcePath -Filter "*.sql" -File
        $count = ($files | Measure-Object).Count
        $totalFiles += $count
        
        Write-Host "     Encontrados: $count arquivos" -ForegroundColor Gray
        
        foreach ($file in $files) {
            $allMigrations += @{
                OriginalPath  = $file.FullName
                OriginalName  = $file.Name
                CreationTime  = $file.CreationTime
                LastWriteTime = $file.LastWriteTime
                Source        = $source.Description
                Priority      = $source.Priority
            }
        }
        
        Write-Host ""
    }
    else {
        Write-Host "  Pasta nao encontrada: $sourcePath" -ForegroundColor Yellow
        Write-Host ""
    }
}

Write-Host "================================================================" -ForegroundColor Gray
Write-Host "Total de migrations encontradas: $totalFiles" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Gray

# Ordenar por data de criação
Write-Host "Ordenando migrations cronologicamente..." -ForegroundColor Cyan
$sortedMigrations = $allMigrations | Sort-Object -Property CreationTime

# Gerar novos nomes
Write-Host "Gerando novos nomes padronizados...`n" -ForegroundColor Cyan

$renamedMigrations = @()
$counter = 1
$timestampCounter = @{}

foreach ($migration in $sortedMigrations) {
    # Extrair nome descritivo do arquivo original
    $originalName = $migration.OriginalName
    
    # Remover prefixos numéricos e timestamps existentes
    $cleanName = $originalName -replace '^\d+_', '' -replace '^(\d{14})_', ''
    $cleanName = $cleanName -replace '\.sql$', ''
    
    # Gerar timestamp baseado na data de criação
    $timestamp = $migration.CreationTime.ToString("yyyyMMddHHmmss")
    
    # Verificar se já existe esse timestamp e adicionar contador
    if ($timestampCounter.ContainsKey($timestamp)) {
        $timestampCounter[$timestamp]++
        $sequenceNum = $timestampCounter[$timestamp].ToString().PadLeft(2, '0')
        $newName = "${timestamp}_${sequenceNum}_${cleanName}.sql"
    }
    else {
        $timestampCounter[$timestamp] = 0
        $newName = "${timestamp}_${cleanName}.sql"
    }
    
    $renamedMigrations += @{
        Original  = $migration
        NewName   = $newName
        Timestamp = $timestamp
        Counter   = $counter
    }
    
    $counter++
}

# Exibir preview
Write-Host "PREVIEW DAS MUDANCAS:" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Gray
Write-Host ""

$previewCount = [Math]::Min(10, $renamedMigrations.Count)
for ($i = 0; $i -lt $previewCount; $i++) {
    $item = $renamedMigrations[$i]
    $num = $item.Counter.ToString().PadLeft(3, '0')
    
    Write-Host "  [$num] " -NoNewline -ForegroundColor Cyan
    Write-Host "$($item.Original.OriginalName)" -ForegroundColor Gray
    Write-Host "        -> " -NoNewline -ForegroundColor Yellow
    Write-Host "$($item.NewName)" -ForegroundColor Green
    $dateStr = $item.Original.CreationTime.ToString("dd/MM/yyyy HH:mm:ss")
    Write-Host "        Data: $dateStr" -ForegroundColor DarkGray
    Write-Host "        Origem: $($item.Original.Source)" -ForegroundColor DarkGray
    Write-Host ""
}

if ($renamedMigrations.Count -gt $previewCount) {
    Write-Host "  ... e mais $($renamedMigrations.Count - $previewCount) migrations`n" -ForegroundColor Gray
}

Write-Host "================================================================`n" -ForegroundColor Gray

# Confirmação
if (-not $DryRun -and -not $Force) {
    Write-Host "ATENCAO: Esta operacao ira:" -ForegroundColor Yellow
    Write-Host "   1. Copiar $($renamedMigrations.Count) migrations para $destinationPath" -ForegroundColor White
    Write-Host "   2. Renomear com padrao YYYYMMDDHHMMSS_nome.sql" -ForegroundColor White
    Write-Host "   3. Manter arquivos originais intactos (nao remove)" -ForegroundColor White
    Write-Host ""
    
    $confirmation = Read-Host "Deseja continuar? (S/N)"
    
    if ($confirmation -ne "S" -and $confirmation -ne "s") {
        Write-Host "`nOperacao cancelada pelo usuario" -ForegroundColor Red
        exit 0
    }
}

# Executar consolidação
if (-not $DryRun) {
    Write-Host "`nIniciando consolidacao..." -ForegroundColor Cyan
    Write-Host ""
    
    $successCount = 0
    $errorCount = 0
    
    foreach ($item in $renamedMigrations) {
        try {
            $destinationFile = Join-Path $destinationPath $item.NewName
            
            # Copiar arquivo
            Copy-Item -Path $item.Original.OriginalPath -Destination $destinationFile -Force
            
            # Preservar timestamps
            $file = Get-Item $destinationFile
            $file.CreationTime = $item.Original.CreationTime
            $file.LastWriteTime = $item.Original.LastWriteTime
            
            Write-Host "  OK: $($item.NewName)" -ForegroundColor Green
            $successCount++
        }
        catch {
            Write-Host "  ERRO ao processar: $($item.Original.OriginalName)" -ForegroundColor Red
            Write-Host "    $($_.Exception.Message)" -ForegroundColor Red
            $errorCount++
        }
    }
    
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Gray
    Write-Host "Consolidacao concluida!" -ForegroundColor Green
    Write-Host "   Sucesso: $successCount migrations" -ForegroundColor Green
    if ($errorCount -gt 0) {
        Write-Host "   Erros: $errorCount migrations" -ForegroundColor Red
    }
    Write-Host "================================================================" -ForegroundColor Gray
    
    # Gerar arquivo de índice
    $indexPath = Join-Path $destinationPath "MIGRATIONS_INDEX.md"
    $dateNow = Get-Date -Format "dd/MM/yyyy HH:mm:ss"
    
    $indexContent = "# Indice de Migrations - FINCORE`n"
    $indexContent += "**Gerado em**: $dateNow`n"
    $indexContent += "**Total**: $successCount migrations`n`n"
    $indexContent += "---`n`n"
    $indexContent += "## Ordem de Execucao`n`n"
    
    $counter = 1
    foreach ($item in $renamedMigrations) {
        $dateStr = $item.Original.CreationTime.ToString("dd/MM/yyyy HH:mm:ss")
        $indexContent += "### $counter. $($item.NewName)`n"
        $indexContent += "- **Data**: $dateStr`n"
        $indexContent += "- **Origem**: $($item.Original.Source)`n"
        $indexContent += "- **Arquivo original**: ``$($item.Original.OriginalName)```n`n"
        $counter++
    }
    
    $indexContent += "`n---`n`n"
    $indexContent += "## Instrucoes de Uso`n`n"
    $indexContent += "### Aplicar todas as migrations`n"
    $indexContent += "``````sql`n"
    $indexContent += "-- Execute em ordem, do 1 ao $successCount`n"
    $indexContent += "```````n`n"
    $indexContent += "### Verificar status`n"
    $indexContent += "``````sql`n"
    $indexContent += "-- Consulte sua tabela de controle de migrations`n"
    $indexContent += "SELECT * FROM schema_migrations ORDER BY version;`n"
    $indexContent += "```````n`n"
    $indexContent += "---`n`n"
    $indexContent += "**IMPORTANTE**: Sempre faca backup antes de aplicar migrations em producao!`n"
    
    Set-Content -Path $indexPath -Value $indexContent -Encoding UTF8
    Write-Host "`nIndice gerado: $indexPath" -ForegroundColor Cyan
    
}
else {
    Write-Host "`nSimulacao concluida. Use sem -DryRun para executar." -ForegroundColor Green
}

Write-Host ""
