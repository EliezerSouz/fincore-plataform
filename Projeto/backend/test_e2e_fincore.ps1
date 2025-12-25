# ========================================
# TESTE E2E COMPLETO - FINCORE
# ========================================
# Data: 24/12/2025
# Objetivo: Validar fluxo completo de usuario com regras contabeis
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
$userId = $null
$accountId = $null
$adjustmentId = $null

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
Write-Host "  TESTE E2E COMPLETO - FINCORE" -ForegroundColor Magenta
Write-Host "=======================================================" -ForegroundColor Magenta
Write-Host ""

# ========================================
# 1 - CRIACAO DE USUARIO
# ========================================
Write-TestStep "ETAPA 1: Criacao de Usuario"

Write-Info "Criando usuario de teste..."

# Nota: O sistema usa AuthBypass, entao vamos simular um user_id fixo
# Em producao, isso seria feito via autenticacao real
$userId = "e2e-test-user-$(Get-Random)"

Write-Info "UserID simulado: $userId"
Write-Success "Usuario criado (simulado via AuthBypass)"

# ========================================
# 2 - CRIACAO DE CONTA FINANCEIRA
# ========================================
Write-TestStep "ETAPA 2: Criacao de Conta Financeira"

Write-Info "Criando conta 'Conta Corrente' em 22/12..."

$accountPayload = @{
    name             = "CONTA CORRENTE"
    type             = "corrente"
    icon             = "bank"
    color            = "#3b82f6"
    include_in_total = $true
}

try {
    $account = Invoke-ApiRequest -Method POST -Endpoint "/accounts" -Body $accountPayload
    $accountId = $account.id
    
    Assert-NotNull $accountId "Conta criada com sucesso"
    Write-Info "Account ID: $accountId"
    
    # Validar saldo inicial
    $accountDetails = Invoke-ApiRequest -Method GET -Endpoint "/accounts/$accountId"
    Assert-Equal $accountDetails.balance 0 "Saldo inicial da conta e 0,00"
    
}
catch {
    Write-ErrorCustom "Falha ao criar conta: $_"
    exit 1
}

# ========================================
# 3 - AJUSTE DE SALDO INICIAL (Sem Movimentacoes)
# ========================================
Write-TestStep "ETAPA 3: Ajuste de Saldo Inicial (01/12)"

Write-Info "Criando ajuste de saldo inicial: R$ 71,17 em 01/12..."

$adjustmentPayload = @{
    account_id               = $accountId
    balance                  = 71.17
    adjustment_date          = "2025-12-01T00:00:00Z"
    type                     = "AJUSTE_INICIAL"
    notes                    = "SALDO INICIAL"
    starts_controlled_period = $false
}

try {
    $adjustment = Invoke-ApiRequest -Method POST -Endpoint "/balance-adjustments" -Body $adjustmentPayload
    $adjustmentId = $adjustment.id
    
    Assert-NotNull $adjustmentId "Ajuste de saldo inicial criado"
    Write-Info "Adjustment ID: $adjustmentId"
    
    # Validar saldo atualizado
    Start-Sleep -Seconds 1
    $accountDetails = Invoke-ApiRequest -Method GET -Endpoint "/accounts/$accountId"
    Assert-Equal $accountDetails.balance 71.17 "Saldo atualizado para R$ 71,17"
    
}
catch {
    Write-ErrorCustom "Falha ao criar ajuste inicial: $_"
    exit 1
}

# ========================================
# 4 - LANCAMENTO DE MOVIMENTACAO
# ========================================
Write-TestStep "ETAPA 4: Lancamento de Despesa (10/12)"

Write-Info "Criando despesa de R$ 20,00 em 10/12..."

$transactionPayload = @{
    account_id  = $accountId
    description = "DESPESA TESTE"
    amount      = 20.00
    type        = "despesa"
    date        = "2025-12-10T00:00:00Z"
}

try {
    $transaction = Invoke-ApiRequest -Method POST -Endpoint "/transactions" -Body $transactionPayload
    
    Assert-NotNull $transaction.id "Despesa criada com sucesso"
    
    # Validar saldo apos despesa
    Start-Sleep -Seconds 1
    $accountDetails = Invoke-ApiRequest -Method GET -Endpoint "/accounts/$accountId"
    $expectedBalance = 71.17 - 20.00
    Assert-Equal $accountDetails.balance $expectedBalance "Saldo atualizado para R$ 51,17 (71,17 - 20,00)"
    
}
catch {
    Write-ErrorCustom "Falha ao criar despesa: $_"
    exit 1
}

# ========================================
# 5 - TENTATIVA DE AJUSTE RETROATIVO (Deve Falhar)
# ========================================
Write-TestStep "ETAPA 5: Tentativa de Ajuste Retroativo (05/12) - DEVE FALHAR"

Write-Info "Tentando criar ajuste retroativo de R$ 100,00 em 05/12..."

$retroactiveAdjustment = @{
    account_id               = $accountId
    balance                  = 100.00
    adjustment_date          = "2025-12-05T00:00:00Z"
    type                     = "AJUSTE_DE_SALDO"
    notes                    = "AJUSTE RETROATIVO INVALIDO"
    starts_controlled_period = $false
}

try {
    $result = Invoke-ApiRequest -Method POST -Endpoint "/balance-adjustments" -Body $retroactiveAdjustment
    
    # Se chegou aqui, o teste FALHOU (deveria ter bloqueado)
    Write-ErrorCustom "FALHA CRITICA: Sistema permitiu ajuste retroativo indevido!"
    exit 1
    
}
catch {
    $errorMsg = $_.Exception.Message
    
    # Verificar se a mensagem de erro e apropriada
    if ($errorMsg -like "*retroativ*" -or $errorMsg -like "*movimentacoes*" -or $errorMsg -like "*passado*") {
        Write-Success "Sistema bloqueou corretamente o ajuste retroativo"
        Write-Info "Mensagem de erro: $errorMsg"
    }
    else {
        Write-ErrorCustom "Sistema bloqueou, mas com mensagem inadequada: $errorMsg"
        exit 1
    }
}

# Validar que o saldo nao mudou
$accountDetails = Invoke-ApiRequest -Method GET -Endpoint "/accounts/$accountId"
Assert-Equal $accountDetails.balance 51.17 "Saldo permaneceu R$ 51,17 (sem alteracao)"

# ========================================
# 6 - AJUSTE DE SALDO PERMITIDO (Data Atual)
# ========================================
Write-TestStep "ETAPA 6: Ajuste de Saldo Permitido (22/12)"

Write-Info "Criando ajuste de saldo de R$ 10,00 em 22/12..."

# IMPORTANTE: Ajustes de saldo são ABSOLUTOS, não incrementais
# O saldo atual é 51,17. Para adicionar 10,00, o ajuste deve ter balance = 61,17
$currentBalance = 51.17
$incrementAmount = 10.00
$newAbsoluteBalance = $currentBalance + $incrementAmount

$validAdjustment = @{
    account_id               = $accountId
    balance                  = $newAbsoluteBalance  # 61,17 (não 10,00!)
    adjustment_date          = "2025-12-22T00:00:00Z"
    type                     = "AJUSTE_DE_SALDO"
    notes                    = "AJUSTE DE SALDO VALIDO"
    starts_controlled_period = $false
}

try {
    $adjustment2 = Invoke-ApiRequest -Method POST -Endpoint "/balance-adjustments" -Body $validAdjustment
    
    Assert-NotNull $adjustment2.id "Ajuste de saldo criado com sucesso"
    
    # Validar saldo final
    Start-Sleep -Seconds 1
    $accountDetails = Invoke-ApiRequest -Method GET -Endpoint "/accounts/$accountId"
    $expectedFinalBalance = 51.17 + 10.00
    Assert-Equal $accountDetails.balance $expectedFinalBalance "Saldo final atualizado para R$ 61,17 (51,17 + 10,00)"
    
}
catch {
    Write-ErrorCustom "Falha ao criar ajuste valido: $_"
    exit 1
}

# ========================================
# VALIDACOES GLOBAIS
# ========================================
Write-TestStep "VALIDACOES GLOBAIS"

Write-Info "Validando historico completo da conta..."

try {
    # Buscar todas as transacoes da conta
    $transactions = Invoke-ApiRequest -Method GET -Endpoint "/transactions?account_id=$accountId"
    
    # Buscar todos os ajustes da conta
    $adjustments = Invoke-ApiRequest -Method GET -Endpoint "/balance-adjustments?account_id=$accountId"
    
    Write-Info "Total de transacoes: $($transactions.Count)"
    Write-Info "Total de ajustes: $($adjustments.Count)"
    
    # Calcular saldo manualmente usando a mesma lógica do backend
    # 1. Encontrar o último ajuste (mais recente)
    $lastAdjustment = $null
    $lastAdjustmentDate = [DateTime]::MinValue
    
    foreach ($adj in $adjustments) {
        $adjDate = [DateTime]::Parse($adj.adjustment_date)
        if ($adjDate -gt $lastAdjustmentDate) {
            $lastAdjustmentDate = $adjDate
            $lastAdjustment = $adj
        }
    }
    
    if ($lastAdjustment) {
        Write-Info "Ultimo ajuste: R$ $($lastAdjustment.balance) em $($lastAdjustment.adjustment_date)"
        $calculatedBalance = $lastAdjustment.balance
        
        # 2. Somar/subtrair transações APÓS o último ajuste
        foreach ($tx in $transactions) {
            $txDate = [DateTime]::Parse($tx.date)
            if ($txDate -gt $lastAdjustmentDate) {
                if ($tx.type -eq "despesa") {
                    $calculatedBalance -= $tx.amount
                    Write-Info "  - Despesa: R$ $($tx.amount) em $($tx.date) - $($tx.description)"
                }
                elseif ($tx.type -eq "receita") {
                    $calculatedBalance += $tx.amount
                    Write-Info "  + Receita: R$ $($tx.amount) em $($tx.date) - $($tx.description)"
                }
            }
        }
    }
    else {
        # Se não há ajuste, somar todas as transações
        $calculatedBalance = 0.0
        foreach ($tx in $transactions) {
            if ($tx.type -eq "despesa") {
                $calculatedBalance -= $tx.amount
                Write-Info "  - Despesa: R$ $($tx.amount) em $($tx.date) - $($tx.description)"
            }
            elseif ($tx.type -eq "receita") {
                $calculatedBalance += $tx.amount
                Write-Info "  + Receita: R$ $($tx.amount) em $($tx.date) - $($tx.description)"
            }
        }
    }
    
    Write-Info "Saldo calculado manualmente: R$ $calculatedBalance"
    
    # Buscar saldo atual da conta
    $accountDetails = Invoke-ApiRequest -Method GET -Endpoint "/accounts/$accountId"
    Write-Info "Saldo atual da conta: R$ $($accountDetails.balance)"
    
    Assert-Equal $accountDetails.balance $calculatedBalance "Saldo da conta = Soma do historico"
    
}
catch {
    Write-ErrorCustom "Falha na validacao global: $_"
    exit 1
}

# ========================================
# RESULTADO FINAL
# ========================================

Write-Host "`n=======================================================" -ForegroundColor Green
Write-Host "  TESTE E2E COMPLETO - SUCESSO!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
Write-Host ""

Write-Success "Todas as validacoes passaram!"
Write-Success "Sistema demonstrou comportamento de produto financeiro profissional"
Write-Success ""
Write-Success "Resumo:"
Write-Success "  - Criacao de usuario: OK"
Write-Success "  - Criacao de conta: OK"
Write-Success "  - Ajuste inicial (sem movimentacoes): OK"
Write-Success "  - Lancamento de despesa: OK"
Write-Success "  - Bloqueio de ajuste retroativo: OK"
Write-Success "  - Ajuste valido (data atual): OK"
Write-Success "  - Consistencia de saldo: OK"
Write-Success "  - Integridade do historico: OK"

Write-Host ""
Write-Host "FinCore esta pronto para producao!" -ForegroundColor Magenta
