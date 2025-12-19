package repository

import (
	"context"
	"financeiro-api/internal/entity"
	"fmt"

	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

type CategoryRepository struct {
	db *pgxpool.Pool
}

func NewCategoryRepository(db *pgxpool.Pool) *CategoryRepository {
	return &CategoryRepository{db: db}
}

// CategoryWithSubs extends entity.Category to include Subcategories
type CategoryWithSubs struct {
	entity.Category
	Subcategories []entity.Subcategory `json:"subcategories"`
}

func (r *CategoryRepository) FindAll(ctx context.Context, userID, catType string) ([]CategoryWithSubs, error) {
	// 1. Fetch Categories
	queryCat := `
		SELECT id, user_id, name, type, icon, color, is_active, created_at, updated_at
		FROM categories
		WHERE user_id = $1 AND type = $2 AND is_active = true
		ORDER BY name ASC
	`
	// Note: We might want to fetch inactive ones too if needed for management?
	// Frontend `get_categories` logic usually fetches active.
	// But `categories/actions.ts` didn't filter by `is_active` in `getCategories`!
	// Wait, line 9 in `actions.ts` was `supabase.from('categories').select(...)`. PostgREST returns all.
	// So I should remove `AND is_active = true` to match legacy behavior, allowing user to see/edit inactive ones.
	queryCat = `
		SELECT id, user_id, name, type, icon, color, is_active, created_at, updated_at
		FROM categories
		WHERE user_id = $1::uuid AND type = $2
		ORDER BY name ASC
	`
	rows, err := r.db.Query(ctx, queryCat, userID, catType)
	if err != nil {
		return nil, fmt.Errorf("failed to query categories: %w", err)
	}
	defer rows.Close()

	var categories []CategoryWithSubs
	catMap := make(map[string]*CategoryWithSubs)

	for rows.Next() {
		var cat CategoryWithSubs
		cat.Subcategories = []entity.Subcategory{}
		err := rows.Scan(
			&cat.ID, &cat.UserID, &cat.Name, &cat.Type,
			&cat.Icon, &cat.Color, &cat.IsActive, &cat.CreatedAt, &cat.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan category: %w", err)
		}
		categories = append(categories, cat)
	}

	for i := range categories {
		catMap[categories[i].ID] = &categories[i]
	}

	// 2. Fetch Subcategories
	querySub := `
		SELECT s.id, s.user_id, s.category_id, s.name, s.is_active, s.created_at, s.updated_at
		FROM subcategories s
		JOIN categories c ON s.category_id = c.id
		WHERE c.user_id = $1::uuid AND c.type = $2
		ORDER BY s.name ASC
	`
	rowsSub, err := r.db.Query(ctx, querySub, userID, catType)
	if err != nil {
		return nil, fmt.Errorf("failed to query subcategories: %w", err)
	}
	defer rowsSub.Close()

	for rowsSub.Next() {
		var sub entity.Subcategory
		err := rowsSub.Scan(
			&sub.ID, &sub.UserID, &sub.CategoryID, &sub.Name, &sub.IsActive,
			&sub.CreatedAt, &sub.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan subcategory: %w", err)
		}

		if parent, exists := catMap[sub.CategoryID]; exists {
			parent.Subcategories = append(parent.Subcategories, sub)
		}
	}

	return categories, nil
}

func (r *CategoryRepository) Create(ctx context.Context, userID string, input entity.CreateCategoryInput) (*entity.Category, error) {
	query := `
		INSERT INTO categories (user_id, name, type, icon, color, is_active)
		VALUES ($1::uuid, $2, $3, $4, $5, true)
		RETURNING id, user_id, name, type, icon, color, is_active, created_at, updated_at
	`
	var cat entity.Category
	err := r.db.QueryRow(ctx, query, userID, strings.ToUpper(input.Name), input.Type, input.Icon, input.Color).Scan(
		&cat.ID, &cat.UserID, &cat.Name, &cat.Type,
		&cat.Icon, &cat.Color, &cat.IsActive, &cat.CreatedAt, &cat.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create category: %w", err)
	}
	return &cat, nil
}

func (r *CategoryRepository) Update(ctx context.Context, id, userID string, input entity.UpdateCategoryInput) (*entity.Category, error) {
	query := `UPDATE categories SET updated_at = NOW()`
	args := []interface{}{id, userID}
	argCount := 2

	if input.Name != nil {
		argCount++
		query += fmt.Sprintf(", name = $%d", argCount)
		args = append(args, strings.ToUpper(*input.Name))
	}
	if input.Icon != nil {
		argCount++
		query += fmt.Sprintf(", icon = $%d", argCount)
		args = append(args, *input.Icon)
	}
	if input.Color != nil {
		argCount++
		query += fmt.Sprintf(", color = $%d", argCount)
		args = append(args, *input.Color)
	}
	if input.IsActive != nil {
		argCount++
		query += fmt.Sprintf(", is_active = $%d", argCount)
		args = append(args, *input.IsActive)
	}

	query += ` WHERE id = $1 AND user_id = $2::uuid RETURNING id, user_id, name, type, icon, color, is_active, created_at, updated_at`

	var cat entity.Category
	err := r.db.QueryRow(ctx, query, args...).Scan(
		&cat.ID, &cat.UserID, &cat.Name, &cat.Type,
		&cat.Icon, &cat.Color, &cat.IsActive, &cat.CreatedAt, &cat.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update category: %w", err)
	}
	return &cat, nil
}

func (r *CategoryRepository) Delete(ctx context.Context, id, userID string) error {
	query := `DELETE FROM categories WHERE id = $1 AND user_id = $2::uuid`
	_, err := r.db.Exec(ctx, query, id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete category: %w", err)
	}
	return nil
}

// Subcategory methods

func (r *CategoryRepository) CreateSubcategory(ctx context.Context, userID, categoryID, name string) (*entity.Subcategory, error) {
	// Validate category ownership
	var exists bool
	err := r.db.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM categories WHERE id=$1 AND user_id=$2::uuid)", categoryID, userID).Scan(&exists)
	if err != nil || !exists {
		return nil, fmt.Errorf("category not found or unauthorized")
	}

	query := `
		INSERT INTO subcategories (user_id, category_id, name, is_active)
		VALUES ($1::uuid, $2, $3, true)
		RETURNING id, user_id, category_id, name, is_active, created_at, updated_at
	`
	var sub entity.Subcategory
	err = r.db.QueryRow(ctx, query, userID, categoryID, strings.ToUpper(name)).Scan(
		&sub.ID, &sub.UserID, &sub.CategoryID, &sub.Name, &sub.IsActive, &sub.CreatedAt, &sub.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create subcategory: %w", err)
	}
	return &sub, nil
}

func (r *CategoryRepository) UpdateSubcategory(ctx context.Context, id, userID string, input entity.UpdateSubcategoryInput) (*entity.Subcategory, error) {
	query := `UPDATE subcategories SET updated_at = NOW()`
	args := []interface{}{id, userID}
	argCount := 2

	if input.Name != nil {
		argCount++
		query += fmt.Sprintf(", name = $%d", argCount)
		args = append(args, strings.ToUpper(*input.Name))
	}
	if input.IsActive != nil {
		argCount++
		query += fmt.Sprintf(", is_active = $%d", argCount)
		args = append(args, *input.IsActive)
	}

	query += ` WHERE id = $1 AND user_id = $2::uuid RETURNING id, user_id, category_id, name, is_active, created_at, updated_at`

	var sub entity.Subcategory
	err := r.db.QueryRow(ctx, query, args...).Scan(
		&sub.ID, &sub.UserID, &sub.CategoryID, &sub.Name, &sub.IsActive, &sub.CreatedAt, &sub.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update subcategory: %w", err)
	}
	return &sub, nil
}

func (r *CategoryRepository) DeleteSubcategory(ctx context.Context, id, userID string) error {
	query := `DELETE FROM subcategories WHERE id = $1 AND user_id = $2::uuid`
	_, err := r.db.Exec(ctx, query, id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete subcategory: %w", err)
	}
	return nil
}
