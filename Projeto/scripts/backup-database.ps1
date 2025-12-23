# Script PowerShell: Backup Automatizado do Banco FinCore
# Data: 23/12/2025
# Uso: .\backup-database.ps1

# =====================================================
# CONFIGURAÇÃO
# =====================================================

Write-Host "🔧 FinCore - Backup Automatizado do Banco de Dados" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Criar pasta de backups
$BACKUP_DIR = "f:\Antigravity\FinCore\Backups"
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null
    Write-Host "✅ Pasta de backups criada: $BACKUP_DIR" -ForegroundColor Green
}

# =====================================================
# SOLICITAR CREDENCIAIS
# =====================================================

Write-Host ""
Write-Host "📋 Por favor, forneça as credenciais do Supabase:" -ForegroundColor Yellow
Write-Host "   (Você pode encontrá-las em: Settings > Database)" -ForegroundColor Gray
Write-Host ""

$DB_HOST = Read-Host "Host (ex: db.xxxxx.supabase.co)"
$DB_NAME = Read-Host "Database name (padrão: postgres)"
$DB_USER = Read-Host "User (padrão: postgres)"
$DB_PASSWORD = Read-Host "Password" -AsSecureString

# Converter SecureString para texto
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD)
$DB_PASSWORD_TEXT = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Defaults
if ([string]::IsNullOrWhiteSpace($DB_NAME)) { $DB_NAME = "postgres" }
if ([string]::IsNullOrWhiteSpace($DB_USER)) { $DB_USER = "postgres" }

# =====================================================
# VERIFICAR pg_dump
# =====================================================

Write-Host ""
Write-Host "🔍 Verificando se pg_dump está instalado..." -ForegroundColor Cyan

$pgDumpPath = Get-Command pg_dump -ErrorAction SilentlyContinue

if (-not $pgDumpPath) {
    Write-Host "❌ pg_dump não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, instale PostgreSQL client tools:" -ForegroundColor Yellow
    Write-Host "https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ou use o backup via Supabase Dashboard (mais fácil):" -ForegroundColor Yellow
    Write-Host "https://supabase.com/dashboard > Database > Backups" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ pg_dump encontrado: $($pgDumpPath.Source)" -ForegroundColor Green

# =====================================================
# FAZER BACKUP
# =====================================================

$TIMESTAMP = Get-Date -Format "yyyyMMdd-HHmmss"
$BACKUP_FILE = "$BACKUP_DIR\fincore-backup-$TIMESTAMP.sql"

Write-Host ""
Write-Host "📦 Iniciando backup..." -ForegroundColor Cyan
Write-Host "   Arquivo: $BACKUP_FILE" -ForegroundColor Gray

# Configurar senha como variável de ambiente
$env:PGPASSWORD = $DB_PASSWORD_TEXT

# Executar pg_dump
try {
    pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F p -f $BACKUP_FILE 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ BACKUP CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
        Write-Host ""
        
        # Informações do arquivo
        $fileInfo = Get-Item $BACKUP_FILE
        $sizeKB = [math]::Round($fileInfo.Length / 1KB, 2)
        $sizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
        
        Write-Host "📊 Informações do Backup:" -ForegroundColor Cyan
        Write-Host "   Arquivo: $($fileInfo.Name)" -ForegroundColor White
        Write-Host "   Tamanho: $sizeKB KB ($sizeMB MB)" -ForegroundColor White
        Write-Host "   Data: $($fileInfo.LastWriteTime)" -ForegroundColor White
        Write-Host "   Local: $($fileInfo.DirectoryName)" -ForegroundColor White
        Write-Host ""
        
        # Verificar conteúdo
        $lineCount = (Get-Content $BACKUP_FILE | Measure-Object -Line).Lines
        Write-Host "   Linhas: $lineCount" -ForegroundColor White
        
        if ($lineCount -lt 100) {
            Write-Host ""
            Write-Host "⚠️  AVISO: Arquivo parece muito pequeno!" -ForegroundColor Yellow
            Write-Host "   Verifique se o backup foi feito corretamente." -ForegroundColor Yellow
        } else {
            Write-Host ""
            Write-Host "✅ Backup parece estar OK!" -ForegroundColor Green
        }
        
    } else {
        throw "pg_dump retornou código de erro: $LASTEXITCODE"
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ ERRO AO FAZER BACKUP!" -ForegroundColor Red
    Write-Host "   Erro: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Tente usar o backup via Supabase Dashboard:" -ForegroundColor Yellow
    Write-Host "https://supabase.com/dashboard > Database > Backups" -ForegroundColor Cyan
    exit 1
} finally {
    # Limpar senha da memória
    $env:PGPASSWORD = $null
}

# =====================================================
# CRIAR ARQUIVO DE METADADOS
# =====================================================

$metadataFile = "$BACKUP_DIR\fincore-backup-$TIMESTAMP.json"
$metadata = @{
    timestamp = $TIMESTAMP
    date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    host = $DB_HOST
    database = $DB_NAME
    user = $DB_USER
    file = $BACKUP_FILE
    size_bytes = (Get-Item $BACKUP_FILE).Length
    size_mb = [math]::Round((Get-Item $BACKUP_FILE).Length / 1MB, 2)
    lines = (Get-Content $BACKUP_FILE | Measure-Object -Line).Lines
} | ConvertTo-Json

$metadata | Out-File -FilePath $metadataFile -Encoding UTF8

Write-Host ""
Write-Host "📝 Metadados salvos em: $metadataFile" -ForegroundColor Cyan

# =====================================================
# PRÓXIMOS PASSOS
# =====================================================

Write-Host ""
Write-Host "🎯 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "   1. Verifique o arquivo de backup" -ForegroundColor White
Write-Host "   2. Marque como concluído no PLANO_B_EXECUCAO.md" -ForegroundColor White
Write-Host "   3. Inicie a Fase 1: Schema Consolidado" -ForegroundColor White
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "✅ Script concluído com sucesso!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
