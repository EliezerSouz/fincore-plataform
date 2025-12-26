package handler

import (
	"financeiro-api/internal/entity"
	"financeiro-api/internal/infra/repository"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ParentAccountHandler struct {
	repo *repository.ParentAccountRepository
}

func NewParentAccountHandler(repo *repository.ParentAccountRepository) *ParentAccountHandler {
	return &ParentAccountHandler{repo: repo}
}

// Create cria uma nova Conta Mãe (Instituição)
// POST /api/parent-accounts
func (h *ParentAccountHandler) Create(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	var input entity.CreateParentAccountInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parentAccount, err := h.repo.Create(c.Request.Context(), userID.(string), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create parent account: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, parentAccount)
}

// GetByID busca uma Conta Mãe por ID
// GET /api/parent-accounts/:id
func (h *ParentAccountHandler) GetByID(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	id := c.Param("id")
	parentAccount, err := h.repo.FindByID(c.Request.Context(), id, userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "parent account not found"})
		return
	}

	c.JSON(http.StatusOK, parentAccount)
}

// GetAll busca todas as Contas Mãe do usuário
// GET /api/parent-accounts
func (h *ParentAccountHandler) GetAll(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	includeInactive := c.Query("include_inactive") == "true"

	parentAccounts, err := h.repo.FindAll(c.Request.Context(), userID.(string), includeInactive)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch parent accounts: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, parentAccounts)
}

// GetWithPockets busca uma Conta Mãe com todos os seus Pockets
// GET /api/parent-accounts/:id/with-pockets
func (h *ParentAccountHandler) GetWithPockets(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	id := c.Param("id")
	parentAccount, err := h.repo.GetWithPockets(c.Request.Context(), id, userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "parent account not found"})
		return
	}

	c.JSON(http.StatusOK, parentAccount)
}

// Update atualiza uma Conta Mãe
// PUT /api/parent-accounts/:id
func (h *ParentAccountHandler) Update(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	id := c.Param("id")

	var input entity.UpdateParentAccountInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parentAccount, err := h.repo.Update(c.Request.Context(), id, userID.(string), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update parent account: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, parentAccount)
}

// Delete deleta uma Conta Mãe (soft delete)
// DELETE /api/parent-accounts/:id
func (h *ParentAccountHandler) Delete(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	id := c.Param("id")

	if err := h.repo.Delete(c.Request.Context(), id, userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete parent account: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "parent account deleted successfully"})
}
