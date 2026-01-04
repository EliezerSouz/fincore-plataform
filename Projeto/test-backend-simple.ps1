# ============================================
# TESTE E2E SIMPLIFICADO - FinCore Backend
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  TESTE E2E - FinCore Backend" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# PASSO 1: Compilar backend
Write-Host "[1/3] Compilando backend..." -ForegroundColor Yellow
Push-Location backend
try {
    & go build -o bin/api_test.exe ./cmd/api
    Write-Host "[OK] Backend compilado!" -ForegroundColor Green
}
catch {
    Write-Host "[ERRO] Falha ao compilar: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host ""

# PASSO 2: Iniciar backend
Write-Host "[2/3] Iniciando backend..." -ForegroundColor Yellow
Write-Host "   URL: http://localhost:8080" -ForegroundColor Cyan
Write-Host ""

# Criar diretorio de logs se nao existir
if (-not (Test-Path "backend\logs")) {
    New-Item -ItemType Directory -Path "backend\logs" -Force | Out-Null
}

$backendProcess = Start-Process -FilePath "backend\bin\api_test.exe" -PassThru -NoNewWindow -RedirectStandardOutput "backend\logs\test_output.log" -RedirectStandardError "backend\logs\test_error.log"

# Aguardar backend iniciar
Write-Host "[INFO] Aguardando backend iniciar (8 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Verificar se backend esta rodando
if ($backendProcess.HasExited) {
    Write-Host "[ERRO] Backend falhou ao iniciar!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Logs de erro:" -ForegroundColor Yellow
    Get-Content "backend\logs\test_error.log" | Select-Object -Last 20
    exit 1
}

Write-Host "[OK] Backend rodando! PID: $($backendProcess.Id)" -ForegroundColor Green
Write-Host ""

# PASSO 3: Testar endpoints
Write-Host "[3/3] Testando endpoints..." -ForegroundColor Yellow
Write-Host ""

$testsPassados = 0
$testsFalhados = 0

# Teste 1: Health Check
Write-Host "  [TEST 1] GET /health" -ForegroundColor Cyan
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:8080/health" -Method Get -TimeoutSec 5
    Write-Host "     [OK] Status: 200" -ForegroundColor Green
    Write-Host "     [DATA] $($healthResponse | ConvertTo-Json -Compress)" -ForegroundColor White
    $testsPassados++
}
catch {
    Write-Host "     [FAIL] $_" -ForegroundColor Red
    $testsFalhados++
}
Write-Host ""

# Teste 2: API Info
Write-Host "  [TEST 2] GET /" -ForegroundColor Cyan
try {
    $infoResponse = Invoke-RestMethod -Uri "http://localhost:8080/" -Method Get -TimeoutSec 5
    Write-Host "     [OK] Status: 200" -ForegroundColor Green
    Write-Host "     [DATA] API: $($infoResponse.message)" -ForegroundColor White
    Write-Host "     [DATA] Version: $($infoResponse.version)" -ForegroundColor White
    $testsPassados++
}
catch {
    Write-Host "     [FAIL] $_" -ForegroundColor Red
    $testsFalhados++
}
Write-Host ""

# Parar backend
Write-Host "[INFO] Parando backend..." -ForegroundColor Yellow
Stop-Process -Id $backendProcess.Id -Force
Write-Host "[OK] Backend parado" -ForegroundColor Green
Write-Host ""

# Resumo
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  RESUMO DO TESTE" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Testes passados: $testsPassados" -ForegroundColor Green
Write-Host "Testes falhados: $testsFalhados" -ForegroundColor $(if ($testsFalhados -eq 0) { "Green" } else { "Red" })
Write-Host ""
Write-Host "Logs salvos em:" -ForegroundColor Cyan
Write-Host "  - backend\logs\test_output.log" -ForegroundColor White
Write-Host "  - backend\logs\test_error.log" -ForegroundColor White
Write-Host ""

if ($testsFalhados -eq 0) {
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  TODOS OS TESTES PASSARAM!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "  ALGUNS TESTES FALHARAM!" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    exit 1
}
