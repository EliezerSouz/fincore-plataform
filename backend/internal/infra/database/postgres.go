package database

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPostgresConnection() (*pgxpool.Pool, error) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return nil, fmt.Errorf("DATABASE_URL not set")
	}

	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		return nil, fmt.Errorf("unable to parse database config: %v", err)
	}

	// Add connection timeout
	config.ConnConfig.ConnectTimeout = 30 * time.Second

	// Set pool configuration
	config.MaxConns = 10
	config.MinConns = 2

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("unable to connect to database: %v", err)
	}

	return pool, nil
}
