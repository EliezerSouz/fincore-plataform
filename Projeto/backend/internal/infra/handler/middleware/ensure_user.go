package middleware

import (
	"context"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// EnsureUserExists middleware ensures that the authenticated user exists in the users table
// This is necessary because Supabase Auth creates users in auth.users, but we need them in public.users
func EnsureUserExists(db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip if not authenticated
		userID := c.GetString("user_id")
		if userID == "" {
			log.Println("⚠️ EnsureUserExists: No user_id in context, skipping")
			c.Next()
			return
		}
		log.Printf("🔍 EnsureUserExists: Checking user %s", userID)

		userEmail := c.GetString("user_email")

		// Check if user exists in public.users
		var exists bool
		err := db.QueryRow(context.Background(),
			"SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)",
			userID,
		).Scan(&exists)

		if err != nil {
			log.Printf("❌ Error checking user existence: %v", err)
			c.Next()
			return
		}
		log.Printf("📊 User exists in database: %v", exists)

		// If user doesn't exist, create it
		if !exists {
			log.Printf("🆕 Creating user in database: %s (%s)", userID, userEmail)

			// Use a default email if not provided
			email := userEmail
			if email == "" {
				email = "user@fincore.local"
			}

			_, err := db.Exec(context.Background(), `
				INSERT INTO users (id, email, name, base_plan, is_temp_access)
				VALUES ($1, $2, $3, 'free', false)
				ON CONFLICT (id) DO NOTHING
			`, userID, email, email)

			if err != nil {
				log.Printf("❌ Error creating user: %v", err)
				// Don't abort, let the request continue and fail naturally if needed
			} else {
				log.Printf("✅ User created successfully: %s", userID)
			}
		} else {
			log.Printf("✅ User already exists in database: %s", userID)
		}

		c.Next()
	}
}
