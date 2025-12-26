package repository

import (
	"context"
	"financeiro-api/internal/entity"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PocketRepository struct {
	db *pgxpool.Pool
}

func NewPocketRepository(db *pgxpool.Pool) *PocketRepository {
	return &PocketRepository{db: db}
}

// Create cria um novo Pocket (Subconta)
func (r *PocketRepository) Create(ctx context.Context, userID string, input entity.CreatePocketInput) (*entity.Pocket, error) {
	// Validar input
	if err := input.Validate(); err != nil {
		return nil, err
	}

	query := `
		INSERT INTO pockets (
			parent_account_id, user_id, name, pocket_type, description,
			yield_enabled, yield_source, yield_cdi_rate,
			investment_type, color, icon
		)
		VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, parent_account_id, user_id, name, pocket_type, description, balance,
			yield_enabled, yield_source, yield_cdi_rate, last_yield_date,
			investment_type, color, icon, display_order, is_active, created_at, updated_at
	`

	var p entity.Pocket
	err := r.db.QueryRow(ctx, query,
		input.ParentAccountID,
		userID,
		strings.ToUpper(input.Name),
		input.PocketType,
		input.Description,
		input.YieldEnabled,
		input.YieldSource,
		input.YieldCdiRate,
		input.InvestmentType,
		input.Color,
		input.Icon,
	).Scan(
		&p.ID, &p.ParentAccountID, &p.UserID, &p.Name, &p.PocketType, &p.Description, &p.Balance,
		&p.YieldEnabled, &p.YieldSource, &p.YieldCdiRate, &p.LastYieldDate,
		&p.InvestmentType, &p.Color, &p.Icon, &p.DisplayOrder, &p.IsActive, &p.CreatedAt, &p.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create pocket: %w", err)
	}

	return &p, nil
}

// FindByID busca um Pocket por ID
func (r *PocketRepository) FindByID(ctx context.Context, id, userID string) (*entity.Pocket, error) {
	query := `
		SELECT 
			id, parent_account_id, user_id, name, pocket_type, description, balance,
			yield_enabled, yield_source, yield_cdi_rate, last_yield_date,
			investment_type, color, icon, display_order, is_active, created_at, updated_at,
			COALESCE((SELECT yield_amount FROM liquidity_yields WHERE pocket_id = pockets.id ORDER BY date DESC LIMIT 1), 0) as yield_today,
			COALESCE((SELECT SUM(yield_amount) FROM liquidity_yields WHERE pocket_id = pockets.id AND date >= date_trunc('month', CURRENT_DATE)), 0) as yield_month
		FROM pockets
		WHERE id = $1 AND user_id = $2::uuid
	`

	var p entity.Pocket
	err := r.db.QueryRow(ctx, query, id, userID).Scan(
		&p.ID, &p.ParentAccountID, &p.UserID, &p.Name, &p.PocketType, &p.Description, &p.Balance,
		&p.YieldEnabled, &p.YieldSource, &p.YieldCdiRate, &p.LastYieldDate,
		&p.InvestmentType, &p.Color, &p.Icon, &p.DisplayOrder, &p.IsActive, &p.CreatedAt, &p.UpdatedAt,
		&p.YieldToday, &p.YieldMonth,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to find pocket: %w", err)
	}

	return &p, nil
}

// FindByParentAccount busca todos os Pockets de uma Conta Mãe
func (r *PocketRepository) FindByParentAccount(ctx context.Context, parentAccountID, userID string) ([]entity.Pocket, error) {
	query := `
		SELECT 
			id, parent_account_id, user_id, name, pocket_type, description, balance,
			yield_enabled, yield_source, yield_cdi_rate, last_yield_date,
			investment_type, color, icon, display_order, is_active, created_at, updated_at,
			COALESCE((SELECT yield_amount FROM liquidity_yields WHERE pocket_id = pockets.id ORDER BY date DESC LIMIT 1), 0) as yield_today,
			COALESCE((SELECT SUM(yield_amount) FROM liquidity_yields WHERE pocket_id = pockets.id AND date >= date_trunc('month', CURRENT_DATE)), 0) as yield_month
		FROM pockets
		WHERE parent_account_id = $1 AND user_id = $2::uuid AND is_active = true
		ORDER BY display_order ASC, name ASC
	`

	rows, err := r.db.Query(ctx, query, parentAccountID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query pockets: %w", err)
	}
	defer rows.Close()

	var pockets []entity.Pocket
	for rows.Next() {
		var p entity.Pocket
		err := rows.Scan(
			&p.ID, &p.ParentAccountID, &p.UserID, &p.Name, &p.PocketType, &p.Description, &p.Balance,
			&p.YieldEnabled, &p.YieldSource, &p.YieldCdiRate, &p.LastYieldDate,
			&p.InvestmentType, &p.Color, &p.Icon, &p.DisplayOrder, &p.IsActive, &p.CreatedAt, &p.UpdatedAt,
			&p.YieldToday, &p.YieldMonth,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan pocket: %w", err)
		}
		pockets = append(pockets, p)
	}

	return pockets, nil
}

// FindAllByUser busca todos os Pockets do usuário
func (r *PocketRepository) FindAllByUser(ctx context.Context, userID string, includeInactive bool) ([]entity.Pocket, error) {
	query := `
		SELECT 
			id, parent_account_id, user_id, name, pocket_type, description, balance,
			yield_enabled, yield_source, yield_cdi_rate, last_yield_date,
			investment_type, color, icon, display_order, is_active, created_at, updated_at
		FROM pockets
		WHERE user_id = $1::uuid
	`

	if !includeInactive {
		query += " AND is_active = true"
	}

	query += " ORDER BY parent_account_id, display_order ASC, name ASC"

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query pockets: %w", err)
	}
	defer rows.Close()

	var pockets []entity.Pocket
	for rows.Next() {
		var p entity.Pocket
		err := rows.Scan(
			&p.ID, &p.ParentAccountID, &p.UserID, &p.Name, &p.PocketType, &p.Description, &p.Balance,
			&p.YieldEnabled, &p.YieldSource, &p.YieldCdiRate, &p.LastYieldDate,
			&p.InvestmentType, &p.Color, &p.Icon, &p.DisplayOrder, &p.IsActive, &p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan pocket: %w", err)
		}
		pockets = append(pockets, p)
	}

	return pockets, nil
}

// Update atualiza um Pocket
func (r *PocketRepository) Update(ctx context.Context, id, userID string, input entity.UpdatePocketInput) (*entity.Pocket, error) {
	query := `UPDATE pockets SET updated_at = NOW()`
	args := []interface{}{id, userID}
	argCount := 2

	if input.Name != nil {
		argCount++
		query += fmt.Sprintf(", name = $%d", argCount)
		args = append(args, strings.ToUpper(*input.Name))
	}
	if input.Description != nil {
		argCount++
		query += fmt.Sprintf(", description = $%d", argCount)
		args = append(args, *input.Description)
	}
	if input.YieldEnabled != nil {
		argCount++
		query += fmt.Sprintf(", yield_enabled = $%d", argCount)
		args = append(args, *input.YieldEnabled)
	}
	if input.YieldSource != nil {
		argCount++
		query += fmt.Sprintf(", yield_source = $%d", argCount)
		args = append(args, *input.YieldSource)
	}
	if input.YieldCdiRate != nil {
		argCount++
		query += fmt.Sprintf(", yield_cdi_rate = $%d", argCount)
		args = append(args, *input.YieldCdiRate)
	}
	if input.Color != nil {
		argCount++
		query += fmt.Sprintf(", color = $%d", argCount)
		args = append(args, *input.Color)
	}
	if input.Icon != nil {
		argCount++
		query += fmt.Sprintf(", icon = $%d", argCount)
		args = append(args, *input.Icon)
	}
	if input.DisplayOrder != nil {
		argCount++
		query += fmt.Sprintf(", display_order = $%d", argCount)
		args = append(args, *input.DisplayOrder)
	}
	if input.IsActive != nil {
		argCount++
		query += fmt.Sprintf(", is_active = $%d", argCount)
		args = append(args, *input.IsActive)
	}

	query += ` WHERE id = $1 AND user_id = $2::uuid 
		RETURNING id, parent_account_id, user_id, name, pocket_type, description, balance,
			yield_enabled, yield_source, yield_cdi_rate, last_yield_date,
			investment_type, color, icon, display_order, is_active, created_at, updated_at`

	var p entity.Pocket
	err := r.db.QueryRow(ctx, query, args...).Scan(
		&p.ID, &p.ParentAccountID, &p.UserID, &p.Name, &p.PocketType, &p.Description, &p.Balance,
		&p.YieldEnabled, &p.YieldSource, &p.YieldCdiRate, &p.LastYieldDate,
		&p.InvestmentType, &p.Color, &p.Icon, &p.DisplayOrder, &p.IsActive, &p.CreatedAt, &p.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to update pocket: %w", err)
	}

	return &p, nil
}

// Delete deleta um Pocket (soft delete - marca como inativo)
func (r *PocketRepository) Delete(ctx context.Context, id, userID string) error {
	query := `
		UPDATE pockets 
		SET is_active = false, updated_at = NOW()
		WHERE id = $1 AND user_id = $2::uuid
	`

	result, err := r.db.Exec(ctx, query, id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete pocket: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("pocket not found")
	}

	return nil
}

// FindAllWithYieldEnabled busca todos os Pockets com rendimento CDI habilitado
// Usado pelo scheduler para calcular rendimentos
func (r *PocketRepository) FindAllWithYieldEnabled(ctx context.Context) ([]entity.Pocket, error) {
	query := `
		SELECT 
			id, parent_account_id, user_id, name, pocket_type, description, balance,
			yield_enabled, yield_source, yield_cdi_rate, last_yield_date,
			investment_type, color, icon, display_order, is_active, created_at, updated_at
		FROM pockets
		WHERE pocket_type = 'RESERVA_CDI' 
		AND yield_enabled = true 
		AND is_active = true
		ORDER BY created_at ASC
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query pockets with yield: %w", err)
	}
	defer rows.Close()

	var pockets []entity.Pocket
	for rows.Next() {
		var p entity.Pocket
		err := rows.Scan(
			&p.ID, &p.ParentAccountID, &p.UserID, &p.Name, &p.PocketType, &p.Description, &p.Balance,
			&p.YieldEnabled, &p.YieldSource, &p.YieldCdiRate, &p.LastYieldDate,
			&p.InvestmentType, &p.Color, &p.Icon, &p.DisplayOrder, &p.IsActive, &p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan pocket: %w", err)
		}
		pockets = append(pockets, p)
	}

	return pockets, nil
}

// UpdateBalance atualiza o saldo de um Pocket
// Usado após cálculo de saldo dinâmico
func (r *PocketRepository) UpdateBalance(ctx context.Context, pocketID string, balance float64) error {
	query := `
		UPDATE pockets 
		SET balance = $1, updated_at = NOW()
		WHERE id = $2
	`

	_, err := r.db.Exec(ctx, query, balance, pocketID)
	if err != nil {
		return fmt.Errorf("failed to update pocket balance: %w", err)
	}

	return nil
}

// RecalculateBalance recalcula o saldo de um Pocket baseado em transações e rendimentos
func (r *PocketRepository) RecalculateBalance(ctx context.Context, pocketID string) (float64, error) {
	query := `SELECT calculate_pocket_balance($1)`

	var balance float64
	err := r.db.QueryRow(ctx, query, pocketID).Scan(&balance)
	if err != nil {
		return 0, fmt.Errorf("failed to recalculate pocket balance: %w", err)
	}

	// Atualizar o saldo no banco
	if err := r.UpdateBalance(ctx, pocketID, balance); err != nil {
		return 0, err
	}

	return balance, nil
}
