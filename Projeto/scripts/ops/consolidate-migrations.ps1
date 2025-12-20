# Script para consolidar e renumerar migrations
# Este script move todas as migrations para web/supabase/migrations e renumera sequencialmente

$rootPath = "F:\Antigravity\Financeiro"
$oldMigrationsPath = Join-Path $rootPath "supabase\migrations"
$newMigrationsPath = Join-Path $rootPath "web\supabase\migrations"

Write-Host "=== Consolidando Migrations ===" -ForegroundColor Cyan
Write-Host ""

# Criar diretório se não existir
if (-not (Test-Path $newMigrationsPath)) {
    New-Item -ItemType Directory -Path $newMigrationsPath -Force | Out-Null
}

# Mapeamento manual da ordem correta das migrations
$migrationOrder = @(
    # Core Schema (da pasta raiz supabase/migrations)
    "001_create_users_table.sql",
    "002_fix_permissions.sql",
    "003_create_accounts_table.sql",
    "004_create_categories_table.sql",
    "005_create_transactions_table.sql",
    "006_update_account_types.sql",
    
    # Merged: 007 (add_payment_method + enhance_categories_saas)
    "007_add_payment_method.sql",
    "007_enhance_categories_saas.sql",
    
    # Merged: 008 (create_payment_methods + add_subscription_fields)
    "008_create_payment_methods.sql",
    "008_add_subscription_fields.sql",
    
    # Merged: 009 (update_payment_methods_schema + create_credit_cards)
    "009_update_payment_methods_schema.sql",
    "009_create_credit_cards.sql",
    
    # Merged: 010 (prevent_cascade_delete + update_transactions_account)
    "010_prevent_cascade_delete.sql",
    "010_update_transactions_account.sql",
    
    # Merged: 011 (add_account_is_active + create_credit_card_invoices)
    "011_add_account_is_active.sql",
    "011_create_credit_card_invoices.sql",
    
    # Merged: 012 (add_is_active_globally + create_credit_card_transactions)
    "012_add_is_active_globally.sql",
    "012_create_credit_card_transactions.sql",
    
    # Merged: 013 (change_account_type_to_text + credit_card_functions)
    "013_change_account_type_to_text.sql",
    "013_credit_card_functions.sql",
    
    # Merged: 014 (ensure_invoice_category + fix_credit_cards_rls)
    "014_ensure_invoice_category.sql",
    "014_fix_credit_cards_rls.sql",
    
    # Merged: 015 (recreate_default_categories + fix_invoices_transactions_rls)
    "015_recreate_default_categories.sql",
    "015_fix_invoices_transactions_rls.sql",
    
    # Credit Cards & Invoices
    "016_fix_delete_credit_cards.sql",
    "017_force_fix_rls.sql",
    "018_create_force_delete_rpc.sql",
    "019_fix_delete_transactions.sql",
    "020_force_delete_transaction.sql",
    "021_fix_invoice_dates.sql",
    
    # Payables
    "023_create_payables_table.sql",
    "024_fix_payables_permissions.sql",
    "025_add_payment_columns.sql",
    
    # Invoice Payments
    "026_add_invoice_link_to_transactions.sql",
    
    # Payment Methods Fixes (com timestamp)
    "20241213180000_remove_payment_method_text.sql",
    "20241213181500_add_payment_method_fk.sql",
    "20241213182500_seed_payment_methods.sql",
    "20241213182800_fix_payment_methods_seed.sql",
    "20241213183500_fix_payment_methods_seed_v2.sql",
    "20241213184000_fix_payment_methods_seed_v3.sql",
    "20241213184500_fix_payment_methods_seed_v4.sql",
    "20241213185000_force_payment_method_fk.sql",
    "20241213190000_backfill_orphan_transactions.sql",
    "20241213191000_add_payment_methods_policy.sql",
    "20241213192000_open_payment_methods_access.sql",
    "20241213193000_reset_payment_methods.sql",
    "20241213200000_disable_rls_payment_methods.sql",
    "20241213200500_grant_permissions.sql"
)

Write-Host "Total de migrations a processar: $($migrationOrder.Count)" -ForegroundColor Yellow
Write-Host ""

$counter = 1
$processedFiles = @()

foreach ($fileName in $migrationOrder) {
    # Tentar encontrar o arquivo em ambas as pastas
    $sourceFile = $null
    
    if (Test-Path (Join-Path $oldMigrationsPath $fileName)) {
        $sourceFile = Join-Path $oldMigrationsPath $fileName
    } elseif (Test-Path (Join-Path $newMigrationsPath $fileName)) {
        $sourceFile = Join-Path $newMigrationsPath $fileName
    }
    
    if ($sourceFile) {
        # Novo nome com numeração sequencial
        $newNumber = "{0:D3}" -f $counter
        $baseName = $fileName -replace '^\d+_|^\d{14}_', ''
        $newFileName = "${newNumber}_${baseName}"
        $destFile = Join-Path $newMigrationsPath $newFileName
        
        # Copiar arquivo (não mover, para manter backup)
        if ($sourceFile -ne $destFile) {
            Copy-Item -Path $sourceFile -Destination $destFile -Force
            Write-Host "[$newNumber] $baseName" -ForegroundColor Green
        } else {
            Write-Host "[$newNumber] $baseName (já existe)" -ForegroundColor Gray
        }
        
        $processedFiles += $newFileName
        $counter++
    } else {
        Write-Host "[SKIP] $fileName (não encontrado)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Consolidação Completa ===" -ForegroundColor Cyan
Write-Host "Total de migrations processadas: $($processedFiles.Count)" -ForegroundColor Green
Write-Host "Pasta de destino: $newMigrationsPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Red
Write-Host "- As migrations originais foram COPIADAS (não movidas)" -ForegroundColor Yellow
Write-Host "- Você pode deletar a pasta antiga manualmente se desejar" -ForegroundColor Yellow
Write-Host "- Revise os arquivos antes de executar no banco" -ForegroundColor Yellow
