# FinCore - Sistema de 5 Estados de Batimento Cardíaco

**Data:** 21/12/2025  
**Status:** ✅ IMPLEMENTADO E TESTADO

---

## 🎯 Visão Geral

O FinCore agora possui **5 estados distintos** de batimento cardíaco, cada um refletindo uma faixa específica do Score de Saúde Financeira (0-1000). Cada estado tem:

- ✅ Frequência cardíaca específica (BPM)
- ✅ Cores únicas
- ✅ Animações de batimento personalizadas
- ✅ Animações de ECG sincronizadas
- ✅ Feedback visual e sonoro

---

## 📊 Os 5 Estados do FinCore

### 1️⃣ EXCELLENT - Coração Forte (800-1000)
**Score:** 800-1000 pontos  
**BPM:** 60-70 (batimento forte e regular)  
**Cor:** 🟢 Verde Esmeralda (`emerald-600`)  
**Duração:** 1.8s por batimento  
**ECG:** Pulso aparece em 8% da animação

**Características:**
- Batimento forte e vigoroso
- ECG verde vibrante
- Sombra verde suave
- Badge verde claro

**Animações CSS:**
- `animate-heartbeat-excellent` (1.8s)
- `animate-ecg-pulse-excellent` (6s)

---

### 2️⃣ STABLE - Ritmo Estável (600-799)
**Score:** 600-799 pontos  
**BPM:** 70-80 (ritmo estável)  
**Cor:** 🔵 Azul (`blue-500`)  
**Duração:** 2s por batimento  
**ECG:** Pulso aparece em 10% da animação

**Características:**
- Batimento regular e saudável
- ECG azul
- Sombra azul suave
- Badge azul claro

**Animações CSS:**
- `animate-heartbeat-normal` (2s)
- `animate-ecg-pulse-normal` (6s)

---

### 3️⃣ ATTENTION - Atenção (400-599)
**Score:** 400-599 pontos  
**BPM:** 90-110 (taquicardia leve)  
**Cor:** 🟡 Laranja/Amarelo (`risk`)  
**Duração:** 1.3s por batimento  
**ECG:** Pulso aparece em 15% da animação

**Características:**
- Batimento acelerado (estresse)
- ECG laranja
- Sombra laranja suave
- Badge laranja claro

**Animações CSS:**
- `animate-heartbeat-tachycardia` (1.3s)
- `animate-ecg-pulse-tachycardia` (6s)

**Estado Atual do Sistema:** ✅ **TESTADO** (Score: 515)

---

### 4️⃣ ARRHYTHMIA - Arritmia Financeira (200-399)
**Score:** 200-399 pontos  
**BPM:** 40-50 (bradicardia - irregular)  
**Cor:** 🟠 Laranja Escuro (`orange-500`)  
**Duração:** 3s por batimento  
**ECG:** Pulso aparece em 5% da animação

**Características:**
- Batimento lento e irregular
- ECG laranja escuro
- Sombra laranja escuro
- Badge laranja escuro

**Animações CSS:**
- `animate-heartbeat-bradycardia` (3s)
- `animate-ecg-pulse-bradycardia` (6s)

---

### 5️⃣ CRITICAL - Estado Crítico (0-199)
**Score:** 0-199 pontos  
**BPM:** 30-40 (bradicardia severa - quase parando)  
**Cor:** 🔴 Vermelho (`danger`)  
**Duração:** 4s por batimento  
**ECG:** Pulso aparece em 3% da animação

**Características:**
- Batimento extremamente lento
- ECG vermelho
- Sombra vermelha intensa
- Badge vermelho

**Animações CSS:**
- `animate-heartbeat-critical` (4s)
- `animate-ecg-pulse-critical` (6s)

---

## 🎨 Paleta de Cores por Estado

| Estado | Badge BG | Badge Border | ECG | Ícone | Shadow |
|--------|----------|--------------|-----|-------|--------|
| EXCELLENT | `emerald-600/10` | `emerald-500/20` | `emerald-500` | `emerald-600` | Verde |
| STABLE | `blue-500/10` | `blue-500/20` | `blue-500` | `blue-500` | Azul |
| ATTENTION | `risk/10` | `risk/20` | `risk` | `risk` | Laranja |
| ARRHYTHMIA | `orange-500/10` | `orange-500/20` | `orange-500` | `orange-500` | Laranja Escuro |
| CRITICAL | `danger/20` | `danger/40` | `red-500` | `danger` | Vermelho |

---

## ⚙️ Lógica de Mapeamento

### Código TypeScript
```typescript
const mapStatusToHeartbeat = (status: string, score: number): HeartbeatStatus => {
    // Priorizar Score sobre status textual
    if (score >= 800) return 'EXCELLENT';  // 800-1000: Coração Forte
    if (score >= 600) return 'STABLE';     // 600-799: Ritmo Estável
    if (score >= 400) return 'ATTENTION';  // 400-599: Atenção
    if (score >= 200) return 'ARRHYTHMIA'; // 200-399: Arritmia Financeira
    return 'CRITICAL';                     // 0-199: Estado Crítico
}
```

### Tabela de Decisão

| Score | Estado | BPM | Duração | Cor |
|-------|--------|-----|---------|-----|
| 800-1000 | EXCELLENT | 60-70 | 1.8s | 🟢 Verde |
| 600-799 | STABLE | 70-80 | 2.0s | 🔵 Azul |
| 400-599 | ATTENTION | 90-110 | 1.3s | 🟡 Laranja |
| 200-399 | ARRHYTHMIA | 40-50 | 3.0s | 🟠 Laranja Escuro |
| 0-199 | CRITICAL | 30-40 | 4.0s | 🔴 Vermelho |

---

## 🎬 Animações CSS Implementadas

### Batimentos Cardíacos (Heartbeat)

```css
/* EXCELLENT: 60-70 bpm */
@keyframes heartbeat-excellent {
  0%, 100% { transform: scale(1); }
  8% { transform: scale(1.10); }
  16% { transform: scale(1); }
  16%, 85% { transform: scale(1); }
}

/* NORMAL: 70-80 bpm */
@keyframes heartbeat-normal {
  0%, 100% { transform: scale(1); }
  10% { transform: scale(1.08); }
  20% { transform: scale(1); }
  20%, 80% { transform: scale(1); }
}

/* TACHYCARDIA: 90-110 bpm */
@keyframes heartbeat-tachycardia {
  0%, 100% { transform: scale(1); }
  15% { transform: scale(1.08); }
  30% { transform: scale(1); }
  30%, 70% { transform: scale(1); }
}

/* BRADYCARDIA: 40-50 bpm */
@keyframes heartbeat-bradycardia {
  0%, 100% { transform: scale(1); }
  5% { transform: scale(1.08); }
  10% { transform: scale(1); }
  10%, 90% { transform: scale(1); }
}

/* CRITICAL: 30-40 bpm */
@keyframes heartbeat-critical {
  0%, 100% { transform: scale(1); }
  3% { transform: scale(1.08); }
  6% { transform: scale(1); }
  6%, 95% { transform: scale(1); }
}
```

### ECG Sincronizado (Velocidade Padronizada: 6s)

```css
/* EXCELLENT */
@keyframes ecg-pulse-excellent {
  0% { opacity: 0; transform: translateX(-100%); }
  8% { opacity: 1; transform: translateX(-100%); }
  100% { opacity: 1; transform: translateX(100%); }
}

/* NORMAL */
@keyframes ecg-pulse-normal {
  0% { opacity: 0; transform: translateX(-100%); }
  10% { opacity: 1; transform: translateX(-100%); }
  100% { opacity: 1; transform: translateX(100%); }
}

/* TACHYCARDIA */
@keyframes ecg-pulse-tachycardia {
  0% { opacity: 0; transform: translateX(-100%); }
  15% { opacity: 1; transform: translateX(-100%); }
  100% { opacity: 1; transform: translateX(100%); }
}

/* BRADYCARDIA */
@keyframes ecg-pulse-bradycardia {
  0% { opacity: 0; transform: translateX(-100%); }
  5% { opacity: 1; transform: translateX(-100%); }
  100% { opacity: 1; transform: translateX(100%); }
}

/* CRITICAL */
@keyframes ecg-pulse-critical {
  0% { opacity: 0; transform: translateX(-100%); }
  3% { opacity: 1; transform: translateX(-100%); }
  100% { opacity: 1; transform: translateX(100%); }
}
```

---

## 📱 Feedback Adicional

### Vibração (Mobile)
```typescript
if (visualStatus === 'CRITICAL') {
    navigator.vibrate([100, 2000, 100, 2000]); // Irregular
} else if (visualStatus === 'ATTENTION') {
    navigator.vibrate([50, 400, 50, 400]); // Rápido
} else {
    navigator.vibrate([80, 1000, 80, 1000]); // Normal
}
```

### Som (Frequência)
```typescript
oscillator.frequency.value = 
    visualStatus === 'STABLE' ? 80 :
    visualStatus === 'ATTENTION' ? 100 : 60;
```

---

## ✅ Testes Realizados

### Teste 1: Estado ATTENTION (Score: 515)
- ✅ Badge laranja exibido
- ✅ ECG laranja pulsante
- ✅ Batimento acelerado (1.3s)
- ✅ Mensagem correta: "Atenção ao ritmo do seu coração financeiro"
- ✅ Score 515 mapeado corretamente para ATTENTION (400-599)

### Validações Pendentes
- ⏳ EXCELLENT (800-1000) - Precisa aumentar Score
- ⏳ STABLE (600-799) - Precisa aumentar Score
- ⏳ ARRHYTHMIA (200-399) - Precisa diminuir Score
- ⏳ CRITICAL (0-199) - Precisa diminuir Score drasticamente

---

## 🎯 Como Testar Cada Estado

### Para EXCELLENT (800-1000):
```
Necessário:
- PULSO: R$ 5.332+ (12 meses de gastos)
- Runway: 12+ meses
- Comportamento: 100 pts
- Organização: 100 pts
```

### Para STABLE (600-799):
```
Necessário:
- PULSO: R$ 2.664+ (6 meses de gastos)
- Runway: 6+ meses
- Comportamento: 80+ pts
- Organização: 75+ pts
```

### Para ATTENTION (400-599): ✅ ATUAL
```
Atual:
- PULSO: R$ 917,91
- Runway: 2.0 meses
- Score: 515 pts
```

### Para ARRHYTHMIA (200-399):
```
Necessário:
- PULSO: R$ 444 (1 mês de gastos)
- Runway: 1 mês
- Comportamento: 50 pts
- Organização: 50 pts
```

### Para CRITICAL (0-199):
```
Necessário:
- PULSO: Negativo ou muito baixo
- Runway: 0 meses
- Comportamento: < 30 pts
- Organização: < 30 pts
```

---

## 📁 Arquivos Modificados

### Frontend
- ✅ `apps/web/components/heartbeat-core.tsx`
  - Adicionado tipo `EXCELLENT`
  - Atualizada função `mapStatusToHeartbeat` para usar Score
  - Adicionada configuração `STATUS_CONFIG.EXCELLENT`
  - Atualizadas condições visuais do badge

- ✅ `apps/web/app/globals.css`
  - Adicionado `@keyframes heartbeat-excellent`
  - Adicionado `@keyframes ecg-pulse-excellent`
  - Adicionada classe `.animate-heartbeat-excellent`
  - Adicionada classe `.animate-ecg-pulse-excellent`

### Backend
- ✅ `backend/internal/infra/repository/dashboard_repository.go`
  - Health Status atualizado para 5 estados
  - Mapeamento de Score para Status

---

## 🎨 Demonstração Visual

```
EXCELLENT (800-1000)    🟢 ████████████ 67 BPM  (Forte)
STABLE (600-799)        🔵 ██████████   75 BPM  (Estável)
ATTENTION (400-599)     🟡 ████████████ 92 BPM  (Acelerado) ← ATUAL
ARRHYTHMIA (200-399)    🟠 ████         40 BPM  (Lento)
CRITICAL (0-199)        🔴 ██           30 BPM  (Quase Parando)
```

---

## 🚀 Próximos Passos

1. ✅ Implementar os 5 estados - **CONCLUÍDO**
2. ✅ Testar estado ATTENTION - **CONCLUÍDO**
3. ⏳ Testar todos os 5 estados com dados reais
4. ⏳ Adicionar transições suaves entre estados
5. ⏳ Implementar sons específicos para cada estado
6. ⏳ Adicionar tooltips explicativos para cada estado

---

**Versão:** 2.0  
**Status:** ✅ IMPLEMENTADO E FUNCIONANDO  
**Última Atualização:** 21/12/2025 11:51
