# Script para atualizar imports após refatoração
# Atualiza todos os imports para a nova estrutura

Write-Host "`n🔄 FASE 5: Atualizando imports..." -ForegroundColor Cyan

$files = Get-ChildItem -Path "apps\web" -Include "*.tsx","*.ts" -Recurse -File | 
    Where-Object { $_.FullName -notmatch "node_modules|\.next|\.turbo" }

$updates = 0
$errors = 0

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Encoding UTF8
        $originalContent = $content -join "`n"
        $newContent = $originalContent
        
        # Atualizar imports de componentes de layout
        $newContent = $newContent -replace '@/components/app-sidebar', '@/components/layout/app-sidebar'
        $newContent = $newContent -replace '@/components/user-dropdown', '@/components/layout/user-dropdown'
        $newContent = $newContent -replace 'from\s+[''"]\.\.?/\.\.?/components/app-sidebar[''"]', 'from "@/components/layout/app-sidebar"'
        $newContent = $newContent -replace 'from\s+[''"]\.\.?/\.\.?/components/user-dropdown[''"]', 'from "@/components/layout/user-dropdown"'
        
        # Atualizar imports de categories
        $newContent = $newContent -replace '@/components/categories/category-list', '@/features/categories/components/category-list'
        $newContent = $newContent -replace 'from\s+[''"]\.\.?/\.\.?/components/categories/category-list[''"]', 'from "@/features/categories/components/category-list"'
        
        # Atualizar imports de accounts (convert-period-dialog)
        $newContent = $newContent -replace '@/components/accounts/convert-period-dialog', '@/features/accounts/components/convert-period-dialog'
        $newContent = $newContent -replace 'from\s+[''"]\.\.?/\.\.?/components/accounts/convert-period-dialog[''"]', 'from "@/features/accounts/components/convert-period-dialog"'
        
        if ($newContent -ne $originalContent) {
            $newContent | Set-Content $file.FullName -Encoding UTF8
            $updates++
            Write-Host "  ✓ $($file.Name)" -ForegroundColor Green
        }
    }
    catch {
        $errors++
        Write-Host "  ✗ $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n✅ Imports atualizados!" -ForegroundColor Green
Write-Host "   Arquivos modificados: $updates" -ForegroundColor Cyan
if ($errors -gt 0) {
    Write-Host "   Erros: $errors" -ForegroundColor Red
}
