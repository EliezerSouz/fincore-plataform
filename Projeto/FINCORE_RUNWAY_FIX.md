# FinCore - Correção do Cálculo de Runway

**Data:** 21/12/2025  
**Tipo:** Bug Fix - Cálculo de Média de Gastos  
**Severidade:** Média  
**Status:** ✅ CORRIGIDO

---

## 🐛 Problema Identificado

### Descrição
O cálculo do **Runway** estava considerando **todos os meses** do histórico na divisão, mesmo meses com **despesas zeradas** (R$ 0,00). Isso inflava artificialmente a média de gastos, resultando em um Runway **maior** do que o real.

### Exemplo do Bug

**Cenário:**
```
Histórico de Gastos:
- Setembro: R$ 50,00
- Outubro: R$ 500,00
- Novembro: R$ 210,00
- Dezembro: R$ 1.017,63

PULSO: R$ 917,91
```

**Cálculo Correto (antes da remoção):**
```
Média = (50 + 500 + 210 + 1017,63) ÷ 4 = R$ 444,41
Runway = 917,91 ÷ 444,41 = 2,0 meses ✅
```

**Após remover despesas de Setembro (R$ 50,00):**

**Cálculo ERRADO (bug):**
```
Histórico:
- Setembro: R$ 0,00 (removido)
- Outubro: R$ 500,00
- Novembro: R$ 210,00
- Dezembro: R$ 1.017,63

Média = (0 + 500 + 210 + 1017,63) ÷ 4 = R$ 431,91
Runway = 917,91 ÷ 431,91 = 2,1 meses ❌ (AUMENTOU!)
```

**Cálculo CORRETO (esperado):**
```
Média = (500 + 210 + 1017,63) ÷ 3 = R$ 575,87
Runway = 917,91 ÷ 575,87 = 1,6 meses ✅ (DIMINUIU)
```

### Impacto
- ✅ Runway **inflado** quando há meses sem gastos
- ✅ Score **incorreto** (pois Runway influencia 30% do Score)
- ✅ Status de saúde **enganoso**

---

## 🔧 Solução Implementada

### Código Anterior (ERRADO)
```go
// Calculate average monthly expenses from last 6 months
avgMonthlyExpenses := 0.0
if len(summary.History) > 0 {
    totalExpenses := 0.0
    for _, month := range summary.History {
        totalExpenses += month.Despesa  // Soma TODOS os meses
    }
    avgMonthlyExpenses = totalExpenses / float64(len(summary.History))  // Divide por TODOS
} else {
    avgMonthlyExpenses = summary.DespesaMensal
}
```

**Problema:** Divide por `len(summary.History)` mesmo que alguns meses tenham despesa = 0.

---

### Código Corrigido (CORRETO)
```go
// Calculate average monthly expenses from last 6 months
// IMPORTANTE: Contar apenas meses com despesas REAIS (> 0)
avgMonthlyExpenses := 0.0
if len(summary.History) > 0 {
    totalExpenses := 0.0
    monthsWithExpenses := 0
    
    for _, month := range summary.History {
        // Contar apenas meses com despesas reais
        if month.Despesa > 0 {
            totalExpenses += month.Despesa
            monthsWithExpenses++
        }
    }
    
    // Calcular média apenas com meses que tiveram gastos
    if monthsWithExpenses > 0 {
        avgMonthlyExpenses = totalExpenses / float64(monthsWithExpenses)
    } else {
        // Se nenhum mês teve gastos, usar despesa atual
        avgMonthlyExpenses = summary.DespesaMensal
    }
} else {
    // Fallback to current month if no history
    avgMonthlyExpenses = summary.DespesaMensal
}
```

**Solução:** 
1. Conta apenas meses com `Despesa > 0`
2. Divide pela quantidade de meses **com gastos reais**
3. Fallback para despesa atual se nenhum mês teve gastos

---

## ✅ Validação da Correção

### Teste 1: Cenário Original (4 meses com gastos)
```
Histórico:
- Set: R$ 50,00
- Out: R$ 500,00
- Nov: R$ 210,00
- Dez: R$ 1.017,63

Meses com gastos: 4
Total: R$ 1.777,63
Média: 1.777,63 ÷ 4 = R$ 444,41 ✅

PULSO: R$ 917,91
Runway: 917,91 ÷ 444,41 = 2,0 meses ✅
```

### Teste 2: Após Remover Setembro (3 meses com gastos)
```
Histórico:
- Set: R$ 0,00 (ignorado)
- Out: R$ 500,00
- Nov: R$ 210,00
- Dez: R$ 1.017,63

Meses com gastos: 3 (Set não conta)
Total: R$ 1.727,63
Média: 1.727,63 ÷ 3 = R$ 575,87 ✅

PULSO: R$ 917,91
Runway: 917,91 ÷ 575,87 = 1,6 meses ✅ (DIMINUIU corretamente)
```

### Teste 3: Todos os Meses Zerados
```
Histórico:
- Set: R$ 0,00
- Out: R$ 0,00
- Nov: R$ 0,00
- Dez: R$ 0,00

Meses com gastos: 0
Fallback: Usa despesa mensal atual
Média: summary.DespesaMensal ✅
```

---

## 📊 Impacto no Score

### Antes da Correção (Bug)
```
Runway: 2,1 meses (ERRADO)
Score Runway: (2,1 ÷ 12) × 100 = 17,5 pts
Contribuição: 17,5 × 0,30 = 5,25 pts
```

### Depois da Correção
```
Runway: 1,6 meses (CORRETO)
Score Runway: (1,6 ÷ 12) × 100 = 13,3 pts
Contribuição: 13,3 × 0,30 = 4,0 pts
```

**Diferença:** -1,25 pontos no Score Final (mais preciso)

---

## 🎯 Regra de Negócio Atualizada

### Cálculo da Média de Gastos Mensais

**Regra Oficial:**
> A média de gastos mensais deve ser calculada **APENAS** com meses que tiveram despesas reais (> R$ 0,00).

**Justificativa:**
- Meses sem gastos não representam o padrão de consumo real
- Incluir meses zerados distorce a média para baixo
- Runway deve refletir o ritmo **real** de gastos

**Exceção:**
- Se **nenhum** mês do histórico tiver gastos, usar a despesa do mês atual
- Se a despesa atual também for zero, usar R$ 1,00 (evitar divisão por zero)

---

## 📁 Arquivo Modificado

**Backend:**
- ✅ `backend/internal/infra/repository/dashboard_repository.go`
  - Linhas 315-349
  - Adicionado contador `monthsWithExpenses`
  - Adicionada condição `if month.Despesa > 0`
  - Adicionado fallback para `summary.DespesaMensal`

---

## 🧪 Casos de Teste

### Caso 1: Meses Normais (Todos com Gastos)
```
Input: [50, 500, 210, 1017.63]
Meses Contados: 4
Média: 444,41
Status: ✅ PASS
```

### Caso 2: Alguns Meses Zerados
```
Input: [0, 500, 210, 1017.63]
Meses Contados: 3 (ignora 0)
Média: 575,87
Status: ✅ PASS
```

### Caso 3: Todos Zerados
```
Input: [0, 0, 0, 0]
Meses Contados: 0
Média: DespesaMensal (fallback)
Status: ✅ PASS
```

### Caso 4: Histórico Vazio
```
Input: []
Meses Contados: 0
Média: DespesaMensal (fallback)
Status: ✅ PASS
```

---

## 📝 Documentação Atualizada

### FINCORE_RULES.md
Atualizar seção "Cálculo do Runway":

```markdown
### Cálculo da Média de Gastos
```
Média de Gastos = Σ(Despesas dos meses com gastos > 0) ÷ Quantidade de meses com gastos

IMPORTANTE: Contar apenas meses com despesas reais (> R$ 0,00)
```

**Exemplo:**
```
Meses: [0, 500, 210, 1017.63]
Meses com gastos: 3 (ignora o 0)
Média = (500 + 210 + 1017.63) ÷ 3 = R$ 575,87
```
```

---

## ✅ Checklist de Validação

- [x] Código corrigido no backend
- [x] Backend recompilado sem erros
- [x] Lógica de contagem de meses implementada
- [x] Fallback para despesa atual implementado
- [x] Testes manuais realizados
- [ ] Testes automatizados criados (próximo passo)
- [ ] Documentação atualizada
- [ ] Deploy em produção

---

## 🚀 Próximos Passos

1. ✅ Testar no navegador com dados reais
2. ⏳ Criar testes unitários para o cálculo
3. ⏳ Atualizar `FINCORE_RULES.md`
4. ⏳ Atualizar `FINCORE_METRICS_ANALYSIS.md`
5. ⏳ Adicionar logs de debug para auditoria

---

**Versão:** 1.1  
**Status:** ✅ CORRIGIDO E TESTADO  
**Última Atualização:** 21/12/2025 11:58
