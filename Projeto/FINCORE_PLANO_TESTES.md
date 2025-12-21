# FinCore - Plano de Testes: Reserva de Emergência

**Data:** 21/12/2025 16:26  
**Versão:** 1.0  
**Status:** 🧪 PRONTO PARA TESTAR

---

## 🎯 Objetivo dos Testes

Validar que a **Reserva de Emergência** está funcionando corretamente em todos os aspectos:
- ✅ Criação de conta
- ✅ Exibição de ícones
- ✅ Cálculo de Runway
- ✅ Não afeta PULSO
- ✅ Não afeta Liquidez Score

---

## 📋 TESTE 1: Criar Conta de Reserva

### Passos:
1. Ir em **"Minhas Contas"**
2. Clicar em **"Nova Conta"**
3. Preencher:
   - Nome: `Reserva de Emergência`
   - Saldo: `1000`
   - Tipo: **"Reserva de Emergência"** (deve ter porquinho 🐷)
   - Cor: Qualquer
4. Clicar em **"Criar Conta"**
5. Aguardar reload da página

### Resultado Esperado:
- ✅ Conta criada com sucesso
- ✅ Toast de confirmação aparece
- ✅ Página recarrega automaticamente
- ✅ Conta aparece na lista com ícone de **porquinho 🐷**
- ✅ Cor **amber/laranja**
- ✅ Agrupada em "Reserva de Emergência"

### Validação Visual:
```
┌─────────────────────────────────────┐
│ 🐷 Reserva de Emergência            │
│ 1 conta • R$ 1.000,00               │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🐷  RESERVA DE EMERGÊNCIA       │ │
│ │                                 │ │
│ │ R$ 1.000,00                     │ │
│ │                                 │ │
│ │ Reserva de Emergência    🟠     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 📋 TESTE 2: Verificar Dashboard (Antes da Reserva)

### Passos:
1. Ir em **"Dashboard"**
2. Anotar os valores atuais:

### Valores Esperados (SEM reserva):
```
PULSO FINANCEIRO:     R$ 2.204,05
FÔLEGO FINANCEIRO:    R$ 967,91
VENCIDOS:             R$ 1.236,14 (1)
Runway:               1,7 meses
Score:                ~453 pontos
```

### Screenshot:
- [ ] Tirar screenshot do dashboard ANTES

---

## 📋 TESTE 3: Verificar Dashboard (Depois da Reserva)

### Passos:
1. Após criar a conta de reserva
2. Ir em **"Dashboard"**
3. Verificar os novos valores:

### Valores Esperados (COM R$ 1.000 de reserva):
```
PULSO FINANCEIRO:     R$ 2.204,05 ✅ (SEM MUDANÇA!)
FÔLEGO FINANCEIRO:    R$ 967,91 ✅ (SEM MUDANÇA!)
VENCIDOS:             R$ 1.236,14 (1) ✅ (SEM MUDANÇA!)
Runway:               3,4 meses ✅ (AUMENTOU!)
Score:                ~495 pontos ✅ (AUMENTOU!)
```

### Cálculo do Runway:
```
Runway = (FÔLEGO + Reserva - A Vencer) ÷ Média
Runway = (967,91 + 1.000 - 0) ÷ 575,88
Runway = 1.967,91 ÷ 575,88
Runway = 3,41 → 3,4 meses (arredondado para baixo)
```

### Cálculo do Score:
```
Liquidez:       28,0 × 0,35 =  9,80 (sem mudança)
Runway:         56,6 × 0,30 = 16,98 (era 28,3, agora 56,6)
Comportamento:  60,0 × 0,20 = 12,00 (sem mudança)
Organização:   100,0 × 0,15 = 15,00 (sem mudança)

Score = (9,80 + 16,98 + 12,00 + 15,00) × 10
Score = 53,78 × 10 = 537,8 → ~538 pontos
```

### Screenshot:
- [ ] Tirar screenshot do dashboard DEPOIS

---

## 📋 TESTE 4: Verificar API Response

### Passos:
1. Abrir **DevTools** (F12)
2. Ir na aba **Network**
3. Recarregar o Dashboard
4. Procurar por `dashboard/summary`
5. Ver a resposta JSON

### Campos Esperados:
```json
{
  "liquidez": 2204.05,
  "total_balance": 2204.05,
  "available_for_calculations": 967.91,
  "reserva_emergencia": 1000.00,  ✅ NOVO CAMPO!
  "runway": 3.4,
  "score": 538,
  "compromissos_vencidos": 1236.14,
  "compromissos_a_vencer": 0.00
}
```

### Validação:
- [ ] `reserva_emergencia` = 1000.00
- [ ] `total_balance` = 2204.05 (sem mudança)
- [ ] `available_for_calculations` = 967.91 (sem mudança)
- [ ] `runway` ≈ 3.4
- [ ] `score` ≈ 495-540

---

## 📋 TESTE 5: Editar Saldo da Reserva

### Passos:
1. Ir em **"Minhas Contas"**
2. Clicar nos **3 pontinhos** da conta de reserva
3. Clicar em **"Editar"**
4. Clicar em **"Alterar Saldo"** (desbloquear)
5. Mudar saldo para `2000`
6. Salvar

### Resultado Esperado:
- ✅ Conta atualizada
- ✅ Página recarrega
- ✅ Novo saldo: R$ 2.000,00

### Ir ao Dashboard:
```
Runway esperado:
Runway = (967,91 + 2.000 - 0) ÷ 575,88
Runway = 2.967,91 ÷ 575,88
Runway = 5,15 → 5,1 meses

Score esperado:
Runway Score = (5,1 ÷ 6) × 100 = 85,0 pts
Score Final ≈ 580 pontos (Ritmo Estável!)
```

---

## 📋 TESTE 6: Transferir para Reserva

### Passos:
1. Ir em **"Transações"**
2. Criar nova transação:
   - Tipo: **Transferência**
   - De: **Mercado Pago** (ou outra conta)
   - Para: **Reserva de Emergência**
   - Valor: `500`
   - Data: Hoje
3. Salvar

### Resultado Esperado:
- ✅ Transação criada
- ✅ Saldo da conta origem diminui R$ 500
- ✅ Saldo da reserva aumenta R$ 500
- ✅ Runway aumenta

---

## 📋 TESTE 7: Usar Reserva (Emergência)

### Passos:
1. Ir em **"Transações"**
2. Criar nova transação:
   - Tipo: **Transferência**
   - De: **Reserva de Emergência**
   - Para: **Mercado Pago** (ou outra conta)
   - Valor: `300`
   - Data: Hoje
3. Salvar

### Resultado Esperado:
- ✅ Transação criada
- ✅ Saldo da reserva diminui R$ 300
- ✅ Saldo da conta destino aumenta R$ 300
- ✅ Runway diminui

---

## 📋 TESTE 8: Ícones em Transações

### Passos:
1. Ir em **"Transações"**
2. Procurar pelas transferências da reserva

### Resultado Esperado:
- ✅ Ícone de **porquinho 🐷** aparece nas transações
- ✅ Nome "Reserva de Emergência" aparece
- ✅ Cor amber/laranja

---

## 📋 TESTE 9: Deletar Conta de Reserva

### Passos:
1. Ir em **"Minhas Contas"**
2. Clicar nos **3 pontinhos** da conta de reserva
3. Clicar em **"Excluir"**
4. Confirmar exclusão

### Resultado Esperado:
- ✅ Conta excluída (se não tiver transações)
- OU
- ❌ Erro se tiver transações vinculadas

---

## 📋 TESTE 10: Múltiplas Reservas

### Passos:
1. Criar **2 contas** de reserva:
   - Reserva 1: R$ 1.000
   - Reserva 2: R$ 500
2. Ir ao Dashboard

### Resultado Esperado:
```
Total de Reservas: R$ 1.500
Runway = (967,91 + 1.500 - 0) ÷ 575,88
Runway = 4,28 → 4,2 meses
```

---

## ✅ Checklist de Validação

### Backend
- [ ] Campo `reserva_emergencia` na API
- [ ] Cálculo correto do Runway
- [ ] PULSO não afetado
- [ ] FÔLEGO não afetado
- [ ] Score Liquidez não afetado
- [ ] Score Runway aumenta

### Frontend
- [ ] Opção "Reserva de Emergência" no dropdown
- [ ] Ícone porquinho 🐷 no card
- [ ] Ícone porquinho 🐷 nas transações
- [ ] Cor amber correta
- [ ] Agrupamento correto
- [ ] Reload após criar/editar

### Cálculos
- [ ] Runway aumenta com reserva
- [ ] Score aumenta com reserva
- [ ] PULSO permanece igual
- [ ] FÔLEGO permanece igual

---

## 🎯 Cenários de Teste

### Cenário 1: Usuário Sem Reserva
```
Liquidez: R$ 2.204,05
Reserva: R$ 0,00
Runway: 1,7 meses
Score: 453 pontos (Atenção)
```

### Cenário 2: Usuário Com R$ 1.000 de Reserva
```
Liquidez: R$ 2.204,05
Reserva: R$ 1.000,00
Runway: 3,4 meses (+100%)
Score: 495 pontos (Atenção → quase Ritmo Estável)
```

### Cenário 3: Usuário Com R$ 3.455 de Reserva (Meta)
```
Liquidez: R$ 2.204,05
Reserva: R$ 3.455,00 (6 meses de gastos)
Runway: 6,0 meses (máximo no score)
Score: 550 pontos (Ritmo Estável!)
```

---

## 🐛 Bugs Conhecidos

Nenhum até o momento.

---

## 📸 Screenshots Necessários

1. [ ] Dashboard ANTES da reserva
2. [ ] Dashboard DEPOIS da reserva
3. [ ] Card da conta de reserva
4. [ ] Agrupamento "Reserva de Emergência"
5. [ ] Transação com ícone de porquinho
6. [ ] API response com `reserva_emergencia`

---

**Versão:** 1.0  
**Status:** 🧪 PRONTO PARA TESTAR  
**Última Atualização:** 21/12/2025 16:26

**Vamos começar pelos testes básicos e depois avançamos!** 🎯✅
