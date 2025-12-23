package middleware

import (
	"github.com/gin-gonic/gin"
)

// AuthBypass - TEMPORÁRIO: Bypass de autenticação para testes
// TODO: REMOVER ANTES DE PRODUÇÃO!
// Este middleware permite testar o sistema sem autenticação real
func AuthBypass() gin.HandlerFunc {
	return func(c *gin.Context) {
		// UUID do usuário real para testes
		testUserID := "37397337-8fb8-465f-812a-2cefbc96ae42"

		// Definir o user_id no contexto (mesmo formato que o middleware real)
		c.Set("user_id", testUserID)

		c.Next()
	}
}
