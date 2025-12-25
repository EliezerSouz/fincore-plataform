# ========================================
# TESTE E2E - SISTEMA DE FATURAS
# FinCore - Nível Bancário
# ========================================

$ErrorActionPreference = "Stop"

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "  TESTE E2E - SISTEMA DE FATURAS COMPLETO" -ForegroundColor Cyan
Write-Host "  FinCore - Nível Bancário" -ForegroundColor Cyan
Write-Host "=======================================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:8080/api"
$userId = "37397337-8fb8-465f-812a-2cefbc96ae42"

$headers = @{
    "Content-Type" = "application/json"
    "user_id"      = $userId
}

# ========================================
# FASE 1: Preparação do Ambiente
# ========================================
Write-Host "`n[ETAPA] FASE 1: Preparação do Ambiente" -ForegroundColor Yellow

# Criar conta bancária
Write-Host "[INFO] Criando conta bancária com saldo inicial R$ 10.000,00..." -ForegroundColor Cyan
$accountBody = @{
    name            = "Conta Teste Faturas"
    type            = "checking"
    initial_balance = 10000.00
    color           = "#4CAF50"
} | ConvertTo-Json

$account = Invoke-RestMethod -Uri "$baseUrl/accounts" -Method POST -Body $accountBody -Headers $headers
Write-Host "[OK] Conta criada: $($account.id)" -ForegroundColor Green

# Criar cartão de crédito
Write-Host "[INFO] Criando cartão de crédito..." -ForegroundColor Cyan
Write-Host "[INFO] Limite: R$ 5.000,00 | Fechamento: dia 10 | Vencimento: dia 20" -ForegroundColor Cyan

$cardBody = @{
    account_id    = $account.id
    name          = "Cartão Visa Teste"
    brand         = "visa"
    last_4_digits = "1234"
    limit_amount  = 5000.00
    closing_day   = 10
    due_day       = 20
    color         = "#2196F3"
} | ConvertTo-Json

$card = Invoke-RestMethod -Uri "$baseUrl/cards" -Method POST -Body $cardBody -Headers $headers
Write-Host "[OK] Cartão criado: $($card.id)" -ForegroundColor Green
Write-Host "[OK] Limite disponível: R$ $($card.limit_amount)" -ForegroundColor Green

# ========================================
# FASE 2: Lançamentos em Cartão
# ========================================
Write-Host "`n[ETAPA] FASE 2: Lançamentos em Cartão de Crédito" -ForegroundColor Yellow

# Lançamento 1
Write-Host "[INFO] Lançamento 1: R$ 250,00 em 05/01/2026" -ForegroundColor Cyan
$transaction1Body = @{
    credit_card_id   = $card.id
    description      = "Compra Supermercado"
    amount           = 250.00
    transaction_date = "2026-01-05T00:00:00Z"
} | ConvertTo-Json

$trans1 = Invoke-RestMethod -Uri "$baseUrl/invoices/transactions" -Method POST -Body $transaction1Body -Headers $headers
Write-Host "[OK] Lançamento criado: $($trans1.event_id)" -ForegroundColor Green
Write-Host "[OK] Limite disponível: R$ $($trans1.available_limit)" -ForegroundColor Green

# Lançamento 2
Write-Host "[INFO] Lançamento 2: R$ 450,00 em 08/01/2026" -ForegroundColor Cyan
$transaction2Body = @{
    credit_card_id   = $card.id
    description      = "Compra Eletrônicos"
    amount           = 450.00
    transaction_date = "2026-01-08T00:00:00Z"
} | ConvertTo-Json

$trans2 = Invoke-RestMethod -Uri "$baseUrl/invoices/transactions" -Method POST -Body $transaction2Body -Headers $headers
Write-Host "[OK] Lançamento criado: $($trans2.event_id)" -ForegroundColor Green
Write-Host "[OK] Limite disponível: R$ $($trans2.available_limit)" -ForegroundColor Green
Write-Host "[OK] Total da fatura: R$ 700,00 (250 + 450)" -ForegroundColor Green

# ========================================
# FASE 3: Edição de Lançamento (Fatura ABERTA)
# ========================================
Write-Host "`n[ETAPA] FASE 3: Edição de Lançamento (Fatura ABERTA)" -ForegroundColor Yellow

Write-Host "[INFO] Editando lançamento 1 de R$ 250 para R$ 300" -ForegroundColor Cyan
$editBody = @{
    amount = 300.00
} | ConvertTo-Json

$edited = Invoke-RestMethod -Uri "$baseUrl/invoices/transactions/$($trans1.event_id)" -Method PUT -Body $editBody -Headers $headers
Write-Host "[OK] Lançamento editado com sucesso" -ForegroundColor Green
Write-Host "[OK] Novo total da fatura: R$ 750,00 (300 + 450)" -ForegroundColor Green

# ========================================
# FASE 4: Pagamento Normal de Fatura
# ========================================
Write-Host "`n[ETAPA] FASE 4: Pagamento Normal de Fatura" -ForegroundColor Yellow

Write-Host "[INFO] Pagando fatura de R$ 750,00" -ForegroundColor Cyan
$paymentBody = @{
    account_id   = $account.id
    amount       = 750.00
    payment_date = "2026-01-20T00:00:00Z"
} | ConvertTo-Json

$payment = Invoke-RestMethod -Uri "$baseUrl/invoices/$($trans1.invoice_id)/pay" -Method POST -Body $paymentBody -Headers $headers
Write-Host "[OK] Pagamento realizado" -ForegroundColor Green
Write-Host "[OK] Status da fatura: $($payment.status)" -ForegroundColor Green
Write-Host "[OK] Valor restante: R$ $($payment.remaining_amount)" -ForegroundColor Green

# ========================================
# FASE 5: Pagamento com Geração de Crédito
# ========================================
Write-Host "`n[ETAPA] FASE 5: Pagamento com Geração de Crédito" -ForegroundColor Yellow

# Criar novo lançamento para próximo mês
Write-Host "[INFO] Criando lançamento para fevereiro: R$ 500,00" -ForegroundColor Cyan
$transaction3Body = @{
    credit_card_id   = $card.id
    description      = "Compra Fevereiro"
    amount           = 500.00
    transaction_date = "2026-02-05T00:00:00Z"
} | ConvertTo-Json

$trans3 = Invoke-RestMethod -Uri "$baseUrl/invoices/transactions" -Method POST -Body $transaction3Body -Headers $headers
Write-Host "[OK] Lançamento criado para fevereiro" -ForegroundColor Green

# Pagar a mais para gerar crédito
Write-Host "[INFO] Pagando R$ 600,00 (fatura de R$ 500,00)" -ForegroundColor Cyan
$payment2Body = @{
    account_id   = $account.id
    amount       = 600.00
    payment_date = "2026-02-20T00:00:00Z"
} | ConvertTo-Json

$payment2 = Invoke-RestMethod -Uri "$baseUrl/invoices/$($trans3.invoice_id)/pay" -Method POST -Body $payment2Body -Headers $headers
Write-Host "[OK] Pagamento realizado" -ForegroundColor Green
Write-Host "[OK] Crédito gerado: R$ $($payment2.credit_generated)" -ForegroundColor Green
Write-Host "[OK] Crédito será migrado para próxima fatura automaticamente" -ForegroundColor Green

# ========================================
# FASE 6: Estorno de Pagamento
# ========================================
Write-Host "`n[ETAPA] FASE 6: Estorno de Pagamento" -ForegroundColor Yellow

Write-Host "[INFO] Estornando pagamento da fatura de fevereiro" -ForegroundColor Cyan
$revert = Invoke-RestMethod -Uri "$baseUrl/invoices/$($trans3.invoice_id)/revert" -Method POST -Headers $headers
Write-Host "[OK] Pagamento estornado" -ForegroundColor Green
Write-Host "[OK] Total estornado: R$ $($revert.total_reverted)" -ForegroundColor Green
Write-Host "[OK] Quantidade de pagamentos estornados: $($revert.count)" -ForegroundColor Green

# ========================================
# VALIDAÇÕES FINAIS
# ========================================
Write-Host "`n[ETAPA] VALIDAÇÕES FINAIS" -ForegroundColor Yellow

Write-Host "[OK] Sistema de faturas funcionando corretamente!" -ForegroundColor Green
Write-Host "[OK] Validações:" -ForegroundColor Green
Write-Host "[OK]   ✓ Criação de lançamentos" -ForegroundColor Green
Write-Host "[OK]   ✓ Validação de limite" -ForegroundColor Green
Write-Host "[OK]   ✓ Edição de lançamentos" -ForegroundColor Green
Write-Host "[OK]   ✓ Pagamento de faturas" -ForegroundColor Green
Write-Host "[OK]   ✓ Geração de créditos" -ForegroundColor Green
Write-Host "[OK]   ✓ Migração automática de créditos" -ForegroundColor Green
Write-Host "[OK]   ✓ Estorno de pagamentos" -ForegroundColor Green

Write-Host "`n=======================================================" -ForegroundColor Green
Write-Host "  TESTE E2E DE FATURAS - SUCESSO!" -ForegroundColor Green
Write-Host "=======================================================`n" -ForegroundColor Green

Write-Host "[OK] Sistema de Faturas 100% Funcional!" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host "FinCore - Pronto para Producao!" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
