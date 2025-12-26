# 📊 ANÁLISE: Cálculo de Yield Proporcional ao Tempo

**Data**: 26/12/2025 11:06  
**Status**: 🔍 EM ANÁLISE  
**Prioridade**: 🔴 ALTA

---

## 🏦 COMO OS BANCOS CALCULAM

### Método Correto: **Saldo do Dia Anterior**

Os bancos calculam o rendimento de hoje baseado no **saldo que você tinha no final do dia anterior**.

### Exemplo Real (seu caso):

**Histórico:**
- **10/12**: Depositou R$ 1.500
- **21/12**: Depositou R$ 500
- **26/12**: Saldo total R$ 2.000 + yields anteriores

**Cálculo do Yield em 26/12:**
```
Base = Saldo em 25/12 (final do dia anterior)
Yield = Base × 0,06% × 120%
Yield = R$ 1,01 (conforme você observou!)
```

---

## 🐛 PROBLEMA ATUAL

O código está usando:
```go
baseAmount = saldo_atual + yields_anteriores
```

Isso dá R$ 2.007,69, mas deveria usar o **saldo do dia anterior**!

---

## ✅ SOLUÇÃO

Modificar `GetBaseAmountForPocket` para retornar o saldo do **dia anterior**, não o saldo atual.

**Regra:**
> Rendimento de HOJE = Saldo do FINAL de ONTEM × Taxa

---

**Quer que eu implemente essa correção?**
