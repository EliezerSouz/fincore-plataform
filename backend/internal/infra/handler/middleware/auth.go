package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type SupabaseClaims struct {
	Sub   string `json:"sub"`
	Email string `json:"email"`
	Role  string `json:"role"`
	jwt.RegisteredClaims
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Allow OPTIONS to pass through without auth (handled by CORS middleware)
		if c.Request.Method == "OPTIONS" {
			c.Next()
			return
		}

		// Get Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			c.Abort()
			return
		}

		// Extract token
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization format"})
			c.Abort()
			return
		}

		// Parse and validate token
		token, err := jwt.ParseWithClaims(tokenString, &SupabaseClaims{}, func(token *jwt.Token) (interface{}, error) {
			// Supabase JWT secret
			secret := os.Getenv("SUPABASE_JWT_SECRET")
			if secret == "" {
				secret = os.Getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") // Fallback
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		// Extract claims
		claims, ok := token.Claims.(*SupabaseClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			c.Abort()
			return
		}

		// Set user ID in context
		c.Set("user_id", claims.Sub)
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)

		c.Next()
	}
}

// CORS Middleware
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
