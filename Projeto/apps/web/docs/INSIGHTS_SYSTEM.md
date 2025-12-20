# Sistema de Insights Inteligentes

## 📊 Visão Geral

O sistema de insights analisa automaticamente os dados financeiros do usuário e gera recomendações personalizadas em tempo real.

## 🎯 Funcionalidades Atuais (Sem custo)

### Motor de Regras (Rule-Based AI)
Atualmente implementado com **zero custo**, analisando:

1. **Saldos Negativos**
   - Detecta contas no vermelho
   - Calcula total de débito
   - Prioridade: 10/10

2. **Concentração de Recursos**
   - Identifica se >80% está em uma conta
   - Sugere diversificação
   - Prioridade: 7/10

3. **Contas Inativas com Saldo**
   - Alerta sobre recursos "esquecidos"
   - Prioridade: 5/10

4. **Saúde Financeira Geral**
   - Parabeniza quando tudo está positivo
   - Prioridade: 3/10

5. **Simplificação**
   - Sugere consolidar quando há muitas contas
   - Prioridade: 4/10

6. **Reserva de Emergência**
   - Verifica se tem 3-6 meses guardados
   - Prioridade: 8/10

## 🚀 Expansão Futura (APIs Gratuitas)

### Opção 1: Groq (Recomendado)
**Modelo:** Llama 3.1 70B  
**Custo:** GRATUITO (até 14.400 requisições/dia)  
**Velocidade:** ~280 tokens/segundo

```typescript
// lib/ai-insights.ts
import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export async function generateAIInsights(accounts: AccountData[]) {
  const prompt = `
    Analise os seguintes dados financeiros e gere 3 insights personalizados:
    ${JSON.stringify(accounts, null, 2)}
    
    Retorne em formato JSON com: title, message, type (warning/success/info)
  `
  
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.1-70b-versatile",
    temperature: 0.7,
    max_tokens: 500
  })
  
  return JSON.parse(completion.choices[0].message.content)
}
```

**Setup:**
```bash
npm install groq-sdk
```

**Variável de ambiente:**
```env
GROQ_API_KEY=gsk_...
```

**Obter chave:** https://console.groq.com/keys

---

### Opção 2: Hugging Face Inference API
**Modelo:** Mistral 7B ou Llama 2  
**Custo:** GRATUITO (rate limit: 1000 req/hora)

```typescript
import { HfInference } from "@huggingface/inference"

const hf = new HfInference(process.env.HF_TOKEN)

export async function generateHFInsights(accounts: AccountData[]) {
  const response = await hf.textGeneration({
    model: "mistralai/Mistral-7B-Instruct-v0.2",
    inputs: `Analise: ${JSON.stringify(accounts)}`,
    parameters: {
      max_new_tokens: 300,
      temperature: 0.7
    }
  })
  
  return response.generated_text
}
```

**Setup:**
```bash
npm install @huggingface/inference
```

**Obter token:** https://huggingface.co/settings/tokens

---

### Opção 3: OpenAI (Pago, mas poderoso)
**Modelo:** GPT-4o-mini  
**Custo:** $0.15 / 1M tokens input

```typescript
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function generateOpenAIInsights(accounts: AccountData[]) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{
      role: "system",
      content: "Você é um consultor financeiro especializado."
    }, {
      role: "user",
      content: `Analise: ${JSON.stringify(accounts)}`
    }],
    response_format: { type: "json_object" }
  })
  
  return JSON.parse(completion.choices[0].message.content)
}
```

---

## 🔧 Como Integrar

### 1. Adicionar variável de ambiente
```env
# .env.local
GROQ_API_KEY=gsk_your_key_here
```

### 2. Criar função híbrida
```typescript
// lib/insights-engine.ts

export class InsightsEngine {
  static async generateInsights(accounts: AccountData[]) {
    // Sempre gera insights baseados em regras (grátis)
    const ruleBasedInsights = this.generateAccountInsights(accounts)
    
    // Se tiver API key, adiciona insights de IA
    if (process.env.GROQ_API_KEY) {
      try {
        const aiInsights = await generateAIInsights(accounts)
        return [...ruleBasedInsights, ...aiInsights]
      } catch (error) {
        console.error('AI insights failed, using rules only')
      }
    }
    
    return ruleBasedInsights
  }
}
```

### 3. Usar no componente
```tsx
// Muda de síncrono para assíncrono
const insights = await InsightsEngine.generateInsights(accounts)
```

---

## 📈 Roadmap de Insights

### Fase 1 (Atual) ✅
- [x] Detecção de saldos negativos
- [x] Análise de concentração
- [x] Alertas de contas inativas
- [x] Verificação de reserva de emergência

### Fase 2 (Próxima)
- [ ] Análise de padrões de gastos
- [ ] Previsão de saldo futuro
- [ ] Detecção de gastos recorrentes
- [ ] Sugestões de economia

### Fase 3 (Com IA)
- [ ] Insights personalizados por perfil
- [ ] Comparação com usuários similares
- [ ] Recomendações de investimento
- [ ] Alertas preditivos

---

## 💡 Dicas de Implementação

### Performance
- Cache insights por 1 hora (evita recalcular)
- Use server components quando possível
- Limite a 3-5 insights por vez

### UX
- Permita dispensar insights
- Salve preferências do usuário
- Mostre insights mais importantes primeiro

### Privacidade
- Nunca envie dados sensíveis para APIs externas sem consentimento
- Use anonimização quando possível
- Implemente opt-in para IA

---

## 🎨 Customização

### Adicionar novo tipo de insight
```typescript
// lib/insights-engine.ts

// Análise 7: Gastos com lazer
const leisureAccounts = accounts.filter(a => a.type === 'lazer')
if (leisureAccounts.length > 0) {
  insights.push({
    id: 'leisure-spending',
    type: 'info',
    title: '🎉 Equilíbrio é importante',
    message: 'Você destinou X% para lazer este mês.',
    priority: 6
  })
}
```

### Personalizar cores
```tsx
// components/insights-panel.tsx
const getStyles = (type: Insight['type']) => {
  // Customize aqui
}
```

---

## 📊 Métricas Sugeridas

Para medir eficácia dos insights:
- Taxa de cliques em ações sugeridas
- Insights dispensados vs aceitos
- Mudanças de comportamento após insight
- Satisfação do usuário (NPS)

---

## 🔒 Segurança

- **Nunca** exponha API keys no frontend
- Use server actions para chamadas de IA
- Implemente rate limiting
- Valide todos os inputs

---

**Status:** ✅ Pronto para produção (modo regras)  
**Próximo passo:** Integrar Groq para insights ainda mais inteligentes
