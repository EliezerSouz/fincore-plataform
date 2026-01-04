# Movimentação Entre Pockets (Transferência Interna)

## Conceito

Permite movimentar dinheiro entre pockets da mesma conta (parent_account) ou de contas diferentes.

### Exemplos de Uso

1. **Mesma Conta (Mercado Pago)**:
   - Caixa → Emergência (guardar dinheiro que rende)
   - Emergência → Caixa (resgatar para usar)

2. **Contas Diferentes**:
   - Banco do Brasil → Mercado Pago
   - Nubank → Santander

## Como Funciona

### 1. Tipo de Transação
- **Tipo**: `transferencia`
- **Categoria**: `MOVIMENTAÇÃO INTERNA` (criada automaticamente)
- **Descrição**: Gerada automaticamente
  - Saída: "Transferência para [Pocket Destino]"
  - Entrada: "Transferência de [Pocket Origem]"

### 2. Criação de Transações
São criadas **2 transações vinculadas**:

```
Transação 1 (Origem):
- pocket_id: [pocket origem]
- type: transferencia
- amount: 100.00
- description: "Transferência para Emergência"
- related_transaction_id: [id da transação 2]

Transação 2 (Destino):
- pocket_id: [pocket destino]
- type: transferencia
- amount: 100.00
- description: "Transferência de Caixa"
- related_transaction_id: [id da transação 1]
```

### 3. Atualização de Saldos
- **Pocket Origem**: `balance = balance - amount` (diminui)
- **Pocket Destino**: `balance = balance + amount` (aumenta)
- **Atualização Automática**: Os saldos são atualizados automaticamente após a criação

### 4. Impacto no Fluxo de Caixa
- ❌ **NÃO** aparece no fluxo de caixa (receitas/despesas)
- ✅ **SIM** aparece no histórico de transações
- ✅ **SIM** aparece no extrato de cada pocket
- ❌ **NÃO** conta para cálculo de Score/Runway

## Implementação

### Backend

#### Endpoint
```
POST /api/transactions/pocket-transfer
```

#### Payload
```json
{
  "source_pocket_id": "uuid-pocket-origem",
  "target_pocket_id": "uuid-pocket-destino",
  "amount": 100.00,
  "description": "Aplicação em reserva de emergência",
  "date": "2025-12-27"
}
```

#### Resposta
```json
{
  "source": { ... },  // Transação de saída
  "target": { ... },  // Transação de entrada
  "message": "Transfer completed successfully"
}
```

### Frontend

#### Localização
- **Tela de Contas**: Menu (⋮) de cada pocket → "Transferir entre Pockets"
- **Modal**: `TransferBetweenPocketsDialog`

#### Fluxo UX
1. Usuário clica em "Transferir entre Pockets" no menu do pocket
2. Modal abre com:
   - Pocket Origem (pré-selecionado)
   - Pocket Destino (dropdown com outros pockets)
   - Valor
   - Descrição (opcional)
   - Data (padrão: hoje)
   - Preview da transferência
3. Ao confirmar:
   - Cria 2 transações vinculadas
   - Atualiza saldos dos pockets automaticamente
   - Mostra notificação de sucesso
   - Recarrega a página para mostrar saldos atualizados

#### Validações
- ✅ Valor > 0
- ✅ Pocket origem ≠ Pocket destino
- ✅ Saldo suficiente no pocket origem
- ✅ Data não pode ser futura

## Edição e Exclusão

### Como Editar uma Transferência

As transferências entre pockets podem ser editadas através da tela de **Transações**:

1. Acesse a tela de **Transações**
2. Localize a transferência que deseja editar
   - Filtre por categoria "MOVIMENTAÇÃO INTERNA" para facilitar
   - Ou busque pela descrição (ex: "Transferência para EMERGENCIA")
3. Clique no ícone de **editar** (✏️)
4. Modifique os campos desejados:
   - **Valor**: Alterar o valor da transferência
   - **Descrição**: Adicionar ou modificar observações
   - **Data**: Alterar a data da transferência
   - **Categoria**: Manter como "MOVIMENTAÇÃO INTERNA"
5. Salve as alterações

**⚠️ IMPORTANTE**: 
- Ao editar uma transferência, você está editando apenas **uma das duas transações** vinculadas
- A transação relacionada **NÃO será atualizada automaticamente**
- Se precisar editar o valor, edite **ambas as transações** (origem e destino) para manter a consistência
- Os saldos dos pockets serão recalculados automaticamente

### Como Excluir uma Transferência

Para excluir uma transferência:

1. Acesse a tela de **Transações**
2. Localize a transferência
3. Clique no ícone de **excluir** (🗑️)
4. Confirme a exclusão

**⚠️ IMPORTANTE**:
- Exclua **AMBAS as transações** vinculadas (origem e destino)
- Se excluir apenas uma, a outra ficará órfã e pode causar inconsistências
- Os saldos dos pockets serão recalculados automaticamente após a exclusão

### Identificando Transações Vinculadas

Para identificar qual é a transação relacionada:

1. Verifique a descrição:
   - Se diz "Transferência **para** X" → é a transação de **saída** (origem)
   - Se diz "Transferência **de** X" → é a transação de **entrada** (destino)
2. Ambas terão a mesma data e valor
3. Ambas terão a categoria "MOVIMENTAÇÃO INTERNA"

### Boas Práticas

1. **Evite editar transferências antigas** - Prefira criar uma nova transferência corretiva
2. **Sempre edite ambas as transações** se alterar o valor
3. **Use a descrição** para adicionar contexto (ex: "Correção de erro", "Ajuste mensal")
4. **Verifique os saldos** após editar ou excluir transferências

## Visualização

### Extrato do Pocket
```
Data       | Descrição                          | Valor
-----------|------------------------------------|-----------
27/12/2025 | Transferência para Emergência      | -R$ 100,00
26/12/2025 | Transferência de Caixa             | +R$ 500,00
25/12/2025 | Pagamento Conta de Luz             | -R$ 150,00
```

### Histórico de Transações
- Filtro: "Movimentações Internas" (categoria)
- Mostra origem e destino
- Permite editar e excluir

## Diferença: Transferência vs. Movimentação Interna

| Aspecto | Transferência Normal | Movimentação Interna |
|---------|---------------------|---------------------|
| Entre | Contas diferentes (bancos) | Pockets (mesma ou diferente conta) |
| Categoria | "Transferência" | "MOVIMENTAÇÃO INTERNA" |
| Fluxo de Caixa | Não aparece | Não aparece |
| Extrato | Aparece | Aparece |
| Uso | Mover dinheiro entre bancos | Organizar dinheiro dentro da conta |

## Status da Implementação

1. ✅ Criar categoria "MOVIMENTAÇÃO INTERNA"
2. ✅ Criar endpoint `/api/transactions/pocket-transfer`
3. ✅ Criar componente `TransferBetweenPocketsDialog` no frontend
4. ✅ Adicionar botão "Transferir entre Pockets" no menu de cada pocket
5. ✅ Atualização automática de saldos
6. ✅ Atualização automática da página após transferência
7. ⏳ Criar tela de "Extrato do Pocket" (histórico de movimentações)
8. ⏳ Adicionar filtro de "Movimentações Internas" na tela de transações

---

**Última atualização**: 2025-12-27
