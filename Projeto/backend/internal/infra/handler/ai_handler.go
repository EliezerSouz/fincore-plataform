package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

type AIHandler struct{}

func NewAIHandler() *AIHandler {
	return &AIHandler{}
}

type GroqRequest struct {
	Model          string        `json:"model"`
	Messages       []GroqMessage `json:"messages"`
	ResponseFormat struct {
		Type string `json:"type"`
	} `json:"response_format"`
	Temperature float64 `json:"temperature"`
}

type GroqMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type GroqResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func (h *AIHandler) GenerateInsight(c *gin.Context) {
	// 1. Define input structure (simplified for parsing)
	type TxInput struct {
		Date        string  `json:"date"`
		Description string  `json:"description"`
		Amount      float64 `json:"amount"`
		Type        string  `json:"type"` // receita, despesa
		Category    string  `json:"category"`
		Account     string  `json:"account"`
	}
	var requestData struct {
		Transactions []TxInput `json:"transactions"`
	}

	if err := c.ShouldBindJSON(&requestData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI service not configured"})
		return
	}

	// 2. Perform Aggregation in Go
	byCategory := make(map[string]float64)
	byAccount := make(map[string]float64)
	byType := make(map[string]float64)

	// Track biggest expense
	var biggestExpense TxInput
	var biggestExpenseVal float64 = 0

	for _, tx := range requestData.Transactions {
		val := tx.Amount
		cat := tx.Category
		if cat == "" {
			cat = "Outros"
		}
		acc := tx.Account
		if acc == "" {
			acc = "Geral"
		}

		// Ignore transfers - Internal movement, not expense
		if strings.EqualFold(cat, "Transferência") || strings.EqualFold(cat, "Transferencia") || strings.EqualFold(tx.Type, "transferencia") {
			continue
		}

		// Aggregate
		if tx.Type == "despesa" {
			byCategory[cat] += val
			byType["Saídas"] += val

			if val > biggestExpenseVal {
				biggestExpenseVal = val
				biggestExpense = tx
			}
		} else {
			byType["Entradas"] += val
		}

		// Balance impact on account
		if tx.Type == "despesa" {
			byAccount[acc] -= val
		} else {
			byAccount[acc] += val
		}
	}

	// 3. Construct Summary Context
	summary := "Resumo Financeiro:\n"
	summary += fmt.Sprintf("Total Entradas: R$ %.2f\n", byType["Entradas"])
	summary += fmt.Sprintf("Total Saídas: R$ %.2f\n", byType["Saídas"])

	summary += "\nGastos por Categoria:\n"
	for cat, val := range byCategory {
		if val > 0 {
			summary += fmt.Sprintf("- %s: R$ %.2f\n", cat, val)
		}
	}

	if biggestExpenseVal > 0 {
		summary += fmt.Sprintf("\nMaior despesa única: %s (R$ %.2f) em %s\n", biggestExpense.Description, biggestExpenseVal, biggestExpense.Date)
	}

	// 4. Call AI
	prompt := fmt.Sprintf(`FINCORE — CFO SÊNIOR ORIENTADO À SAÚDE FINANCEIRA MÁXIMA

Missão:
Avaliar profundamente a saúde financeira de um indivíduo a partir de dados reais de UM único período, revelando limites estruturais, riscos relevantes e margens concretas de melhoria financeira.

Princípios inegociáveis:
- Use EXCLUSIVAMENTE os dados fornecidos
- NÃO compare períodos
- NÃO projete cenários futuros
- NÃO infira tendências
- Se não houver base matemática clara, NÃO gere insight

Base analítica permitida:
- Valores absolutos (R$)
- Percentuais sobre o total do período
- Proporções internas entre receitas, despesas, saldo e endividamento
- Concentração de receitas ou despesas como fator de risco

Leitura financeira obrigatória:
- Receita: fortalece autonomia OU gera dependência
- Despesa: reduz flexibilidade financeira
- Endividamento: reduz margem e aumenta fragilidade estrutural
- Saldo: representa margem de segurança OU exposição a risco
- Concentração excessiva é sempre um ponto de atenção

Critério de validade do insight:
Um insight só é válido se:
- Alterar a leitura real da saúde financeira
- Explicitar um risco oculto OU uma margem clara de melhoria
- Justificar uma decisão financeira objetiva

Insights fracos, descritivos ou redundantes são proibidos.

Formato do insight:

TÍTULO:
- Até 35 caracteres
- Deve expressar consequência financeira direta
- Nunca descrever apenas o dado

DESCRIÇÃO:
- Conectar número → impacto financeiro real
- Usar R$ e/ou %
- Explicitar como o dado afeta a saúde financeira máxima

SUGESTÃO:
- Uma única decisão clara e acionável
- Deve definir prioridade, limite ou destino de capital
- Proibido usar verbos genéricos como “avaliar”, “considerar”, “acompanhar”

Quantidade:
- Gere EXATAMENTE 3 insights
- Cada insight deve abordar um eixo distinto da saúde financeira
- Priorize impacto estrutural sobre efeitos marginais

Classificação obrigatória:
- type: alerta | oportunidade | informativo
- category: despesa | receita | recorrente | endividamento
- priority: alta | média

Formato de saída (JSON estrito):
{
  "insights": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "type": "alerta|oportunidade|informativo",
      "category": "despesa|receita|recorrente|endividamento",
      "priority": "alta|média",
      "suggestedAction": "string"
    }
  ]
}

Idioma:
PT-BR

Dados:
%s
`, summary)

	// DEBUG: Print the summary/prompt being sent to AI
	fmt.Println("------------- [AI PROMPT START] -------------")
	fmt.Println(prompt)
	fmt.Println("------------- [AI PROMPT END] -------------")

	groqReq := GroqRequest{
		Model: "llama-3.3-70b-versatile", // Reverted to Llama 3.3 per user request
		Messages: []GroqMessage{
			{Role: "user", Content: prompt},
		},
		ResponseFormat: struct {
			Type string `json:"type"`
		}{Type: "json_object"},
		Temperature: 0.5,
	}

	jsonData, _ := json.Marshal(groqReq)

	req, _ := http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to call AI provider"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	// DEBUG: Print raw response
	fmt.Println("------------- [AI RESPONSE RAW] -------------")
	fmt.Println(string(body))
	fmt.Println("------------- [AI RESPONSE END] -------------")

	if resp.StatusCode != 200 {
		fmt.Printf("Groq Error: %s\n", string(body))
		var groqErr struct {
			Error struct {
				Message string `json:"message"`
			} `json:"error"`
		}
		if json.Unmarshal(body, &groqErr) == nil && groqErr.Error.Message != "" {
			c.JSON(resp.StatusCode, gin.H{"error": fmt.Sprintf("Groq Error: %s", groqErr.Error.Message)})
		} else {
			c.JSON(resp.StatusCode, gin.H{"error": fmt.Sprintf("AI Provider Error (%d): %s", resp.StatusCode, string(body))})
		}
		return
	}

	var groqResp GroqResponse
	if err := json.Unmarshal(body, &groqResp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse AI response"})
		return
	}

	if len(groqResp.Choices) > 0 {
		content := groqResp.Choices[0].Message.Content

		// Clean up Markdown code blocks if present
		if strings.Contains(content, "```") {
			content = strings.ReplaceAll(content, "```json", "")
			content = strings.ReplaceAll(content, "```", "")
			content = strings.TrimSpace(content)
		}

		var result map[string]interface{}
		if err := json.Unmarshal([]byte(content), &result); err != nil {
			// Fallback
			c.JSON(200, gin.H{
				"insights": []string{content},
			})
			return
		}

		// If it's a map (Object) but we wanted an array, maybe the AI put the array inside a key.
		// Or if it IS an array (unlikely with response_format: json_object, but possible).
		c.JSON(200, result)
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No insight generated"})
	}
}
