# 🤖 Configuração de Insights com IA (Groq)

## ✅ Status Atual

O sistema de insights está **funcionando** com regras inteligentes (sem custo).

Para ativar insights com **IA real Llama 3.1 70B** (gratuito e rápido), siga os passos abaixo:

---

## 🚀 Ativar Groq (Gratuito e Rápido)

### 1. Criar conta
Acesse: https://console.groq.com

### 2. Gerar API Key
1. Faça login
2. Vá em: https://console.groq.com/keys
3. Clique em "Create API Key"
4. Nome: `financeiro-insights`
5. Copie a chave (começa com `gsk_...`)

### 3. Adicionar ao projeto
Edite o arquivo `.env.local`:

```env
GROQ_API_KEY=gsk_sua_chave_aqui
NEXT_PUBLIC_GROQ_API_KEY=gsk_sua_chave_aqui
```

### 4. Reiniciar servidor
```bash
npm run dev
```

---

## 📊 Como Funciona

### Sem API Key (Atual)
- ✅ Insights baseados em regras
- ✅ Zero custo
- ✅ Funciona offline
- ⚠️ Mensagens genéricas

**Exemplo:**
> 💡 Considere investir parte deste saldo

### Com API Key Groq (Recomendado)
- ✅ Insights personalizados por IA
- ✅ **Gratuito** (14.400 req/dia)
- ✅ **Super rápido** (280 tokens/seg)
- ✅ **Llama 3.1 70B** (modelo poderoso)
- ✅ Análise contextual

**Exemplo:**
> 💡 Com R$ 15.000 parado, considere CDB ou Tesouro Direto para rentabilizar

---

## 🎯 Onde Aparecem os Insights

### 1. Card de Saldo Consolidado
- Insight sobre saúde financeira geral
- Aparece no card azul grande

### 2. Cards Individuais de Conta
- Insight específico para cada conta
- Aparece abaixo do saldo

---

## 💰 Limites Gratuitos

### Groq
- **14.400 requisições/dia**
- **280 tokens/segundo** (muito rápido!)
- **Sem custo**
- **Sem cartão de crédito**

---

## 🐛 Troubleshooting

### "Insights não aparecem"
1. Verifique se tem contas cadastradas
2. Recarregue a página (Ctrl+R)

### "Erro de API"
1. Verifique se a chave está correta
2. Confirme que está no `.env.local`
3. Reinicie o servidor

### "Rate limit exceeded"
- Aguarde até o próximo dia (limite diário)
- Ou use regras (sempre funciona)

---

## 🔧 Vantagens do Groq vs Hugging Face

| Feature | Groq | Hugging Face |
|---------|------|--------------|
| Modelo | Llama 3.1 70B | GPT-2/Mistral |
| Velocidade | 280 tok/s | ~50 tok/s |
| Limite/dia | 14.400 | 1.000 |
| Permissões | Simples | Complexas |
| Qualidade | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

**Groq é MUITO melhor!** 🚀
