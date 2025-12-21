# FinCore - Por que 6 Meses no Score de Liquidez?

**Data:** 21/12/2025 15:32  
**Questão:** Por que dividir por 6 no cálculo de Liquidez?

---

## 🎯 Resposta Rápida

**6 meses** é o padrão **internacional** de **reserva de emergência** recomendado por especialistas financeiros.

---

## 📚 Fundamento Teórico

### Regra de Ouro das Finanças Pessoais
```
"Mantenha uma reserva de emergência equivalente a 6 meses de despesas"
```

**Fontes:**
- Educadores financeiros (Gustavo Cerbasi, Nathalia Arcuri, etc.)
- Bancos e consultorias financeiras
- Padrão internacional de planejamento financeiro

### Por que 6 meses?

**Cenários de Emergência:**
1. **Perda de emprego:** Tempo médio para recolocação = 3-6 meses
2. **Doença/Acidente:** Afastamento temporário do trabalho
3. **Emergências familiares:** Despesas inesperadas
4. **Crises econômicas:** Redução de renda

**Conclusão:** 6 meses é o tempo considerado **seguro** para se recuperar de uma crise sem entrar em dívidas.

---

## 🧮 Como Funciona no Score

### Fórmula Atual
```
Índice de Liquidez = FÔLEGO ÷ Média de Gastos Mensais
Score Liquidez = (Índice ÷ 6) × 100
```

### Interpretação
```
Se FÔLEGO cobre 6+ meses de gastos → 100 pontos (Excelente)
Se FÔLEGO cobre 3 meses de gastos   → 50 pontos (Razoável)
Se FÔLEGO cobre 1,5 meses de gastos → 25 pontos (Fraco)
Se FÔLEGO cobre 0 meses de gastos   → 0 pontos (Crítico)
```

### Exemplo Atual
```
FÔLEGO: R$ 967,91
Média de Gastos: R$ 575,88
Índice: 967,91 ÷ 575,88 = 1,68 meses

Score: (1,68 ÷ 6) × 100 = 28,0 pontos

Interpretação: 
Você tem apenas 1,68 meses de reserva.
Meta ideal: 6 meses.
Progresso: 28% do ideal.
```

---

## 🎨 Escalas Alternativas

### Opção 1: 6 Meses (Atual - Padrão Internacional)
```
Meta: 6 meses
100 pontos = 6 meses de reserva
Referência: Padrão conservador e seguro
```

**Vantagens:**
- ✅ Padrão internacional reconhecido
- ✅ Segurança máxima
- ✅ Recomendado por especialistas

**Desvantagens:**
- ⚠️ Meta difícil de atingir
- ⚠️ Pode desmotivar usuários iniciantes

---

### Opção 2: 3 Meses (Mais Flexível)
```
Meta: 3 meses
100 pontos = 3 meses de reserva
Referência: Padrão mínimo aceitável
```

**Vantagens:**
- ✅ Meta mais alcançável
- ✅ Motiva usuários iniciantes
- ✅ Ainda oferece segurança razoável

**Desvantagens:**
- ⚠️ Menos seguro que 6 meses
- ⚠️ Pode não cobrir crises longas

**Exemplo com 3 meses:**
```
FÔLEGO: R$ 967,91
Média: R$ 575,88
Índice: 1,68 meses

Score: (1,68 ÷ 3) × 100 = 56,0 pontos
```

---

### Opção 3: 12 Meses (Muito Conservador)
```
Meta: 12 meses
100 pontos = 12 meses de reserva
Referência: Padrão ultra-conservador
```

**Vantagens:**
- ✅ Segurança máxima absoluta
- ✅ Ideal para autônomos/empresários

**Desvantagens:**
- ⚠️ Meta muito difícil
- ⚠️ Pode desmotivar a maioria dos usuários

**Exemplo com 12 meses:**
```
FÔLEGO: R$ 967,91
Média: R$ 575,88
Índice: 1,68 meses

Score: (1,68 ÷ 12) × 100 = 14,0 pontos
```

---

## 📊 Comparação de Escalas

| Escala | Meta | Score Atual | Interpretação |
|--------|------|-------------|---------------|
| **6 meses** (atual) | 6 meses | 28,0 pts | Fraco (28% do ideal) |
| **3 meses** (flexível) | 3 meses | 56,0 pts | Razoável (56% do ideal) |
| **12 meses** (conservador) | 12 meses | 14,0 pts | Muito Fraco (14% do ideal) |

---

## 🎯 Recomendação

### Manter 6 Meses (Atual)

**Motivos:**
1. ✅ **Padrão Internacional:** Reconhecido mundialmente
2. ✅ **Educação Financeira:** Ensina a meta correta aos usuários
3. ✅ **Segurança Real:** 6 meses é o mínimo para crises sérias
4. ✅ **Diferenciação:** Mostra que o FinCore segue boas práticas

**Mensagem para o Usuário:**
```
"Você tem 1,68 meses de reserva (28% da meta ideal de 6 meses).
Continue construindo sua reserva de emergência!"
```

---

## 🔧 Como Ajustar (Se Quiser)

### Código Atual
```go
// PILLAR 1: Liquidez Score (35%)
// Max score when FÔLEGO covers 6+ months of expenses
liquidezIndex := clamp(summary.AvailableForCalculations/avgMonthlyExpenses, 0, 6)
scoreLiquidez := (liquidezIndex / 6) * 100
```

### Para Mudar para 3 Meses
```go
// PILLAR 1: Liquidez Score (35%)
// Max score when FÔLEGO covers 3+ months of expenses
liquidezIndex := clamp(summary.AvailableForCalculations/avgMonthlyExpenses, 0, 3)
scoreLiquidez := (liquidezIndex / 3) * 100
```

### Para Mudar para 12 Meses
```go
// PILLAR 1: Liquidez Score (35%)
// Max score when FÔLEGO covers 12+ months of expenses
liquidezIndex := clamp(summary.AvailableForCalculations/avgMonthlyExpenses, 0, 12)
scoreLiquidez := (liquidezIndex / 12) * 100
```

---

## 💡 Sugestão Alternativa: Escala Progressiva

### Níveis de Segurança
```
0-1 mês:   Crítico (0-17 pontos)
1-3 meses: Atenção (17-50 pontos)
3-6 meses: Razoável (50-100 pontos)
6+ meses:  Excelente (100 pontos)
```

**Código:**
```go
liquidezMonths := summary.AvailableForCalculations / avgMonthlyExpenses

if liquidezMonths >= 6 {
    scoreLiquidez = 100
} else if liquidezMonths >= 3 {
    scoreLiquidez = 50 + ((liquidezMonths - 3) / 3) * 50
} else if liquidezMonths >= 1 {
    scoreLiquidez = 17 + ((liquidezMonths - 1) / 2) * 33
} else {
    scoreLiquidez = (liquidezMonths / 1) * 17
}
```

---

## 📚 Referências

### Educadores Financeiros Brasileiros
- **Gustavo Cerbasi:** "Reserva de 6 meses é o mínimo"
- **Nathalia Arcuri (Me Poupe!):** "6 meses de despesas fixas"
- **Thiago Nigro (Primo Rico):** "Reserva de emergência = 6 meses"

### Padrão Internacional
- **Dave Ramsey (EUA):** "3-6 months of expenses"
- **Suze Orman (EUA):** "8 months of expenses"
- **Martin Lewis (UK):** "3-6 months of essential costs"

---

## ✅ Conclusão

**6 meses** é o padrão **correto e recomendado** porque:

1. ✅ Baseado em estudos de crises financeiras
2. ✅ Tempo médio de recuperação de emprego
3. ✅ Padrão internacional reconhecido
4. ✅ Ensina boas práticas aos usuários

**Minha recomendação:** Manter 6 meses, mas você pode ajustar se preferir uma abordagem mais flexível (3 meses) ou mais conservadora (12 meses).

---

**Versão:** 1.0  
**Status:** ✅ EXPLICADO  
**Última Atualização:** 21/12/2025 15:32

**Quer que eu ajuste para outro valor?** 🎯
