# FinCore - Reserva de Emergência

**Data:** 21/12/2025 15:56  
**Status:** ✅ IMPLEMENTADO

---

## 🎯 Conceito

**Reserva de Emergência** é um valor separado que:
- ❌ **NÃO entra** no PULSO (saldo diário)
- ❌ **NÃO entra** no cálculo de Liquidez (Score)
- ✅ **ENTRA** no cálculo de Runway (sobrevivência)

### Por quê?

Reserva de emergência é para **situações extremas** (desemprego, doença, etc.). Você não mexe nela no dia a dia, mas ela aumenta seu tempo de sobrevivência.

---

## 📊 Como Funciona

### Tipo de Conta
```
Tipos de conta no sistema:
- corrente: Conta corrente (entra na Liquidez)
- poupanca: Poupança (entra na Liquidez)
- digital: Conta digital (entra na Liquidez)
- investimento: Investimentos (entra no Patrimônio)
- reserva_emergencia: Reserva de emergência (SÓ entra no Runway) ✅
```

### Cálculos

**PULSO:**
```
PULSO = Liquidez (corrente + poupanca + digital)
PULSO = R$ 2.204,05
```
❌ Reserva de emergência **NÃO entra**

**FÔLEGO:**
```
FÔLEGO = Liquidez - Vencidos
FÔLEGO = 2.204,05 - 1.236,14 = R$ 967,91
```
❌ Reserva de emergência **NÃO entra**

**RUNWAY:**
```
RUNWAY = (FÔLEGO + Reserva Emergência - A Vencer) ÷ Média de Gastos
RUNWAY = (967,91 + 1.000,00 - 0,00) ÷ 575,88
RUNWAY = 1.967,91 ÷ 575,88
RUNWAY = 3,41 meses
RUNWAY = 3,4 meses (arredondado para baixo)
```
✅ Reserva de emergência **ENTRA**

---

## 🧮 Exemplo Prático

### Cenário Atual (Sem Reserva)
```
Liquidez: R$ 2.204,05
Vencidos: R$ 1.236,14
A Vencer: R$ 0,00
Reserva: R$ 0,00

PULSO: R$ 2.204,05
FÔLEGO: R$ 967,91
RUNWAY: 967,91 ÷ 575,88 = 1,7 meses
```

### Cenário com Reserva de R$ 1.000
```
Liquidez: R$ 2.204,05
Vencidos: R$ 1.236,14
A Vencer: R$ 0,00
Reserva: R$ 1.000,00 ✅

PULSO: R$ 2.204,05 (sem mudança)
FÔLEGO: R$ 967,91 (sem mudança)
RUNWAY: (967,91 + 1.000) ÷ 575,88 = 3,4 meses ✅ (+1,7 meses!)
```

**Impacto:** +1,7 meses de sobrevivência sem mexer no saldo diário!

---

## 📊 Impacto no Score

### Score de Liquidez (35%)
```
Usa: FÔLEGO (SEM reserva)
Índice = 967,91 ÷ 575,88 = 1,68 meses
Score = (1,68 ÷ 6) × 100 = 28,0 pontos
```
❌ Reserva **NÃO afeta** Liquidez

### Score de Runway (30%)
```
Usa: RUNWAY (COM reserva)
Runway = 3,4 meses
Score = (3,4 ÷ 6) × 100 = 56,6 pontos ✅
```
✅ Reserva **AFETA** Runway

**Diferença:**
- Sem reserva: 28,3 pontos (1,7 meses)
- Com reserva: 56,6 pontos (3,4 meses)
- **+28,3 pontos!**

---

## 🔧 Implementação Técnica

### Backend

**Estrutura:**
```go
type FinancialSummary struct {
    Liquidez          float64 `json:"liquidez"`           // Contas do dia a dia
    ReservaEmergencia float64 `json:"reserva_emergencia"` // Reserva separada
    // ...
}
```

**Query:**
```sql
SELECT 
    COALESCE(SUM(CASE WHEN type = 'corrente' OR type = 'poupanca' OR type = 'digital' THEN balance ELSE 0 END), 0) as liquidez,
    COALESCE(SUM(CASE WHEN type = 'investimento' THEN balance ELSE 0 END), 0) as patrimonio,
    COALESCE(SUM(CASE WHEN type = 'reserva_emergencia' THEN balance ELSE 0 END), 0) as reserva_emergencia
FROM accounts
WHERE user_id = $1 AND is_active = true
```

**Cálculo do Runway:**
```go
// Reserva SÓ entra no Runway
liquidezAposCompromissos := summary.AvailableForCalculations + summary.ReservaEmergencia - summary.CompromissosAVencer

summary.Runway = liquidezAposCompromissos / avgMonthlyExpenses

// Arredonda SEMPRE para baixo (margem de segurança)
summary.Runway = math.Floor(summary.Runway*10) / 10
```

---

## 📱 Como Usar

### 1. Criar Conta de Reserva
```
1. Ir em "Minhas Contas"
2. Clicar em "Nova Conta"
3. Nome: "Reserva de Emergência"
4. Tipo: "Reserva de Emergência"
5. Saldo inicial: R$ 1.000,00
6. Salvar
```

### 2. Transferir para Reserva
```
Quando tiver dinheiro sobrando:
1. Criar transação de transferência
2. De: Conta Corrente
3. Para: Reserva de Emergência
4. Valor: R$ 500,00
```

### 3. Usar Reserva (Emergência)
```
Só em caso de EMERGÊNCIA:
1. Criar transação de transferência
2. De: Reserva de Emergência
3. Para: Conta Corrente
4. Valor: R$ 500,00
```

---

## ✅ Regras

### Quando Usar a Reserva
✅ Perda de emprego
✅ Doença/Acidente
✅ Emergência familiar
✅ Despesa inesperada urgente

### Quando NÃO Usar
❌ Compras planejadas
❌ Viagens
❌ Investimentos
❌ Gastos do dia a dia

---

## 🎯 Meta de Reserva

### Recomendação
```
Reserva Ideal = 6 meses de gastos
Reserva Ideal = 6 × R$ 575,88 = R$ 3.455,28
```

### Progresso
```
Atual: R$ 0,00
Meta: R$ 3.455,28
Falta: R$ 3.455,28
Progresso: 0%
```

---

## 📊 Simulação Completa

### Sem Reserva (Atual)
```
PULSO: R$ 2.204,05
FÔLEGO: R$ 967,91
RUNWAY: 1,7 meses

Score:
- Liquidez: 28,0 pts
- Runway: 28,3 pts
- Total: ~453 pts (Atenção)
```

### Com R$ 1.000 de Reserva
```
PULSO: R$ 2.204,05 (sem mudança)
FÔLEGO: R$ 967,91 (sem mudança)
RUNWAY: 3,4 meses ✅ (+100%)

Score:
- Liquidez: 28,0 pts (sem mudança)
- Runway: 56,6 pts ✅ (+28,3 pts)
- Total: ~495 pts (Atenção → quase Ritmo Estável)
```

### Com R$ 3.455 de Reserva (Meta)
```
PULSO: R$ 2.204,05 (sem mudança)
FÔLEGO: R$ 967,91 (sem mudança)
RUNWAY: 7,6 meses ✅ (limitado a 6 no score)

Score:
- Liquidez: 28,0 pts (sem mudança)
- Runway: 100,0 pts ✅ (máximo!)
- Total: ~550 pts (Ritmo Estável!)
```

---

## ✅ Vantagens

1. **Separação Clara:** Reserva não se mistura com saldo diário
2. **Runway Realista:** Mostra quanto tempo você REALMENTE aguenta
3. **Score Justo:** Reconhece quem tem reserva de emergência
4. **Educação Financeira:** Incentiva a criar reserva
5. **Flexibilidade:** Pode usar em emergências sem culpa

---

## 🔄 Arredondamento

**Runway sempre arredonda PARA BAIXO:**
```
Antes: 3,41 meses → 3,4 meses (arredondava normal)
Depois: 3,41 meses → 3,4 meses (arredonda para baixo) ✅
```

**Por quê?**
- Margem de segurança
- Melhor ser conservador
- Evita falsa sensação de segurança

**Exemplos:**
```
3,49 meses → 3,4 meses (não 3,5)
5,99 meses → 5,9 meses (não 6,0)
1,71 meses → 1,7 meses (não 1,7)
```

---

**Versão:** 1.0  
**Status:** ✅ IMPLEMENTADO  
**Última Atualização:** 21/12/2025 15:56

**IMPORTANTE:** Reserva de emergência SÓ entra no Runway, NÃO no PULSO ou Liquidez!
