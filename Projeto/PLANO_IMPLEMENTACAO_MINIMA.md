# 🚀 PLANO DE IMPLEMENTAÇÃO MÍNIMA - 09:22

## Objetivo:
Fazer o teste `test_e2e_invoices.ps1` executar com sucesso.

## Estratégia:
Implementação **mínima viável** - apenas o necessário para o teste passar.

## O que o teste precisa:

### 1. Endpoint: POST /api/cards
- Criar cartão de crédito
- Retornar ID do cartão

### 2. Endpoint: GET /api/cards/{id}
- Buscar cartão por ID
- Retornar dados do cartão

### 3. Endpoint: POST /api/invoices/transactions
- Criar lançamento em cartão
- Criar/atualizar fatura automaticamente

### 4. Endpoint: POST /api/invoices/{id}/pay
- Pagar fatura
- Gerar crédito se pagar a mais

### 5. Endpoint: POST /api/invoices/{id}/revert
- Estornar pagamento
- Reprocessar faturas

## Abordagem:

### Fase 1: Handlers Simples (2h)
- Criar handlers diretos, sem service complexo
- Usar repositórios existentes
- Lógica inline nos handlers

### Fase 2: Testar (1h)
- Executar teste
- Corrigir bugs
- Ajustar conforme necessário

### Fase 3: Refinar (1h)
- Melhorar código
- Adicionar validações
- Documentar

**Total**: 4 horas

## Começando AGORA!
