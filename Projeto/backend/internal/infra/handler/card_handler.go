package handler

import (
	"financeiro-api/internal/entity"
	"financeiro-api/internal/infra/repository"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CardHandler struct {
	repo *repository.CardRepository
}

func NewCardHandler(repo *repository.CardRepository) *CardHandler {
	return &CardHandler{repo: repo}
}

// Create cria um novo cartão de crédito
func (h *CardHandler) Create(c *gin.Context) {
	userID := c.GetString("user_id")

	var input entity.CreateCardInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	card, err := h.repo.Create(c.Request.Context(), userID, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create card"})
		return
	}

	c.JSON(http.StatusCreated, card)
}

// GetByID busca cartão por ID
func (h *CardHandler) GetByID(c *gin.Context) {
	userID := c.GetString("user_id")
	cardID := c.Param("id")

	card, err := h.repo.FindByID(c.Request.Context(), cardID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "card not found"})
		return
	}

	c.JSON(http.StatusOK, card)
}

// List lista todos os cartões do usuário
func (h *CardHandler) List(c *gin.Context) {
	userID := c.GetString("user_id")

	cards, err := h.repo.FindAll(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list cards"})
		return
	}

	c.JSON(http.StatusOK, cards)
}

// Get busca cartão por ID (alias para GetByID para compatibilidade com rotas)
func (h *CardHandler) Get(c *gin.Context) {
	h.GetByID(c)
}

// Update atualiza um cartão
func (h *CardHandler) Update(c *gin.Context) {
	userID := c.GetString("user_id")
	cardID := c.Param("id")

	var input entity.UpdateCardInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	card, err := h.repo.Update(c.Request.Context(), cardID, userID, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update card"})
		return
	}

	c.JSON(http.StatusOK, card)
}

// Delete deleta um cartão
func (h *CardHandler) Delete(c *gin.Context) {
	userID := c.GetString("user_id")
	cardID := c.Param("id")

	if err := h.repo.Delete(c.Request.Context(), cardID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete card"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "card deleted"})
}
