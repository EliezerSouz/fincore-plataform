# Script para aplicar migration de Balance Adjustments
# Execute este script para adicionar suporte a saldos iniciais

Write-Host "=== Aplicando Migration: Balance Adjustments ===" -ForegroundColor Cyan
Write-Host ""

# Ler variáveis de ambiente
$envFile = "apps\web\.env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$supabaseKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "❌ Erro: Variáveis de ambiente não encontradas" -ForegroundColor Red
    Write-Host "Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidas em apps\web\.env.local" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Supabase URL: $supabaseUrl" -ForegroundColor Green
Write-Host ""

# Ler o arquivo SQL
$migrationFile = "supabase\migrations_backup\016_add_balance_adjustments.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Erro: Arquivo de migration não encontrado: $migrationFile" -ForegroundColor Red
    exit 1
}

$sqlContent = Get-Content $migrationFile -Raw
Write-Host "✓ Migration carregada: $migrationFile" -ForegroundColor Green
Write-Host ""

# Aplicar via Supabase SQL Editor (instruções)
Write-Host "=== INSTRUÇÕES PARA APLICAR A MIGRATION ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Abra o Supabase Dashboard: $supabaseUrl" -ForegroundColor White
Write-Host "2. Vá para SQL Editor" -ForegroundColor White
Write-Host "3. Cole o conteúdo do arquivo: $migrationFile" -ForegroundColor White
Write-Host "4. Execute o SQL" -ForegroundColor White
Write-Host ""
Write-Host "Ou copie o SQL abaixo:" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor DarkGray
Write-Host $sqlContent -ForegroundColor White
Write-Host "----------------------------------------" -ForegroundColor DarkGray
Write-Host ""

# Opção alternativa: usar npx supabase
Write-Host "=== ALTERNATIVA: Usar Supabase CLI ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "Se você tem o Supabase CLI instalado, execute:" -ForegroundColor White
Write-Host "npx supabase db push --db-url `"postgresql://...<sua-connection-string>...`"" -ForegroundColor Cyan
Write-Host ""

Write-Host "Pressione qualquer tecla para copiar o SQL para a área de transferência..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Copiar para clipboard
$sqlContent | Set-Clipboard
Write-Host "✓ SQL copiado para a área de transferência!" -ForegroundColor Green
Write-Host ""
Write-Host "Agora você pode colar diretamente no SQL Editor do Supabase." -ForegroundColor Cyan
