package handler

import (
	"financeiro-api/internal/entity"
	"financeiro-api/internal/infra/repository"
	"net/http"

	"github.com/gin-gonic/gin"
)

type PocketHandler struct {
	repo *repository.PocketRepository
}

func NewPocketHandler(repo *repository.PocketRepository) *PocketHandler {
	return &PocketHandler{repo: repo}
}

// Create cria um novo Pocket (Subconta)
// POST /api/pockets
func (h *PocketHandler) Create(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	var input entity.CreatePocketInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validar input
	if err := input.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pocket, err := h.repo.Create(c.Request.Context(), userID.(string), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create pocket: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, pocket)
}

// GetByID busca um Pocket por ID
// GET /api/pockets/:id
func (h *PocketHandler) GetByID(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	id := c.Param("id")
	pocket, err := h.repo.FindByID(c.Request.Context(), id, userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "pocket not found"})
		return
	}

	c.JSON(http.StatusOK, pocket)
}

// GetByParentAccount busca todos os Pockets de uma Conta Mãe
// GET /api/parent-accounts/:parent_id/pockets
func (h *PocketHandler) GetByParentAccount(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	parentID := c.Param("id")
	pockets, err := h.repo.FindByParentAccount(c.Request.Context(), parentID, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch pockets: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, pockets)
}

// GetAll busca todos os Pockets do usuário
// GET /api/pockets
func (h *PocketHandler) GetAll(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	includeInactive := c.Query("include_inactive") == "true"

	pockets, err := h.repo.FindAllByUser(c.Request.Context(), userID.(string), includeInactive)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch pockets: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, pockets)
}

// Update atualiza um Pocket
// PUT /api/pockets/:id
func (h *PocketHandler) Update(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	id := c.Param("id")

	var input entity.UpdatePocketInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pocket, err := h.repo.Update(c.Request.Context(), id, userID.(string), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update pocket: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, pocket)
}

// Delete deleta um Pocket (soft delete)
// DELETE /api/pockets/:id
func (h *PocketHandler) Delete(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	id := c.Param("id")

	if err := h.repo.Delete(c.Request.Context(), id, userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete pocket: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "pocket deleted successfully"})
}

// RecalculateBalance recalcula o saldo de um Pocket
// POST /api/pockets/:id/recalculate-balance
func (h *PocketHandler) RecalculateBalance(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	id := c.Param("id")

	// Verificar se o pocket pertence ao usuário
	_, err := h.repo.FindByID(c.Request.Context(), id, userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "pocket not found"})
		return
	}

	// Recalcular saldo
	newBalance, err := h.repo.RecalculateBalance(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to recalculate balance: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "balance recalculated successfully",
		"balance": newBalance,
	})
}
