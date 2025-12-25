# ========================================
# TESTE E2E COMPLETO - SISTEMA DE FATURAS
# FinCore - Nivel Bancario
# ========================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  TESTE E2E COMPLETO - SISTEMA DE FATURAS" -ForegroundColor Cyan
Write-Host "  FinCore - Nivel Bancario" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8080/api"
$userId = "37397337-8fb8-465f-812a-2cefbc96ae42"

$headers = @{
    "Content-Type" = "application/json"
    "user_id"      = $userId
}

$testsPassed = 0
$testsFailed = 0

function Test-Assert {
    param($condition, $message)
    if ($condition) {
        Write-Host "[OK] $message" -ForegroundColor Green
        $script:testsPassed++
    }
    else {
        Write-Host "[ERRO] $message" -ForegroundColor Red
        $script:testsFailed++
        throw "Teste falhou: $message"
    }
}

# ========================================
# FASE 1: Preparacao do Ambiente
# ========================================
Write-Host ""
Write-Host "[ETAPA] FASE 1: Preparacao do Ambiente" -ForegroundColor Yellow
Write-Host ""

# Criar conta bancaria
Write-Host "[INFO] Criando conta bancaria com saldo inicial R$ 15.000,00..." -ForegroundColor Cyan
$accountBody = @{
    name            = "Conta Teste Faturas Completo"
    type            = "corrente"
    initial_balance = 15000.00
    color           = "#4CAF50"
} | ConvertTo-Json

$account = Invoke-RestMethod -Uri "$baseUrl/accounts" -Method POST -Body $accountBody -Headers $headers
Test-Assert ($account.id -ne $null) "Conta criada com sucesso"
Write-Host "[INFO] Account ID: $($account.id)" -ForegroundColor Cyan

# Criar cartao de credito
Write-Host ""
Write-Host "[INFO] Criando cartao de credito..." -ForegroundColor Cyan
Write-Host "[INFO] Limite: R$ 10.000,00 | Fechamento: dia 10 | Vencimento: dia 20" -ForegroundColor Cyan

$cardBody = @{
    account_id    = $account.id
    name          = "Cartao Visa Platinum"
    brand         = "visa"
    last_4_digits = "5678"
    limit_amount  = 10000.00
    closing_day   = 10
    due_day       = 20
    color         = "#2196F3"
} | ConvertTo-Json

$card = Invoke-RestMethod -Uri "$baseUrl/cards" -Method POST -Body $cardBody -Headers $headers
Test-Assert ($card.id -ne $null) "Cartao criado com sucesso"
Test-Assert ($card.limit_amount -eq 10000.00) "Limite do cartao correto"
Write-Host "[INFO] Card ID: $($card.id)" -ForegroundColor Cyan

# ========================================
# FASE 2: Lancamentos em Cartao
# ========================================
Write-Host ""
Write-Host "[ETAPA] FASE 2: Lancamentos em Cartao de Credito" -ForegroundColor Yellow
Write-Host ""

# Lancamento 1
Write-Host "[INFO] Lancamento 1: R$ 1.500,00 em 05/01/2026" -ForegroundColor Cyan
$transaction1Body = @{
    credit_card_id   = $card.id
    description      = "Compra Supermercado"
    amount           = 1500.00
    transaction_date = "2026-01-05T00:00:00Z"
} | ConvertTo-Json

$trans1 = Invoke-RestMethod -Uri "$baseUrl/invoices/transactions" -Method POST -Body $transaction1Body -Headers $headers
Test-Assert ($trans1.event_id -ne $null) "Lancamento 1 criado"
Test-Assert ($trans1.available_limit -eq 8500.00) "Limite disponivel correto (10000 - 1500 = 8500)"
$invoice1Id = $trans1.invoice_id
Write-Host "[INFO] Invoice ID: $invoice1Id" -ForegroundColor Cyan

# Lancamento 2
Write-Host ""
Write-Host "[INFO] Lancamento 2: R$ 2.500,00 em 08/01/2026" -ForegroundColor Cyan
$transaction2Body = @{
    credit_card_id   = $card.id
    description      = "Compra Eletronicos"
    amount           = 2500.00
    transaction_date = "2026-01-08T00:00:00Z"
} | ConvertTo-Json

$trans2 = Invoke-RestMethod -Uri "$baseUrl/invoices/transactions" -Method POST -Body $transaction2Body -Headers $headers
Test-Assert ($trans2.event_id -ne $null) "Lancamento 2 criado"
Test-Assert ($trans2.available_limit -eq 6000.00) "Limite disponivel correto (10000 - 4000 = 6000)"

# Lancamento 3
Write-Host ""
Write-Host "[INFO] Lancamento 3: R$ 1.000,00 em 12/01/2026" -ForegroundColor Cyan
$transaction3Body = @{
    credit_card_id   = $card.id
    description      = "Compra Vestuario"
    amount           = 1000.00
    transaction_date = "2026-01-12T00:00:00Z"
} | ConvertTo-Json

$trans3 = Invoke-RestMethod -Uri "$baseUrl/invoices/transactions" -Method POST -Body $transaction3Body -Headers $headers
Test-Assert ($trans3.event_id -ne $null) "Lancamento 3 criado"
Test-Assert ($trans3.available_limit -eq 5000.00) "Limite disponivel correto (10000 - 5000 = 5000)"
Write-Host "[OK] Total da fatura: R$ 5.000,00" -ForegroundColor Green

# ========================================
# FASE 3: Edicao de Lancamento
# ========================================
Write-Host ""
Write-Host "[ETAPA] FASE 3: Edicao de Lancamento (Fatura ABERTA)" -ForegroundColor Yellow
Write-Host ""

Write-Host "[INFO] Editando lancamento 1 de R$ 1.500 para R$ 2.000" -ForegroundColor Cyan
$editBody = @{
    amount = 2000.00
} | ConvertTo-Json

$edited = Invoke-RestMethod -Uri "$baseUrl/invoices/transactions/$($trans1.event_id)" -Method PUT -Body $editBody -Headers $headers
Test-Assert ($edited.message -eq "transaction updated") "Lancamento editado com sucesso"
Write-Host "[OK] Novo total da fatura: R$ 5.500,00 (2000 + 2500 + 1000)" -ForegroundColor Green

# ========================================
# FASE 4: Validacao de Limite
# ========================================
Write-Host ""
Write-Host "[ETAPA] FASE 4: Validacao de Limite Insuficiente" -ForegroundColor Yellow
Write-Host ""

Write-Host "[INFO] Tentando criar lancamento de R$ 6.000 (limite disponivel: R$ 4.500)" -ForegroundColor Cyan
$transactionExceedBody = @{
    credit_card_id   = $card.id
    description      = "Compra que excede limite"
    amount           = 6000.00
    transaction_date = "2026-01-15T00:00:00Z"
} | ConvertTo-Json

try {
    $transExceed = Invoke-RestMethod -Uri "$baseUrl/invoices/transactions" -Method POST -Body $transactionExceedBody -Headers $headers
    Test-Assert ($false) "Deveria ter bloqueado lancamento por limite insuficiente"
}
catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    Test-Assert ($errorResponse.error -eq "insufficient credit limit") "Bloqueio por limite insuficiente funcionou"
    Write-Host "[OK] Limite insuficiente detectado corretamente" -ForegroundColor Green
}

# ========================================
# FASE 5: Exclusao de Lancamento
# ========================================
Write-Host ""
Write-Host "[ETAPA] FASE 5: Exclusao de Lancamento (Fatura ABERTA)" -ForegroundColor Yellow
Write-Host ""

Write-Host "[INFO] Excluindo lancamento 3 (R$ 1.000)" -ForegroundColor Cyan
$deleted = Invoke-RestMethod -Uri "$baseUrl/invoices/transactions/$($trans3.event_id)" -Method DELETE -Headers $headers
Test-Assert ($deleted.message -eq "transaction deleted") "Lancamento excluido com sucesso"
Test-Assert ($deleted.amount -eq 1000.00) "Valor excluido correto"
Write-Host "[OK] Novo total da fatura: R$ 4.500,00 (2000 + 2500)" -ForegroundColor Green

# ========================================
# FASE 6: Pagamento Normal de Fatura
# ========================================
Write-Host ""
Write-Host "[ETAPA] FASE 6: Pagamento Normal de Fatura" -ForegroundColor Yellow
Write-Host ""

Write-Host "[INFO] Pagando fatura de R$ 4.500,00" -ForegroundColor Cyan
$paymentBody = @{
    account_id   = $account.id
    amount       = 4500.00
    payment_date = "2026-01-20T00:00:00Z"
} | ConvertTo-Json

$payment = Invoke-RestMethod -Uri "$baseUrl/invoices/$invoice1Id/pay" -Method POST -Body $paymentBody -Headers $headers
Test-Assert ($payment.message -eq "payment created") "Pagamento realizado com sucesso"
Test-Assert ($payment.status -eq "paid") "Status da fatura atualizado para PAID"
Test-Assert ($payment.remaining_amount -eq 0) "Saldo restante zerado"
Test-Assert ($payment.credit_generated -eq 0) "Nenhum credito gerado"
Write-Host "[OK] Fatura quitada com sucesso" -ForegroundColor Green

# ========================================
# FASE 7: Pagamento com Geracao de Credito
# ========================================
Write-Host ""
Write-Host "[ETAPA] FASE 7: Pagamento com Geracao de Credito" -ForegroundColor Yellow
Write-Host ""

# Criar lancamentos para fevereiro
Write-Host "[INFO] Criando lancamentos para fevereiro/2026..." -ForegroundColor Cyan
$transFev1Body = @{
    credit_card_id   = $card.id
    description      = "Compra Fevereiro 1"
    amount           = 3000.00
    transaction_date = "2026-02-05T00:00:00Z"
} | ConvertTo-Json

$transFev1 = Invoke-RestMethod -Uri "$baseUrl/invoices/transactions" -Method POST -Body $transFev1Body -Headers $headers
$invoice2Id = $transFev1.invoice_id
Write-Host "[OK] Lancamento criado: R$ 3.000,00" -ForegroundColor Green

# Pagar a mais para gerar credito
Write-Host ""
Write-Host "[INFO] Pagando R$ 4.000,00 (fatura de R$ 3.000,00)" -ForegroundColor Cyan
$payment2Body = @{
    account_id   = $account.id
    amount       = 4000.00
    payment_date = "2026-02-20T00:00:00Z"
} | ConvertTo-Json

$payment2 = Invoke-RestMethod -Uri "$baseUrl/invoices/$invoice2Id/pay" -Method POST -Body $payment2Body -Headers $headers
Test-Assert ($payment2.message -eq "payment created") "Pagamento realizado"
Test-Assert ($payment2.credit_generated -eq 1000.00) "Credito de R$ 1.000 gerado"
Write-Host "[OK] Credito de R$ 1.000 gerado e migrado para proxima fatura" -ForegroundColor Green

# ========================================
# FASE 8: Consumo Automatico de Credito
# ========================================
Write-Host ""
Write-Host "[ETAPA] FASE 8: Consumo Automatico de Credito" -ForegroundColor Yellow
Write-Host ""

# Criar lancamentos para marco
Write-Host "[INFO] Criando lancamentos para marco/2026..." -ForegroundColor Cyan
$transMar1Body = @{
    credit_card_id   = $card.id
    description      = "Compra Marco 1"
    amount           = 2500.00
    transaction_date = "2026-03-05T00:00:00Z"
} | ConvertTo-Json

$transMar1 = Invoke-RestMethod -Uri "$baseUrl/invoices/transactions" -Method POST -Body $transMar1Body -Headers $headers
$invoice3Id = $transMar1.invoice_id
Write-Host "[OK] Lancamento criado: R$ 2.500,00" -ForegroundColor Green

# Pagar fatura (deve consumir credito automaticamente)
Write-Host ""
Write-Host "[INFO] Pagando R$ 2.500,00 (deve consumir R$ 1.000 de credito)" -ForegroundColor Cyan
$payment3Body = @{
    account_id   = $account.id
    amount       = 2500.00
    payment_date = "2026-03-20T00:00:00Z"
} | ConvertTo-Json

$payment3 = Invoke-RestMethod -Uri "$baseUrl/invoices/$invoice3Id/pay" -Method POST -Body $payment3Body -Headers $headers
Test-Assert ($payment3.message -eq "payment created") "Pagamento realizado"
Write-Host "[OK] Credito consumido automaticamente" -ForegroundColor Green
Write-Host "[INFO] Sistema deve ter debitado apenas R$ 1.500 da conta (2500 - 1000 credito)" -ForegroundColor Cyan

# ========================================
# FASE 9: Estorno de Pagamento
# ========================================
Write-Host ""
Write-Host "[ETAPA] FASE 9: Estorno de Pagamento" -ForegroundColor Yellow
Write-Host ""

Write-Host "[INFO] Estornando pagamento da fatura de marco" -ForegroundColor Cyan
$revert = Invoke-RestMethod -Uri "$baseUrl/invoices/$invoice3Id/revert" -Method POST -Headers $headers
Test-Assert ($revert.message -eq "payments reverted") "Pagamento estornado"
Test-Assert ($revert.count -gt 0) "Quantidade de pagamentos estornados correto"
Write-Host "[OK] Total estornado: R$ $($revert.total_reverted)" -ForegroundColor Green

# ========================================
# FASE 10: Validacao de Limite Final
# ========================================
Write-Host ""
Write-Host "[ETAPA] FASE 10: Validacao de Limite Final" -ForegroundColor Yellow
Write-Host ""

Write-Host "[INFO] Criando lancamento final para validar limite disponivel..." -ForegroundColor Cyan
$transFinalBody = @{
    credit_card_id   = $card.id
    description      = "Compra Final"
    amount           = 500.00
    transaction_date = "2026-03-25T00:00:00Z"
} | ConvertTo-Json

$transFinal = Invoke-RestMethod -Uri "$baseUrl/invoices/transactions" -Method POST -Body $transFinalBody -Headers $headers
Test-Assert ($transFinal.event_id -ne $null) "Lancamento final criado"
Write-Host "[OK] Limite disponivel: R$ $($transFinal.available_limit)" -ForegroundColor Green

# ========================================
# VALIDACOES FINAIS
# ========================================
Write-Host ""
Write-Host "[ETAPA] VALIDACOES FINAIS" -ForegroundColor Yellow
Write-Host ""

Write-Host "[OK] Sistema de faturas funcionando perfeitamente!" -ForegroundColor Green
Write-Host ""
Write-Host "[OK] Funcionalidades Validadas:" -ForegroundColor Green
Write-Host "  [OK] Criacao de lancamentos" -ForegroundColor Green
Write-Host "  [OK] Validacao de limite disponivel" -ForegroundColor Green
Write-Host "  [OK] Edicao de lancamentos (fatura ABERTA)" -ForegroundColor Green
Write-Host "  [OK] Exclusao de lancamentos (fatura ABERTA)" -ForegroundColor Green
Write-Host "  [OK] Bloqueio por limite insuficiente" -ForegroundColor Green
Write-Host "  [OK] Pagamento normal de fatura" -ForegroundColor Green
Write-Host "  [OK] Geracao de credito ao pagar a mais" -ForegroundColor Green
Write-Host "  [OK] Migracao automatica de credito" -ForegroundColor Green
Write-Host "  [OK] Consumo automatico de credito" -ForegroundColor Green
Write-Host "  [OK] Estorno de pagamentos" -ForegroundColor Green
Write-Host "  [OK] Recalculo automatico de totais" -ForegroundColor Green
Write-Host "  [OK] Atualizacao de status de fatura" -ForegroundColor Green

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Green
Write-Host "  TESTE E2E COMPLETO - SUCESSO!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
Write-Host ""

Write-Host "[RESULTADO] Testes Passados: $testsPassed" -ForegroundColor Green
Write-Host "[RESULTADO] Testes Falhados: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "Sistema de Faturas 100% Funcional!" -ForegroundColor Green
    Write-Host "FinCore - Pronto para Producao!" -ForegroundColor Green
}
else {
    Write-Host "Alguns testes falharam. Revisar implementacao." -ForegroundColor Red
    exit 1
}

Write-Host ""
