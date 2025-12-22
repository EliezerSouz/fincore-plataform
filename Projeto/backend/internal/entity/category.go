package entity

import "time"

type Category struct {
	ID        string    `json:"id" db:"id"`
	UserID    string    `json:"user_id" db:"user_id"`
	Name      string    `json:"name" db:"name"`
	Type      string    `json:"type" db:"type"` // 'receita' ou 'despesa'
	Icon      string    `json:"icon" db:"icon"`
	Color     string    `json:"color" db:"color"`
	IsActive  bool      `json:"is_active" db:"is_active"`
	IsSystem  bool      `json:"is_system" db:"is_system"`
	IsPremium bool      `json:"is_premium" db:"is_premium"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type Subcategory struct {
	ID         string    `json:"id" db:"id"`
	UserID     string    `json:"user_id" db:"user_id"`
	CategoryID string    `json:"category_id" db:"category_id"`
	Name       string    `json:"name" db:"name"`
	IsActive   bool      `json:"is_active" db:"is_active"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
}

type CreateCategoryInput struct {
	Name  string `json:"name" binding:"required"`
	Type  string `json:"type" binding:"required,oneof=receita despesa"`
	Icon  string `json:"icon" binding:"required"`
	Color string `json:"color" binding:"required"`
}

type UpdateCategoryInput struct {
	Name     *string `json:"name"`
	Icon     *string `json:"icon"`
	Color    *string `json:"color"`
	IsActive *bool   `json:"is_active"`
}

type UpdateSubcategoryInput struct {
	Name     *string `json:"name"`
	IsActive *bool   `json:"is_active"`
}
