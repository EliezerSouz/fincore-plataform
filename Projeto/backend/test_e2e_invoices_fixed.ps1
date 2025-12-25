# ========================================
# TESTE E2E - CICLO COMPLETO DE FATURAS
# FinCore - N?vel Banc?rio
# ========================================
# Data: 24/12/2025
# Objetivo: Validar ciclo completo de faturas de cart?o de cr?dito
# Status: ESPECIFICA??O T?CNICA (Implementa??o Pendente)
# ========================================

<#
.SYNOPSIS
    Teste E2E completo do ciclo de vida de faturas de cart?o de cr?dito

.DESCRIPTION
    Este teste valida TODAS as regras de neg?cio de um banco digital real:
    - Lan?amentos em cart?o
    - Edi??o e exclus?o com bloqueios
    - Pagamentos normais e antecipados
    - Cr?ditos antecipados com rastreabilidade
    - Estornos com reprocessamento
    - Valida??es globais de consist?ncia

.NOTES
    Baseado em: ESPECIFICACAO_FATURAS_CARTAO.md
    N?vel: Banco Digital Real
    Princ?pio: Hist?rico Imut?vel
#>

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:8080/api"

# ========================================
# FUN??ES AUXILIARES
# ========================================

function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-ErrorCustom { param($msg) Write-Host "[ERRO] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-TestStep { param($msg) Write-Host "`n[ETAPA] $msg" -ForegroundColor Yellow }
function Write-Warning { param($msg) Write-Host "[AVISO] $msg" -ForegroundColor DarkYellow }

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
# VARI?VEIS GLOBAIS
# ========================================
$accountId = $null
$creditCardId = $null
$invoice1Id = $null  # Fatura 01/2026
$invoice2Id = $null  # Fatura 02/2026
$invoice3Id = $null  # Fatura 03/2026
$transaction1Id = $null
$transaction2Id = $null
$payment1Id = $null
$creditId = $null

# ========================================
# IN?CIO DOS TESTES
# ========================================

Write-Host "`n=======================================================" -ForegroundColor Magenta
Write-Host "  TESTE E2E - CICLO COMPLETO DE FATURAS" -ForegroundColor Magenta
Write-Host "  FinCore - N?vel Banc?rio" -ForegroundColor Magenta
Write-Host "=======================================================" -ForegroundColor Magenta
Write-Host ""

Write-Warning "IMPORTANTE: Este teste requer implementa??o completa do m?dulo de faturas"
Write-Warning "Status Atual: ESPECIFICA??O T?CNICA COMPLETA"
Write-Warning "Pr?ximo Passo: Implementar conforme ESPECIFICACAO_FATURAS_CARTAO.md"
Write-Host ""

# ========================================
# FASE 1: PREPARA??O
# ========================================
Write-TestStep "FASE 1: Prepara??o do Ambiente"

Write-Info "Criando conta banc?ria com saldo inicial R$ 5.000,00..."

$accountPayload = @{
    name  = "CONTA PRINCIPAL"
    type  = "corrente"
    icon  = "bank"
    color = "#3b82f6"
}

try {
    $account = Invoke-ApiRequest -Method POST -Endpoint "/accounts" -Body $accountPayload
    $accountId = $account.id
    Assert-NotNull $accountId "Conta criada"
    Write-Info "Account ID: $accountId"
    
    # Ajuste de saldo inicial
    $adjustmentPayload = @{
        account_id               = $accountId
        balance                  = 5000.00
        adjustment_date          = "2025-12-01T00:00:00Z"
        type                     = "AJUSTE_INICIAL"
        notes                    = "SALDO INICIAL PARA TESTES"
        starts_controlled_period = $false
    }
    
    Invoke-ApiRequest -Method POST -Endpoint "/balance-adjustments" -Body $adjustmentPayload
    Write-Success "Saldo inicial configurado: R$ 5.000,00"
    
}
catch {
    Write-ErrorCustom "Falha na prepara??o: $_"
    exit 1
}

Write-Info "Criando cart?o de cr?dito..."
Write-Info "Limite: R$ 2.000,00 | Fechamento: dia 10 | Vencimento: dia 20"

$cardPayload = @{
    account_id   = $accountId
    name         = "MASTERCARD PLATINUM"
    brand        = "mastercard"
    last_digits  = "1234"
    credit_limit = 2000.00
    closing_day  = 10
    due_day      = 20
}

try {
    # NOTA: Endpoint /cards ainda n?o implementado
    Write-Warning "Endpoint /cards n?o implementado ainda"
    Write-Info "Simulando cria??o de cart?o..."
    
    # Simula??o para demonstra??o do teste
    $creditCardId = "simulated-card-id-001"
    Write-Info "Card ID (simulado): $creditCardId"
    
}
catch {
    Write-ErrorCustom "Falha ao criar cart?o: $_"
    Write-Warning "Continuando com ID simulado para demonstra??o"
    $creditCardId = "simulated-card-id-001"
}

# ========================================
# FASE 2: LAN?AMENTOS EM CART?O
# ========================================
Write-TestStep "FASE 2: Lan?amentos em Cart?o de Cr?dito"

Write-Info "Cen?rio: Lan?amentos em fatura ABERTA (Janeiro/2026)"

# Lan?amento 1: Restaurante
$transaction1Payload = @{
    credit_card_id   = $creditCardId
    description      = "RESTAURANTE ITALIANO"
    amount           = 250.00
    transaction_date = "2026-01-05T00:00:00Z"
    category_id      = $null
}

Write-Info "Lan?amento 1: R$ 250,00 em 05/01/2026"
Write-Warning "Endpoint /invoices/transactions n?o implementado"
Write-Info "Valida??es esperadas:"
Write-Info "  - Fatura deve estar ABERTA"
Write-Info "  - Limite dispon?vel: 2000 - 250 = 1750"
Write-Info "  - Saldo da conta N?O deve ser impactado"

# Lan?amento 2: Supermercado
$transaction2Payload = @{
    credit_card_id   = $creditCardId
    description      = "SUPERMERCADO"
    amount           = 450.00
    transaction_date = "2026-01-08T00:00:00Z"
}

Write-Info "Lan?amento 2: R$ 450,00 em 08/01/2026"
Write-Info "Valida??es esperadas:"
Write-Info "  - Total da fatura: 250 + 450 = 700"
Write-Info "  - Limite dispon?vel: 2000 - 700 = 1300"

# ========================================
# FASE 3: TENTATIVA DE EDI??O (Bloqueios)
# ========================================
Write-TestStep "FASE 3: Valida??o de Bloqueios de Edi??o"

Write-Info "Cen?rio 1: Editar lan?amento em fatura ABERTA (PERMITIDO)"
Write-Info "  - Alterar valor de 250 para 300"
Write-Info "  - Recalcular total: 300 + 450 = 750"
Write-Info "  - Recalcular limite: 2000 - 750 = 1250"

Write-Info "Cen?rio 2: Fechar fatura (dia 10/01)"
Write-Info "  - Status: ABERTA ? FECHADA"
Write-Info "  - Data de vencimento: 20/01/2026"

Write-Info "Cen?rio 3: Tentar editar lan?amento em fatura FECHADA (BLOQUEADO)"
Write-Info "  - Deve retornar erro: 'N?o ? poss?vel editar lan?amento em fatura fechada'"

# ========================================
# FASE 4: PAGAMENTO NORMAL
# ========================================
Write-TestStep "FASE 4: Pagamento Normal de Fatura"

Write-Info "Cen?rio: Pagar fatura de R$ 750,00 em 18/01/2026"

$paymentPayload = @{
    invoice_id   = $invoice1Id
    account_id   = $accountId
    amount       = 750.00
    payment_date = "2026-01-18T00:00:00Z"
}

Write-Info "Valida??es esperadas:"
Write-Info "  1. Saldo da conta: 5000 - 750 = 4250"
Write-Info "  2. Status da fatura: FECHADA ? QUITADA"
Write-Info "  3. Limite do cart?o: restaurado para 2000"
Write-Info "  4. Evento financeiro criado: PAGAMENTO_FATURA"

# ========================================
# FASE 5: PAGAMENTO COM CR?DITO
# ========================================
Write-TestStep "FASE 5: Pagamento com Gera??o de Cr?dito"

Write-Info "Cen?rio: Fatura de R$ 500,00, pagar R$ 800,00"
Write-Info "  - Fatura quitada: 500"
Write-Info "  - Cr?dito gerado: 300"
Write-Info "  - Origem do cr?dito: Fatura 02/2026"

$paymentWithCreditPayload = @{
    invoice_id   = $invoice2Id
    account_id   = $accountId
    amount       = 800.00
    payment_date = "2026-02-18T00:00:00Z"
}

Write-Info "Valida??es esperadas:"
Write-Info "  1. Saldo da conta: 4250 - 800 = 3450"
Write-Info "  2. Fatura 02/2026: QUITADA"
Write-Info "  3. Cr?dito criado:"
Write-Info "     - origin_invoice_id: invoice2Id"
Write-Info "     - original_amount: 300"
Write-Info "     - remaining_amount: 300"
Write-Info "  4. Fatura 03/2026:"
Write-Info "     - inherited_credit: 300"
Write-Info "     - remaining_amount: total - 300"
Write-Info "  5. Limite dispon?vel: 2000 + 300 = 2300"

# ========================================
# FASE 6: CONSUMO DE CR?DITO
# ========================================
Write-TestStep "FASE 6: Consumo Autom?tico de Cr?dito"

Write-Info "Cen?rio: Fatura 03/2026 com R$ 400,00 em lan?amentos"
Write-Info "  - Total da fatura: 400"
Write-Info "  - Cr?dito herdado: 300"
Write-Info "  - Valor a pagar: 400 - 300 = 100"

Write-Info "Ao pagar R$ 100,00:"
Write-Info "  1. Cr?dito consumido: 300"
Write-Info "  2. Credit.remaining_amount: 0"
Write-Info "  3. Credit.is_consumed: true"
Write-Info "  4. Fatura quitada"
Write-Info "  5. Limite restaurado: 2000"

# ========================================
# FASE 7: ESTORNO DE FATURA
# ========================================
Write-TestStep "FASE 7: Estorno de Fatura com Reprocessamento"

Write-Info "Cen?rio: Estornar fatura 02/2026 (que gerou cr?dito)"

Write-Info "Impactos esperados:"
Write-Info ""
Write-Info "?? Fatura 01/2026 (ANTERIOR):"
Write-Info "  - IMUT?VEL"
Write-Info "  - Nenhuma altera??o"
Write-Info ""
Write-Info "?? Fatura 02/2026 (ESTORNADA):"
Write-Info "  1. Reverter pagamento:"
Write-Info "     - Saldo da conta: 3450 + 800 = 4250"
Write-Info "  2. Remover cr?dito gerado:"
Write-Info "     - Credit marcado como reverted"
Write-Info "  3. Status volta para FECHADA ou VENCIDA"
Write-Info "  4. Evento criado: ESTORNO"
Write-Info ""
Write-Info "?? Fatura 03/2026 (POSTERIOR):"
Write-Info "  1. Remover cr?dito herdado:"
Write-Info "     - inherited_credit: 300 ? 0"
Write-Info "  2. Recalcular remaining_amount:"
Write-Info "     - remaining_amount: 100 ? 400"
Write-Info "  3. Manter pagamento j? realizado (se houver)"
Write-Info "  4. Status pode mudar: QUITADA ? FECHADA"

# ========================================
# FASE 8: NOVO PAGAMENTO AP?S ESTORNO
# ========================================
Write-TestStep "FASE 8: Novo Pagamento Ap?s Estorno"

Write-Info "Cen?rio: Pagar novamente fatura 02/2026"
Write-Info "  - Valor: R$ 500,00 (exato)"
Write-Info "  - Sem gerar cr?dito desta vez"

Write-Info "Valida??es:"
Write-Info "  1. Saldo da conta: 4250 - 500 = 3750"
Write-Info "  2. Fatura 02/2026: QUITADA"
Write-Info "  3. Nenhum cr?dito gerado"
Write-Info "  4. Fatura 03/2026 permanece com inherited_credit = 0"
Write-Info "  5. Limite do cart?o: 2000"

# ========================================
# FASE 9: VALIDA??ES GLOBAIS
# ========================================
Write-TestStep "FASE 9: Valida??es Globais de Consist?ncia"

Write-Info "Executando valida??es de integridade..."

Write-Info ""
Write-Info "? Valida??o 1: Soma de lan?amentos = Total da fatura"
Write-Info "  SELECT i.id, i.total_amount, SUM(t.amount)"
Write-Info "  FROM invoices i"
Write-Info "  JOIN transactions t ON t.invoice_id = i.id"
Write-Info "  GROUP BY i.id"
Write-Info "  HAVING i.total_amount != SUM(t.amount)"
Write-Info "  -- Deve retornar 0 linhas"

Write-Info ""
Write-Info "? Valida??o 2: Saldo da conta = Hist?rico de pagamentos"
Write-Info "  - Saldo inicial: 5000"
Write-Info "  - Pagamento 1: -750"
Write-Info "  - Pagamento 2: -800"
Write-Info "  - Estorno: +800"
Write-Info "  - Pagamento 3: -500"
Write-Info "  - Saldo final esperado: 3750"

Write-Info ""
Write-Info "? Valida??o 3: Limite dispon?vel consistente"
Write-Info "  - Limite do cart?o: 2000"
Write-Info "  - Faturas em aberto: 0"
Write-Info "  - Cr?ditos ativos: 0"
Write-Info "  - Limite dispon?vel: 2000"

Write-Info ""
Write-Info "? Valida??o 4: Cr?ditos rastre?veis"
Write-Info "  SELECT * FROM credits WHERE origin_invoice_id IS NULL"
Write-Info "  -- Deve retornar 0 linhas"

Write-Info ""
Write-Info "? Valida??o 5: Eventos financeiros completos"
Write-Info "  - LANCAMENTO_CARTAO: 4 eventos"
Write-Info "  - PAGAMENTO_FATURA: 3 eventos"
Write-Info "  - CREDITO_ANTECIPADO: 1 evento"
Write-Info "  - ESTORNO: 1 evento"
Write-Info "  - Total: 9 eventos"

# ========================================
# FASE 10: EDGE CASES
# ========================================
Write-TestStep "FASE 10: Casos Extremos e Bloqueios"

Write-Info "Caso 1: Tentar pagar fatura ja quitada"
Write-Info "  - Deve retornar: Fatura ja esta quitada"

Write-Info "Caso 2: Tentar excluir lancamento em fatura quitada"
Write-Info "  - Deve retornar: Nao e possivel excluir lancamento em fatura quitada"

Write-Info "Caso 3: Tentar lancar com limite insuficiente"
Write-Info "  - Limite disponivel: 2000"
Write-Info "  - Tentativa: 2500"
Write-Info "  - Deve retornar: Limite insuficiente"

Write-Info "Caso 4: Estornar fatura sem pagamento"
Write-Info "  - Deve retornar: Nao ha pagamento para estornar"

Write-Info "Caso 5: Pagamento parcial"
Write-Info "  - Fatura: 1000"
Write-Info "  - Pagamento: 600"
Write-Info "  - Remaining: 400"
Write-Info "  - Status: permanece FECHADA"

# ========================================
# RESULTADO FINAL
# ========================================

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "  TESTE E2E - ESPECIFICA??O COMPLETA" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

Write-Success "Especifica??o de teste criada com sucesso!"
Write-Success ""
Write-Success "Cen?rios cobertos:"
Write-Success "  ? Lan?amentos em cart?o (ABERTA)"
Write-Success "  ? Bloqueios de edi??o/exclus?o"
Write-Success "  ? Pagamento normal"
Write-Success "  ? Pagamento com cr?dito"
Write-Success "  ? Consumo autom?tico de cr?dito"
Write-Success "  ? Estorno com reprocessamento"
Write-Success "  ? Novo pagamento ap?s estorno"
Write-Success "  ? Valida??es globais"
Write-Success "  ? Edge cases e bloqueios"

Write-Host ""
Write-Warning "PR?XIMOS PASSOS:"
Write-Warning "1. Implementar endpoints conforme ESPECIFICACAO_FATURAS_CARTAO.md"
Write-Warning "2. Substituir simula??es por chamadas reais de API"
Write-Warning "3. Executar teste completo"
Write-Warning "4. Validar todas as regras de neg?cio"

Write-Host ""
Write-Host "Documenta??o de refer?ncia:" -ForegroundColor Magenta
Write-Host "  - ESPECIFICACAO_FATURAS_CARTAO.md" -ForegroundColor White
Write-Host "  - PLANO_IMPLEMENTACAO_FATURAS.md" -ForegroundColor White
Write-Host "  - RESUMO_EXECUTIVO_FINCORE.md" -ForegroundColor White

Write-Host ""
Write-Host "FinCore - Pronto para Implementa??o de N?vel Banc?rio!" -ForegroundColor Green
