package middleware

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type SupabaseClaims struct {
	Sub   string `json:"sub"`
	Email string `json:"email"`
	Role  string `json:"role"`
	jwt.RegisteredClaims
}

var jwks keyfunc.Keyfunc
var supabaseURL string

// InitializeJWKS initializes the JWKS fetcher locally
func InitializeJWKS() error {
	supabaseURL = os.Getenv("SUPABASE_URL")
	if supabaseURL == "" {
		// Fallback for frontend env var format
		supabaseURL = os.Getenv("NEXT_PUBLIC_SUPABASE_URL")
	}

	if supabaseURL == "" {
		return fmt.Errorf("SUPABASE_URL not set")
	}

	jwksURL := fmt.Sprintf("%s/auth/v1/.well-known/jwks.json", supabaseURL)
	log.Printf("🔐 Initializing JWKS from: %s", jwksURL)

	var err error
	// Create the JWKS from the resource at the given URL.
	jwks, err = keyfunc.NewDefault([]string{jwksURL})
	if err != nil {
		return fmt.Errorf("failed to create JWKS from resource at the given URL: %w", err)
	}

	return nil
}

func AuthMiddleware() gin.HandlerFunc {
	// Try to initialize JWKS on startup (lazy load will happen if this fails or is skipped)
	if jwks == nil {
		if err := InitializeJWKS(); err != nil {
			log.Printf("⚠️ JWKS Initialization failed: %v. Will try legacy HMAC or retry later.", err)
		}
	}

	return func(c *gin.Context) {
		// Allow OPTIONS to pass through without auth
		if c.Request.Method == "OPTIONS" {
			c.Next()
			return
		}

		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// Parse token
		token, err := jwt.ParseWithClaims(tokenString, &SupabaseClaims{}, func(token *jwt.Token) (interface{}, error) {
			// LOG Algorithm for debug
			// log.Printf("🔐 Token Algorithm: %v", token.Header["alg"])

			// STRATEGY 1: ECDSA (ES256) via JWKS - New Supabase Default
			if _, ok := token.Method.(*jwt.SigningMethodECDSA); ok {
				if jwks == nil {
					// Try to init if missing
					if err := InitializeJWKS(); err != nil {
						return nil, fmt.Errorf("token uses ECDSA but JWKS validation failed to init: %w", err)
					}
				}

				return jwks.Keyfunc(token)
			}

			// STRATEGY 2: HMAC (HS256) via Secret - Legacy Supabase
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); ok {
				secret := os.Getenv("SUPABASE_JWT_SECRET")
				if secret == "" {
					secret = os.Getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
				}
				if secret == "" {
					return nil, fmt.Errorf("token uses HMAC but no SUPABASE_JWT_SECRET configured")
				}
				return []byte(secret), nil
			}

			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		})

		if err != nil || !token.Valid {
			log.Printf("❌ Token validation failed: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token: " + err.Error()})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(*SupabaseClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			c.Abort()
			return
		}

		// Log success (debounce logs in prod)
		// log.Printf("✅ Token validated: %s (%s)", claims.Sub, claims.Email)

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
