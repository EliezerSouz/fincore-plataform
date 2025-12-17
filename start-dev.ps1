# Script para iniciar Backend e Frontend simultaneamente

Write-Host "`n╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                  ║" -ForegroundColor Cyan
Write-Host "║              FINANCEIRO PLATFORM - INICIALIZACAO                 ║" -ForegroundColor Cyan
Write-Host "║                                                                  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Verificar se .env existe no backend
if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  Arquivo backend\.env nao encontrado!" -ForegroundColor Yellow
    Write-Host "   Criando arquivo de exemplo..." -ForegroundColor White
    
    $envContent = @"
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Server
PORT=8080
ENV=development
"@
    
    Set-Content -Path "backend\.env" -Value $envContent
    Write-Host "   ✓ Arquivo backend\.env criado" -ForegroundColor Green
    Write-Host "`n   ⚠️  IMPORTANTE: Edite backend\.env com suas credenciais!" -ForegroundColor Yellow
    Write-Host "   Pressione qualquer tecla para continuar..." -ForegroundColor White
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

Write-Host "`n🚀 Iniciando servicos..." -ForegroundColor Cyan
Write-Host ""

# Função para iniciar o backend
$backendJob = Start-Job -ScriptBlock {
    Set-Location "F:\Antigravity\Financeiro\backend"
    go run cmd/api/main.go
}

Write-Host "✓ Backend iniciando (Job ID: $($backendJob.Id))..." -ForegroundColor Green
Write-Host "   http://localhost:8080" -ForegroundColor Cyan

# Aguardar 3 segundos
Start-Sleep -Seconds 3

# Função para iniciar o frontend
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "F:\Antigravity\Financeiro\web"
    npm run dev
}

Write-Host "✓ Frontend iniciando (Job ID: $($frontendJob.Id))..." -ForegroundColor Green
Write-Host "   http://localhost:3000" -ForegroundColor Cyan

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "   SERVICOS INICIADOS!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`n📊 Status dos servicos:" -ForegroundColor Yellow
Write-Host "   Backend:  http://localhost:8080/health" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan

Write-Host "`n📝 Comandos uteis:" -ForegroundColor Yellow
Write-Host "   Ver logs do backend:  Receive-Job -Id $($backendJob.Id) -Keep" -ForegroundColor White
Write-Host "   Ver logs do frontend: Receive-Job -Id $($frontendJob.Id) -Keep" -ForegroundColor White
Write-Host "   Parar servicos:       Stop-Job -Id $($backendJob.Id),$($frontendJob.Id)" -ForegroundColor White

Write-Host "`n⏸️  Pressione Ctrl+C para parar todos os servicos" -ForegroundColor Yellow
Write-Host ""

# Aguardar até que o usuário pressione Ctrl+C
try {
    while ($true) {
        Start-Sleep -Seconds 5
        
        # Verificar status dos jobs
        $backendStatus = (Get-Job -Id $backendJob.Id).State
        $frontendStatus = (Get-Job -Id $frontendJob.Id).State
        
        if ($backendStatus -ne "Running") {
            Write-Host "`n⚠️  Backend parou! Status: $backendStatus" -ForegroundColor Red
            Receive-Job -Id $backendJob.Id
        }
        
        if ($frontendStatus -ne "Running") {
            Write-Host "`n⚠️  Frontend parou! Status: $frontendStatus" -ForegroundColor Red
            Receive-Job -Id $frontendJob.Id
        }
    }
}
finally {
    Write-Host "`n🛑 Parando servicos..." -ForegroundColor Yellow
    Stop-Job -Id $backendJob.Id, $frontendJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $backendJob.Id, $frontendJob.Id -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Servicos parados" -ForegroundColor Green
}
