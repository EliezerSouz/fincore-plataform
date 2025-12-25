# ========================================
# TESTE E2E AVANCADO - FINCORE
# Categorias, Subcategorias e Contas a Pagar
# ========================================
# Data: 24/12/2025
# Objetivo: Validar CRUD completo + regras de negocio
# ========================================

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:8080/api"

# Cores para output
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-ErrorCustom { param($msg) Write-Host "[ERRO] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-TestStep { param($msg) Write-Host "`n[ETAPA] $msg" -ForegroundColor Yellow }

# ========================================
# VARIAVEIS GLOBAIS
# ========================================
$accountId = $null
$categoryId = $null
$subcategoryRestaurantesId = $null
$subcategoryMercadoId = $null
$payableId = $null

# ========================================
# FUNCOES AUXILIARES
# ========================================

function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    $params = @{
        Uri     = "$baseUrl$Endpoint"
        Method  = $Method
        Headers = $headers
    }
    
    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 10)
    }
    
    try {
        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($errorDetails) {
            throw $errorDetails.error
        }
        else {
            throw $_.Exception.Message
        }
    }
}

function Assert-Equal {
    param($actual, $expected, $message)
    if ($actual -ne $expected) {
        Write-ErrorCustom "$message | Esperado: $expected | Obtido: $actual"
        throw "Assertion failed"
    }
    Write-Success $message
}

function Assert-NotNull {
    param($value, $message)
    if ($null -eq $value -or $value -eq "") {
        Write-ErrorCustom "$message | Valor e nulo ou vazio"
        throw "Assertion failed"
    }
    Write-Success $message
}

# ========================================
# INICIO DOS TESTES
# ========================================

Write-Host "`n=======================================================" -ForegroundColor Magenta
Write-Host "  TESTE E2E AVANCADO - FINCORE" -ForegroundColor Magenta
Write-Host "  CRUD Completo + Regras de Negocio" -ForegroundColor Magenta
Write-Host "=======================================================" -ForegroundColor Magenta
Write-Host ""

# ========================================
# 1 - CATEGORIAS: CREATE
# ========================================
Write-TestStep "ETAPA 1: Categorias - Criacao"

$timestamp = Get-Date -Format "HHmmss"
$categoryName = "ALIMENTACAO_$timestamp"

$categoryPayload = @{
    name  = $categoryName
    type  = "despesa"
    icon  = "utensils"
    color = "#ef4444"
}

try {
    $category = Invoke-ApiRequest -Method POST -Endpoint "/categories" -Body $categoryPayload
    $categoryId = $category.id
    Assert-NotNull $categoryId "Categoria criada"
    Write-Info "Category ID: $categoryId"
}
catch {
    Write-ErrorCustom "Falha ao criar categoria: $_"
    exit 1
}

# ========================================
# 2 - CATEGORIAS: UPDATE
# ========================================
Write-TestStep "ETAPA 2: Categorias - Edicao"

$updateCategoryPayload = @{
    name  = "$categoryName\_EDITADA"
    color = "#10b981"
}

try {
    Invoke-ApiRequest -Method PUT -Endpoint "/categories/$categoryId" -Body $updateCategoryPayload
    Write-Success "Categoria editada"
    
    # Validar mudanca
    $categories = Invoke-ApiRequest -Method GET -Endpoint "/categories"
    $updated = $categories | Where-Object { $_.id -eq $categoryId }
    Assert-Equal $updated.color "#10b981" "Cor da categoria atualizada"
}
catch {
    Write-ErrorCustom "Falha ao editar categoria: $_"
    exit 1
}

# ========================================
# 3 - SUBCATEGORIAS: CREATE
# ========================================
Write-TestStep "ETAPA 3: Subcategorias - Criacao"

$subcategoryPayload = @{
    category_id = $categoryId
    name        = "RESTAURANTES"
}

try {
    $subcategory = Invoke-ApiRequest -Method POST -Endpoint "/subcategories" -Body $subcategoryPayload
    $subcategoryRestaurantesId = $subcategory.id
    Assert-NotNull $subcategoryRestaurantesId "Subcategoria criada"
    Write-Info "Subcategory ID: $subcategoryRestaurantesId"
}
catch {
    Write-ErrorCustom "Falha ao criar subcategoria: $_"
    exit 1
}

# ========================================
# 4 - SUBCATEGORIAS: UPDATE
# ========================================
Write-TestStep "ETAPA 4: Subcategorias - Edicao"

$updateSubcategoryPayload = @{
    name = "RESTAURANTES_EDITADA"
}

try {
    Invoke-ApiRequest -Method PUT -Endpoint "/subcategories/$subcategoryRestaurantesId" -Body $updateSubcategoryPayload
    Write-Success "Subcategoria editada"
}
catch {
    Write-ErrorCustom "Falha ao editar subcategoria: $_"
    exit 1
}

# ========================================
# 5 - TENTATIVA DE EXCLUIR CATEGORIA COM SUBCATEGORIA
# ========================================
Write-TestStep "ETAPA 5: Categorias - Tentativa de Exclusao com Subcategoria"

try {
    Invoke-ApiRequest -Method DELETE -Endpoint "/categories/$categoryId"
    Write-ErrorCustom "FALHA: Sistema permitiu excluir categoria com subcategoria!"
    exit 1
}
catch {
    $errorMsg = $_.Exception.Message
    if ($errorMsg -like "*subcategor*" -or $errorMsg -like "*foreign*" -or $errorMsg -like "*constraint*") {
        Write-Success "Sistema bloqueou exclusao de categoria com subcategoria"
        Write-Info "Mensagem: $errorMsg"
    }
    else {
        Write-ErrorCustom "Bloqueou, mas mensagem inadequada: $errorMsg"
        exit 1
    }
}

# ========================================
# 6 - SUBCATEGORIAS: DELETE
# ========================================
Write-TestStep "ETAPA 6: Subcategorias - Exclusao"

try {
    Invoke-ApiRequest -Method DELETE -Endpoint "/subcategories/$subcategoryRestaurantesId"
    Write-Success "Subcategoria excluida"
    
    # Validar exclusao
    $categories = Invoke-ApiRequest -Method GET -Endpoint "/categories"
    $cat = $categories | Where-Object { $_.id -eq $categoryId }
    if ($cat.subcategories) {
        $subIds = $cat.subcategories | ForEach-Object { $_.id }
        if ($subIds -contains $subcategoryRestaurantesId) {
            Write-ErrorCustom "Subcategoria ainda aparece na listagem!"
            exit 1
        }
    }
    Write-Success "Subcategoria removida da listagem"
}
catch {
    Write-ErrorCustom "Falha ao excluir subcategoria: $_"
    exit 1
}

# ========================================
# 7 - CATEGORIAS: DELETE (Agora Permitido)
# ========================================
Write-TestStep "ETAPA 7: Categorias - Exclusao"

try {
    Invoke-ApiRequest -Method DELETE -Endpoint "/categories/$categoryId"
    Write-Success "Categoria excluida (sem subcategorias)"
}
catch {
    Write-ErrorCustom "Falha ao excluir categoria: $_"
    exit 1
}

# ========================================
# 8 - PREPARACAO: Criar Categoria e Conta
# ========================================
Write-TestStep "ETAPA 8: Preparacao para Contas a Pagar"

# Criar nova categoria para testes de contas a pagar
$categoryPayload = @{
    name  = "DESPESAS_$timestamp"
    type  = "despesa"
    icon  = "wallet"
    color = "#3b82f6"
}

$category = Invoke-ApiRequest -Method POST -Endpoint "/categories" -Body $categoryPayload
$categoryId = $category.id
Write-Info "Nova categoria criada: $categoryId"

# Criar conta bancaria
$accountPayload = @{
    name  = "CONTA TESTE"
    type  = "corrente"
    icon  = "bank"
    color = "#3b82f6"
}

$account = Invoke-ApiRequest -Method POST -Endpoint "/accounts" -Body $accountPayload
$accountId = $account.id
Write-Info "Conta criada: $accountId"

# Ajuste de saldo inicial
$adjustmentPayload = @{
    account_id               = $accountId
    balance                  = 1000.00
    adjustment_date          = "2025-12-01T00:00:00Z"
    type                     = "AJUSTE_INICIAL"
    notes                    = "SALDO INICIAL"
    starts_controlled_period = $false
}

Invoke-ApiRequest -Method POST -Endpoint "/balance-adjustments" -Body $adjustmentPayload
Write-Success "Saldo inicial configurado"

# ========================================
# 9 - CONTAS A PAGAR: CREATE
# ========================================
Write-TestStep "ETAPA 9: Contas a Pagar - Criacao"

$payablePayload = @{
    description         = "INTERNET"
    amount              = 120.00
    due_date            = "2025-12-25T00:00:00Z"
    recurrence_strategy = "single"
    category_id         = $categoryId
}

try {
    Invoke-ApiRequest -Method POST -Endpoint "/payables" -Body $payablePayload
    Write-Success "Conta a pagar criada"
    
    # Buscar conta criada
    Start-Sleep -Seconds 1
    $payables = Invoke-ApiRequest -Method GET -Endpoint "/payables?from=2025-12-01&to=2025-12-31"
    $payable = $payables | Where-Object { $_.description -eq "INTERNET" } | Select-Object -First 1
    Assert-NotNull $payable "Conta a pagar encontrada"
    $payableId = $payable.id
    Write-Info "Payable ID: $payableId"
}
catch {
    Write-ErrorCustom "Falha ao criar conta a pagar: $_"
    exit 1
}

# ========================================
# 10 - CONTAS A PAGAR: UPDATE
# ========================================
Write-TestStep "ETAPA 10: Contas a Pagar - Edicao"

$updatePayablePayload = @{
    description = "INTERNET_EDITADA"
    amount      = 150.00
}

try {
    Invoke-ApiRequest -Method PUT -Endpoint "/payables/$payableId" -Body $updatePayablePayload
    Write-Success "Conta a pagar editada"
    
    # Validar mudanca
    $payables = Invoke-ApiRequest -Method GET -Endpoint "/payables?from=2025-12-01&to=2025-12-31"
    $updated = $payables | Where-Object { $_.id -eq $payableId }
    Assert-Equal $updated.amount 150.00 "Valor atualizado para R$ 150,00"
}
catch {
    Write-ErrorCustom "Falha ao editar conta a pagar: $_"
    exit 1
}

# ========================================
# 11 - CONTAS A PAGAR: PAY
# ========================================
Write-TestStep "ETAPA 11: Contas a Pagar - Pagamento"

$paymentPayload = @{
    account_id = $accountId
    date       = "2025-12-24T00:00:00Z"
}

try {
    Invoke-ApiRequest -Method POST -Endpoint "/payables/$payableId/pay" -Body $paymentPayload
    Write-Success "Conta a pagar paga"
    
    # Validar saldo
    Start-Sleep -Seconds 1
    $accountDetails = Invoke-ApiRequest -Method GET -Endpoint "/accounts/$accountId"
    $expectedBalance = 1000.00 - 150.00
    Assert-Equal $accountDetails.balance $expectedBalance "Saldo reduzido para R$ 850,00"
}
catch {
    Write-ErrorCustom "Falha ao pagar conta: $_"
    exit 1
}

# ========================================
# 12 - CONTAS A PAGAR: TENTATIVA DUPLO PAGAMENTO
# ========================================
Write-TestStep "ETAPA 12: Contas a Pagar - Tentativa Duplo Pagamento"

try {
    Invoke-ApiRequest -Method POST -Endpoint "/payables/$payableId/pay" -Body $paymentPayload
    Write-ErrorCustom "FALHA: Sistema permitiu duplo pagamento!"
    exit 1
}
catch {
    $errorMsg = $_.Exception.Message
    if ($errorMsg -like "*paid*" -or $errorMsg -like "*paga*" -or $errorMsg -like "*pago*") {
        Write-Success "Sistema bloqueou duplo pagamento"
        Write-Info "Mensagem: $errorMsg"
    }
    else {
        Write-ErrorCustom "Bloqueou, mas mensagem inadequada: $errorMsg"
        exit 1
    }
}

# ========================================
# 13 - CONTAS A PAGAR: REVERT
# ========================================
Write-TestStep "ETAPA 13: Contas a Pagar - Estorno"

try {
    Invoke-ApiRequest -Method POST -Endpoint "/payables/$payableId/revert" -Body @{}
    Write-Success "Pagamento estornado"
    
    # Validar saldo restaurado
    Start-Sleep -Seconds 1
    $accountDetails = Invoke-ApiRequest -Method GET -Endpoint "/accounts/$accountId"
    Assert-Equal $accountDetails.balance 1000.00 "Saldo restaurado para R$ 1.000,00"
}
catch {
    Write-ErrorCustom "Falha ao estornar: $_"
    exit 1
}

# ========================================
# 14 - CONTAS A PAGAR: DELETE
# ========================================
Write-TestStep "ETAPA 14: Contas a Pagar - Exclusao"

try {
    Invoke-ApiRequest -Method DELETE -Endpoint "/payables/$payableId"
    Write-Success "Conta a pagar excluida"
    
    # Validar exclusao
    $payables = Invoke-ApiRequest -Method GET -Endpoint "/payables?from=2025-12-01&to=2025-12-31"
    $deleted = $payables | Where-Object { $_.id -eq $payableId }
    if ($deleted) {
        Write-ErrorCustom "Conta a pagar ainda aparece na listagem!"
        exit 1
    }
    Write-Success "Conta a pagar removida da listagem"
}
catch {
    Write-ErrorCustom "Falha ao excluir conta a pagar: $_"
    exit 1
}

# ========================================
# RESULTADO FINAL
# ========================================

Write-Host "`n=======================================================" -ForegroundColor Green
Write-Host "  TESTE E2E AVANCADO - SUCESSO!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
Write-Host ""

Write-Success "Todas as validacoes passaram!"
Write-Success ""
Write-Success "Resumo:"
Write-Success "  - Categorias: CREATE, UPDATE, DELETE: OK"
Write-Success "  - Subcategorias: CREATE, UPDATE, DELETE: OK"
Write-Success "  - Vinculo categoria-subcategoria: OK"
Write-Success "  - Bloqueio exclusao categoria com subcategoria: OK"
Write-Success "  - Contas a Pagar: CREATE, UPDATE, DELETE: OK"
Write-Success "  - Pagamento de conta a pagar: OK"
Write-Success "  - Bloqueio duplo pagamento: OK"
Write-Success "  - Estorno de pagamento: OK"
Write-Success "  - Consistencia de saldo: OK"

Write-Host ""
Write-Host "FinCore - CRUD Completo Validado!" -ForegroundColor Magenta
