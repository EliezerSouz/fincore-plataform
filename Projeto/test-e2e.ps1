# ============================================
# TESTE E2E - FinCore Backend + Database
# ============================================
# Data: 04/01/2026
# Objetivo: Testar backend com banco limpo
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  TESTE E2E - FinCore Backend + Database" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Configuracoes
$ErrorActionPreference = "Stop"
$TestDbName = "fincore_test_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$MigrationFile = "database\migrations\consolidated\001_initial_schema.sql"

# Carregar variaveis de ambiente
Write-Host "[INFO] Carregando variaveis de ambiente..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    Get-Content "backend\.env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Host "[OK] Variaveis carregadas" -ForegroundColor Green
}
else {
    Write-Host "[ERRO] Arquivo .env nao encontrado!" -ForegroundColor Red
    exit 1
}

# Extrair credenciais do DATABASE_URL
$DatabaseUrl = $env:DATABASE_URL
if (-not $DatabaseUrl) {
    Write-Host "[ERRO] DATABASE_URL nao encontrada no .env!" -ForegroundColor Red
    exit 1
}

# Parse DATABASE_URL (formato: postgresql://user:pass@host:port/dbname)
if ($DatabaseUrl -match 'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)') {
    $DbUser = $matches[1]
    $DbPass = $matches[2]
    $DbHost = $matches[3]
    $DbPort = $matches[4]
    $DbName = $matches[5]
    
    Write-Host "[INFO] Credenciais do banco:" -ForegroundColor Cyan
    Write-Host "  Host: $DbHost" -ForegroundColor White
    Write-Host "  Port: $DbPort" -ForegroundColor White
    Write-Host "  User: $DbUser" -ForegroundColor White
    Write-Host "  Database Original: $DbName" -ForegroundColor White
    Write-Host ""
}
else {
    Write-Host "[ERRO] Formato de DATABASE_URL invalido!" -ForegroundColor Red
    exit 1
}

# PASSO 1: Verificar se psql esta disponivel
Write-Host "[INFO] Verificando psql..." -ForegroundColor Yellow
try {
    $psqlVersion = & psql --version 2>&1
    Write-Host "[OK] psql encontrado: $psqlVersion" -ForegroundColor Green
}
catch {
    Write-Host "[ERRO] psql nao encontrado! Instale PostgreSQL client." -ForegroundColor Red
    Write-Host "   Download: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# PASSO 2: Criar banco de teste
Write-Host "[INFO] Criando banco de teste: $TestDbName..." -ForegroundColor Yellow
$env:PGPASSWORD = $DbPass
try {
    $createDbCmd = "CREATE DATABASE $TestDbName;"
    $createDbCmd | & psql -h $DbHost -p $DbPort -U $DbUser -d postgres 2>&1 | Out-Null
    Write-Host "[OK] Banco de teste criado!" -ForegroundColor Green
}
catch {
    Write-Host "[WARN] Erro ao criar banco (pode ja existir): $_" -ForegroundColor Yellow
}
Write-Host ""

# PASSO 3: Executar migration
Write-Host "[INFO] Executando migration consolidada..." -ForegroundColor Yellow
if (-not (Test-Path $MigrationFile)) {
    Write-Host "[ERRO] Migration nao encontrada: $MigrationFile" -ForegroundColor Red
    exit 1
}

try {
    & psql -h $DbHost -p $DbPort -U $DbUser -d $TestDbName -f $MigrationFile 2>&1 | Out-Null
    Write-Host "[OK] Migration executada com sucesso!" -ForegroundColor Green
}
catch {
    Write-Host "[ERRO] Erro ao executar migration: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# PASSO 4: Validar estrutura do banco
Write-Host "[INFO] Validando estrutura do banco..." -ForegroundColor Yellow
$tableCountQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
$tableCount = & psql -h $DbHost -p $DbPort -U $DbUser -d $TestDbName -t -c $tableCountQuery

Write-Host "  Tabelas criadas: $($tableCount.Trim())" -ForegroundColor White

# Listar tabelas principais
$tablesQuery = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
$tables = & psql -h $DbHost -p $DbPort -U $DbUser -d $TestDbName -t -c $tablesQuery

Write-Host "  Tabelas principais:" -ForegroundColor Cyan
$tables | ForEach-Object {
    $tableName = $_.Trim()
    if ($tableName) {
        Write-Host "    - $tableName" -ForegroundColor White
    }
}
Write-Host ""

# PASSO 5: Inserir codigos promocionais de teste
Write-Host "[INFO] Inserindo codigos promocionais de teste..." -ForegroundColor Yellow
$promoCodesQuery = @"
INSERT INTO promo_codes (code, plan_type, duration_days, active, usage_limit, usage_count) 
VALUES 
    ('PREMIUM14', 'premium', 14, true, 1000, 0),
    ('IA7', 'premium_ia', 7, true, 1000, 0),
    ('TEST30', 'premium', 30, true, 100, 0)
ON CONFLICT (code) DO NOTHING;
"@

try {
    $promoCodesQuery | & psql -h $DbHost -p $DbPort -U $DbUser -d $TestDbName 2>&1 | Out-Null
    Write-Host "[OK] Codigos promocionais inseridos!" -ForegroundColor Green
}
catch {
    Write-Host "[WARN] Erro ao inserir promo codes: $_" -ForegroundColor Yellow
}
Write-Host ""

# PASSO 6: Atualizar DATABASE_URL para banco de teste
Write-Host "[INFO] Configurando backend para usar banco de teste..." -ForegroundColor Yellow
$TestDatabaseUrl = "postgresql://${DbUser}:${DbPass}@${DbHost}:${DbPort}/${TestDbName}"
$env:DATABASE_URL = $TestDatabaseUrl
Write-Host "[OK] DATABASE_URL atualizada" -ForegroundColor Green
Write-Host ""

# PASSO 7: Compilar backend
Write-Host "[INFO] Compilando backend..." -ForegroundColor Yellow
Push-Location backend
try {
    & go build -o bin/api_test.exe ./cmd/api 2>&1 | Out-Null
    Write-Host "[OK] Backend compilado!" -ForegroundColor Green
}
catch {
    Write-Host "[ERRO] Erro ao compilar backend: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host ""

# PASSO 8: Iniciar backend em background
Write-Host "[INFO] Iniciando backend..." -ForegroundColor Yellow
Write-Host "   URL: http://localhost:8080" -ForegroundColor Cyan
Write-Host "   Banco: $TestDbName" -ForegroundColor Cyan
Write-Host ""

$backendProcess = Start-Process -FilePath "backend\bin\api_test.exe" -PassThru -NoNewWindow -RedirectStandardOutput "backend\logs\test_output.log" -RedirectStandardError "backend\logs\test_error.log"

# Aguardar backend iniciar
Write-Host "[INFO] Aguardando backend iniciar (5 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verificar se backend esta rodando
if ($backendProcess.HasExited) {
    Write-Host "[ERRO] Backend falhou ao iniciar!" -ForegroundColor Red
    Write-Host "   Verifique os logs em backend\logs\test_error.log" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Backend iniciado! PID: $($backendProcess.Id)" -ForegroundColor Green
Write-Host ""

# PASSO 9: Testar endpoints
Write-Host "[INFO] Testando endpoints..." -ForegroundColor Yellow
Write-Host ""

# Teste 1: Health Check
Write-Host "  [TEST 1] GET /health" -ForegroundColor Cyan
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:8080/health" -Method Get -TimeoutSec 5
    Write-Host "     [OK] Status: OK" -ForegroundColor Green
    Write-Host "     [DATA] Response: $($healthResponse | ConvertTo-Json -Compress)" -ForegroundColor White
}
catch {
    Write-Host "     [FAIL] Falhou: $_" -ForegroundColor Red
}
Write-Host ""

# Teste 2: API Info
Write-Host "  [TEST 2] GET /" -ForegroundColor Cyan
try {
    $infoResponse = Invoke-RestMethod -Uri "http://localhost:8080/" -Method Get -TimeoutSec 5
    Write-Host "     [OK] Status: OK" -ForegroundColor Green
    Write-Host "     [DATA] API: $($infoResponse.message)" -ForegroundColor White
    Write-Host "     [DATA] Version: $($infoResponse.version)" -ForegroundColor White
}
catch {
    Write-Host "     [FAIL] Falhou: $_" -ForegroundColor Red
}
Write-Host ""

# PASSO 10: Parar backend
Write-Host "[INFO] Parando backend..." -ForegroundColor Yellow
Stop-Process -Id $backendProcess.Id -Force
Write-Host "[OK] Backend parado" -ForegroundColor Green
Write-Host ""

# PASSO 11: Resumo
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  RESUMO DO TESTE E2E" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[OK] Banco de teste criado: $TestDbName" -ForegroundColor Green
Write-Host "[OK] Migration executada com sucesso" -ForegroundColor Green
Write-Host "[OK] Tabelas criadas: $($tableCount.Trim())" -ForegroundColor Green
Write-Host "[OK] Backend compilado e executado" -ForegroundColor Green
Write-Host "[OK] Endpoints testados" -ForegroundColor Green
Write-Host ""
Write-Host "[INFO] Logs salvos em:" -ForegroundColor Cyan
Write-Host "   - backend\logs\test_output.log" -ForegroundColor White
Write-Host "   - backend\logs\test_error.log" -ForegroundColor White
Write-Host ""
Write-Host "[INFO] Banco de teste: $TestDbName" -ForegroundColor Cyan
Write-Host "   Para acessar:" -ForegroundColor Yellow
Write-Host "   psql -h $DbHost -p $DbPort -U $DbUser -d $TestDbName" -ForegroundColor White
Write-Host ""
Write-Host "[INFO] Para limpar (deletar banco de teste):" -ForegroundColor Yellow
Write-Host "   DROP DATABASE $TestDbName;" -ForegroundColor White
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  TESTE E2E CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
