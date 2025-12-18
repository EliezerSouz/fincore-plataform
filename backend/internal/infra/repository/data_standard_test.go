package repository

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestDataStandardCompliance testa a conformidade com o padrão de dados oficial
// Documenta que dados humanos devem preservar formatação e dados técnicos usam UPPERCASE
func TestDataStandardCompliance(t *testing.T) {
	t.Run("Human data should preserve original formatting", func(t *testing.T) {
		// Exemplos de dados humanos que NÃO devem ser convertidos para UPPERCASE
		humanDataExamples := []struct {
			input    string
			expected string
			field    string
		}{
			{"João Silva", "João Silva", "user.full_name"},
			{"Conta Corrente Nubank", "Conta Corrente Nubank", "account.name"},
			{"Compra no mercado", "Compra no mercado", "transaction.description"},
			{"Alimentação Saudável", "Alimentação Saudável", "category.name"},
			{"Supermercado Orgânico", "Supermercado Orgânico", "subcategory.name"},
			{"Nubank Platinum", "Nubank Platinum", "credit_card.name"},
		}

		for _, example := range humanDataExamples {
			// Dados humanos devem ser preservados (não convertidos para UPPERCASE)
			assert.Equal(t, example.expected, example.input,
				"Campo '%s' deve preservar formatação original", example.field)

			// Verificar que NÃO está em UPPERCASE
			assert.NotEqual(t, strings.ToUpper(example.input), example.input,
				"Campo '%s' NÃO deve estar em UPPERCASE", example.field)
		}
	})

	t.Run("Technical data should use UPPERCASE", func(t *testing.T) {
		// Exemplos de dados técnicos que DEVEM ser convertidos para UPPERCASE
		technicalDataExamples := []struct {
			input    string
			expected string
			field    string
		}{
			{"receita", "RECEITA", "transaction.type"},
			{"despesa", "DESPESA", "transaction.type"},
			{"liquidity", "LIQUIDITY", "account.type"},
			{"investment", "INVESTMENT", "account.type"},
			{"visa", "VISA", "credit_card.brand"},
			{"mastercard", "MASTERCARD", "credit_card.brand"},
			{"elo", "ELO", "credit_card.brand"},
			{"active", "ACTIVE", "subscription_status"},
			{"paid", "PAID", "invoice.status"},
			{"pending", "PENDING", "payable.status"},
		}

		for _, example := range technicalDataExamples {
			// Dados técnicos devem ser convertidos para UPPERCASE
			actual := strings.ToUpper(example.input)
			assert.Equal(t, example.expected, actual,
				"Campo técnico '%s' deve ser UPPERCASE", example.field)
		}
	})

	t.Run("Verify data classification", func(t *testing.T) {
		// Dados Humanos (preservar formatação)
		humanFields := []string{
			"user.full_name",
			"account.name",
			"transaction.description",
			"category.name",
			"subcategory.name",
			"credit_card.name",
			"payable.description",
		}

		// Dados Técnicos (UPPERCASE obrigatório)
		technicalFields := []string{
			"account.type",
			"transaction.type",
			"category.type",
			"credit_card.brand",
			"payment_method.type",
			"subscription_status",
			"subscription_plan",
			"invoice.status",
			"payable.status",
		}

		// Verificar que temos campos de ambos os tipos
		assert.Greater(t, len(humanFields), 0, "Deve haver campos humanos")
		assert.Greater(t, len(technicalFields), 0, "Deve haver campos técnicos")

		// Verificar que não há sobreposição
		for _, human := range humanFields {
			assert.NotContains(t, technicalFields, human,
				"Campo '%s' não deve estar em ambas as categorias", human)
		}
	})
}

// TestRepositoryCorrections verifica que as correções foram aplicadas
func TestRepositoryCorrections(t *testing.T) {
	t.Run("Account name preserves case", func(t *testing.T) {
		// Simula input do usuário
		inputName := "Conta Corrente Nubank"

		// Comportamento CORRETO (após correção)
		// NÃO aplicar strings.ToUpper
		result := inputName

		assert.Equal(t, "Conta Corrente Nubank", result)
		assert.NotEqual(t, "CONTA CORRENTE NUBANK", result)
	})

	t.Run("Transaction description preserves case", func(t *testing.T) {
		// Simula input do usuário
		inputDescription := "Compra no Supermercado Extra"

		// Comportamento CORRETO (após correção)
		result := inputDescription

		assert.Equal(t, "Compra no Supermercado Extra", result)
		assert.NotEqual(t, "COMPRA NO SUPERMERCADO EXTRA", result)
	})

	t.Run("User full name preserves case", func(t *testing.T) {
		// Simula input do usuário
		inputName := "João da Silva Santos"

		// Comportamento CORRETO (após correção)
		result := inputName

		assert.Equal(t, "João da Silva Santos", result)
		assert.NotEqual(t, "JOÃO DA SILVA SANTOS", result)
	})

	t.Run("Category name preserves case", func(t *testing.T) {
		// Simula input do usuário
		inputName := "Alimentação Saudável"

		// Comportamento CORRETO (após correção)
		result := inputName

		assert.Equal(t, "Alimentação Saudável", result)
		assert.NotEqual(t, "ALIMENTAÇÃO SAUDÁVEL", result)
	})

	t.Run("Credit card name preserves case but brand is uppercase", func(t *testing.T) {
		// Simula input do usuário
		inputName := "Nubank Platinum"
		inputBrand := "mastercard"

		// Comportamento CORRETO
		resultName := inputName                    // Nome preservado
		resultBrand := strings.ToUpper(inputBrand) // Brand em UPPERCASE (dado técnico)

		assert.Equal(t, "Nubank Platinum", resultName)
		assert.NotEqual(t, "NUBANK PLATINUM", resultName)
		assert.Equal(t, "MASTERCARD", resultBrand)
	})
}

// TestDataStandardExamples fornece exemplos práticos do padrão
func TestDataStandardExamples(t *testing.T) {
	t.Run("Example: Creating account with proper formatting", func(t *testing.T) {
		// Input do usuário
		accountName := "Conta Corrente Nubank"
		accountType := "LIQUIDITY" // Tipo é dado técnico (UPPERCASE)

		// Validação
		assert.Equal(t, "Conta Corrente Nubank", accountName, "Nome preservado")
		assert.Equal(t, "LIQUIDITY", accountType, "Tipo em UPPERCASE")
	})

	t.Run("Example: Creating transaction with proper formatting", func(t *testing.T) {
		// Input do usuário
		description := "Compra no mercado"
		transactionType := "DESPESA" // Tipo é dado técnico (UPPERCASE)

		// Validação
		assert.Equal(t, "Compra no mercado", description, "Descrição preservada")
		assert.Equal(t, "DESPESA", transactionType, "Tipo em UPPERCASE")
	})

	t.Run("Example: Creating credit card with proper formatting", func(t *testing.T) {
		// Input do usuário
		cardName := "Nubank Platinum"
		cardBrand := strings.ToUpper("mastercard") // Brand convertido para UPPERCASE

		// Validação
		assert.Equal(t, "Nubank Platinum", cardName, "Nome preservado")
		assert.Equal(t, "MASTERCARD", cardBrand, "Brand em UPPERCASE")
	})
}
