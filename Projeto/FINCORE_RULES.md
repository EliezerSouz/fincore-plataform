# FinCore - Regras Oficiais de Cálculo

**"O coração da sua vida financeira"**

Este documento define as regras oficiais e imutáveis para o cálculo das métricas principais do FinCore: **PULSO**, **RUNWAY** e **SCORE**.

---

## 🎯 Princípio Fundamental

Pulso, Runway e Score são métricas **DIFERENTES** e **COMPLEMENTARES**:

- **PULSO** = Situação financeira atual (fôlego real disponível)
- **RUNWAY** = Quanto tempo o fôlego dura (meses de sobrevivência)
- **SCORE** = Saúde financeira geral (índice composto 0-1000)

Essas métricas **NÃO** podem ser misturadas visualmente nem logicamente.

---

## ⚠️ Regra Absoluta sobre Investimentos

**INVESTIMENTOS NÃO entram no cálculo de:**
- Pulso Financeiro
- Runway
- Score

Mesmo investimentos com liquidez diária (CDI, CDB, Tesouro Direto, etc.) **NÃO DEVEM**:
- Aumentar saldo disponível
- Melhorar score
- Aumentar runway

**Justificativa:** Investimentos são patrimônio de longo prazo e devem ser tratados separadamente. Resgatar investimentos para pagar contas é uma decisão estratégica, não operacional.

---

## 1️⃣ PULSO FINANCEIRO

### Definição
O **PULSO FINANCEIRO** representa o fôlego real do usuário após considerar todos os compromissos imediatos.

### Fórmula Obrigatória
```
PULSO = Liquidez Total - Compromissos em Aberto
```

**Onde:**
- **Liquidez Total** = Soma de saldos em contas bancárias e carteiras (exceto investimentos)
- **Compromissos em Aberto** = Contas a pagar pendentes + Faturas de cartão abertas

### Regras
- ✅ Pode ser positivo ou negativo
- ✅ Se negativo, indica **ARRITMIA FINANCEIRA**
- ❌ NÃO considerar apenas o fluxo do mês isoladamente
- ❌ NÃO incluir investimentos, mesmo com liquidez diária

### Exemplo
```
Conta Corrente: R$ 5.000
Poupança: R$ 3.000
Investimentos CDB: R$ 10.000 (NÃO CONTA)

Contas a Pagar: R$ 2.000
Fatura Cartão: R$ 1.500

PULSO = (5.000 + 3.000) - (2.000 + 1.500) = R$ 4.500
```

---

## 2️⃣ RUNWAY (Pista de Pouso Financeira)

### Definição
O **RUNWAY** responde: *"Por quantos meses consigo sobreviver mantendo o ritmo atual?"*

### Fórmula Obrigatória
```
RUNWAY = PULSO ÷ Média de Gastos Mensais (últimos 6 meses)
```

### Cálculo da Média de Gastos
```
Média de Gastos = Σ(Despesas dos últimos 6 meses) ÷ 6
```

### Regras Obrigatórias
- ✅ Se PULSO ≤ 0 → RUNWAY = 0
- ✅ Nunca permitir valores negativos
- ✅ Arredondar para 1 casa decimal
- ✅ Unidade: **meses**
- ❌ Nunca usar apenas o mês atual
- ❌ Investimentos NÃO entram no cálculo

### Interpretação
| Runway | Status | Significado |
|--------|--------|-------------|
| ≥ 6 meses | 🟢 Saudável | Reserva adequada - Batimento estável |
| 3-5 meses | 🟡 Atenção | Reserva mínima - Taquicardia por estresse |
| < 3 meses | 🔴 Crítico | Risco alto - Coração quase parando |

### Exemplo
```
PULSO: R$ 4.500
Gastos últimos 6 meses: R$ 9.000 (média R$ 1.500/mês)

RUNWAY = 4.500 ÷ 1.500 = 3.0 meses
```

---

## 3️⃣ SCORE (Saúde Financeira 0-1000)

### Definição
O **SCORE** é um índice composto que avalia a saúde financeira geral através de 4 pilares ponderados.

### Estrutura dos Pilares

| Pilar | Peso | Descrição |
|-------|------|-----------|
| **Liquidez** | 35% | Capacidade de cobrir gastos com PULSO |
| **Runway** | 30% | Tempo de sobrevivência |
| **Comportamento** | 20% | Disciplina financeira |
| **Organização** | 15% | Estrutura e planejamento |

---

### PILAR 1: Liquidez (35%)

**Métrica:** Quantos meses de gastos o PULSO cobre?

```
Índice de Liquidez = min(PULSO ÷ Média de Gastos, 6)
Score de Liquidez = (Índice de Liquidez ÷ 6) × 100
```

**Interpretação:**
- 6+ meses de cobertura = 100 pontos (máximo)
- 3 meses = 50 pontos
- 0 meses = 0 pontos

---

### PILAR 2: Runway (30%)

**Métrica:** Meses de sobrevivência

```
Índice de Runway = min(RUNWAY, 12)
Score de Runway = (Índice de Runway ÷ 12) × 100
```

**Interpretação:**
- 12+ meses = 100 pontos (máximo)
- 6 meses = 50 pontos
- 0 meses = 0 pontos

---

### PILAR 3: Comportamento Financeiro (20%)

**Métrica:** Disciplina e responsabilidade

```
Score Base = 100

Penalidades:
- Gastos > Receitas: -50 pontos (proporcional)
- Faturas atrasadas: -10 pontos por fatura
- Pagamento mínimo: -20 pontos

Score Final = max(Score Base - Penalidades, 0)
```

**Exemplo:**
```
Receitas: R$ 5.000
Despesas: R$ 6.000 (20% acima)
Faturas atrasadas: 1

Score = 100 - (20% × 50) - (1 × 10) = 80 pontos
```

---

### PILAR 4: Organização Financeira (15%)

**Métrica:** Estrutura e planejamento (pontuação binária)

```
Pontos possíveis:
✅ Categorias configuradas: +25
✅ Contas ativas: +25
✅ Cartões cadastrados: +25
✅ Transações registradas: +25

Score Máximo = 100
```

---

### Cálculo Final do Score

```
Score Parcial = 
  (Score Liquidez × 0.35) +
  (Score Runway × 0.30) +
  (Score Comportamento × 0.20) +
  (Score Organização × 0.15)

Score Final = Score Parcial × 10
```

**Faixa:** 0 a 1000

---

## 4️⃣ Interpretação do Score (FinCore)

| Faixa | Status | Emoji | Significado |
|-------|--------|-------|-------------|
| 800-1000 | **Coração Forte** | 🟢 | Saúde financeira excelente |
| 600-799 | **Ritmo Estável** | 🔵 | Situação controlada e saudável |
| 400-599 | **Atenção** | 🟠 | Necessita ajustes e cuidado |
| 200-399 | **Arritmia Financeira** | 🔴 | Situação delicada, ação urgente |
| 0-199 | **Estado Crítico** | 🚨 | Emergência financeira |

---

## 5️⃣ Regras de Exibição na UI

1. **Hierarquia Visual:**
   - PULSO deve ser o destaque principal
   - Fluxo mensal é informativo, nunca principal
   - Score e Runway devem ter igual importância visual

2. **Tooltips Obrigatórios:**
   - Sempre explicar como cada métrica é calculada
   - Incluir fórmulas simplificadas
   - Destacar que investimentos não entram

3. **Cores e Estados:**
   - Usar cores do FinCore (verde, azul, amarelo, laranja, vermelho)
   - Animações devem refletir o estado de saúde
   - ECG deve pulsar de acordo com o status

---

## 6️⃣ Validação Final Obrigatória

Antes de qualquer deploy ou atualização, confirme:

- [ ] Investimentos NÃO influenciam Pulso, Runway ou Score
- [ ] Saldo do mês NÃO substitui saldo total
- [ ] Runway nunca fica negativo
- [ ] Score reflete saúde geral, não apenas dinheiro em caixa
- [ ] Média de gastos usa 6 meses (não apenas mês atual)
- [ ] Fórmulas estão implementadas exatamente como especificado

---

## 📊 Exemplo Completo

### Dados do Usuário
```
Contas:
- Conta Corrente: R$ 8.000
- Poupança: R$ 4.000
- Investimentos: R$ 20.000 (NÃO CONTA)

Compromissos:
- Contas a Pagar: R$ 3.000
- Fatura Cartão: R$ 2.000

Histórico (últimos 6 meses):
- Despesas médias: R$ 4.000/mês
- Receitas médias: R$ 5.500/mês

Organização:
- 5 categorias configuradas ✅
- 2 contas ativas ✅
- 1 cartão cadastrado ✅
- 50 transações no mês ✅
```

### Cálculos

**1. PULSO:**
```
PULSO = (8.000 + 4.000) - (3.000 + 2.000) = R$ 7.000
```

**2. RUNWAY:**
```
RUNWAY = 7.000 ÷ 4.000 = 1.8 meses
```

**3. SCORE:**

*Liquidez (35%):*
```
Índice = 7.000 ÷ 4.000 = 1.75 (capped at 6)
Score = (1.75 ÷ 6) × 100 = 29.2 pontos
```

*Runway (30%):*
```
Índice = 1.8 (capped at 12)
Score = (1.8 ÷ 12) × 100 = 15 pontos
```

*Comportamento (20%):*
```
Base = 100
Receitas > Despesas ✅ (sem penalidade)
Sem atrasos ✅
Score = 100 pontos
```

*Organização (15%):*
```
Categorias ✅ +25
Contas ✅ +25
Cartões ✅ +25
Transações ✅ +25
Score = 100 pontos
```

**Score Final:**
```
Score = (29.2 × 0.35) + (15 × 0.30) + (100 × 0.20) + (100 × 0.15)
Score = 10.22 + 4.5 + 20 + 15 = 49.72
Score UI = 49.72 × 10 = 497 pontos

Status: 🟠 ATENÇÃO
```

---

## 🔒 Regra de Ouro

> **"Investimentos são patrimônio, não liquidez. O FinCore mede o coração financeiro operacional, não a riqueza total."**

---

**Versão:** 1.0  
**Data:** 21/12/2025  
**Status:** OFICIAL E IMUTÁVEL
