# ========================================
# EXECUTAR MIGRATION - Faturas e Créditos
# ========================================

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  EXECUTANDO MIGRATION - FATURAS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Carregar .env
$envFile = Get-Content ".env" -ErrorAction SilentlyContinue
if ($envFile) {
    foreach ($line in $envFile) {
        if ($line -match '^\s*([^#][^=]*?)\s*=\s*(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Host "[OK] Arquivo .env carregado" -ForegroundColor Green
}

# Obter DATABASE_URL
$dbUrl = $env:DATABASE_URL
if (-not $dbUrl) {
    Write-Host "[ERRO] DATABASE_URL não encontrada no .env" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Conectando ao banco de dados..." -ForegroundColor Cyan

# Parsear DATABASE_URL
# Formato: postgres://user:password@host:port/database
if ($dbUrl -match 'postgres://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)') {
    $dbUser = $matches[1]
    $dbPass = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]
    
    Write-Host "[INFO] Host: $dbHost" -ForegroundColor Cyan
    Write-Host "[INFO] Database: $dbName" -ForegroundColor Cyan
    Write-Host "[INFO] User: $dbUser" -ForegroundColor Cyan
}
else {
    Write-Host "[ERRO] Formato de DATABASE_URL inválido" -ForegroundColor Red
    exit 1
}

# Ler migration
$migrationPath = "../database/migrations/003_invoices_and_credits.sql"
if (-not (Test-Path $migrationPath)) {
    Write-Host "[ERRO] Migration não encontrada: $migrationPath" -ForegroundColor Red
    exit 1
}

$migrationSQL = Get-Content $migrationPath -Raw
Write-Host "[OK] Migration carregada ($(($migrationSQL.Length / 1024).ToString('F2')) KB)" -ForegroundColor Green

# Executar via npgsql (se disponível) ou via script Go
Write-Host "`n[INFO] Executando migration via Go..." -ForegroundColor Cyan

# Criar script Go temporário
$goScript = @"
package main

import (
    "context"
    "fmt"
    "log"
    "os"
    
    "github.com/jackc/pgx/v5/pgxpool"
    "github.com/joho/godotenv"
)

func main() {
    godotenv.Load()
    
    dbURL := os.Getenv("DATABASE_URL")
    if dbURL == "" {
        log.Fatal("DATABASE_URL not set")
    }
    
    pool, err := pgxpool.New(context.Background(), dbURL)
    if err != nil {
        log.Fatalf("Unable to connect: %v", err)
    }
    defer pool.Close()
    
    fmt.Println("✅ Conectado ao banco")
    
    migrationSQL := \`$migrationSQL\`
    
    _, err = pool.Exec(context.Background(), migrationSQL)
    if err != nil {
        log.Fatalf("Migration failed: %v", err)
    }
    
    fmt.Println("✅ Migration executada com sucesso!")
    
    // Validar
    var count int
    pool.QueryRow(context.Background(), "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('financial_events', 'credits')").Scan(&count)
    fmt.Printf("✅ Tabelas criadas: %d/2\n", count)
    
    pool.QueryRow(context.Background(), "SELECT COUNT(*) FROM pg_proc WHERE proname IN ('calculate_available_limit', 'validate_invoice_total')").Scan(&count)
    fmt.Printf("✅ Funções criadas: %d/2\n", count)
}
"@

$goScript | Out-File -FilePath "migrate_temp.go" -Encoding UTF8

# Executar
go run migrate_temp.go

# Limpar
Remove-Item "migrate_temp.go" -ErrorAction SilentlyContinue

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  MIGRATION CONCLUÍDA!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green
