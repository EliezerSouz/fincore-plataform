package repository

import (
	"context"
	"financeiro-api/internal/entity"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ParentAccountRepository struct {
	db *pgxpool.Pool
}

func NewParentAccountRepository(db *pgxpool.Pool) *ParentAccountRepository {
	return &ParentAccountRepository{db: db}
}

// Create cria uma nova Conta Mãe (Instituição) e um Pocket padrão "Conta Corrente"
func (r *ParentAccountRepository) Create(ctx context.Context, userID string, input entity.CreateParentAccountInput) (*entity.ParentAccount, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// 1. Create Parent Account
	query := `
		INSERT INTO parent_accounts (user_id, institution_name, institution_type, color, logo_url)
		VALUES ($1::uuid, $2, $3, $4, $5)
		RETURNING id, user_id, institution_name, institution_type, color, logo_url, is_active, created_at, updated_at
	`

	var pa entity.ParentAccount
	err = tx.QueryRow(ctx, query,
		userID,
		strings.ToUpper(input.InstitutionName),
		input.InstitutionType,
		input.Color,
		input.LogoURL,
	).Scan(
		&pa.ID, &pa.UserID, &pa.InstitutionName, &pa.InstitutionType,
		&pa.Color, &pa.LogoURL, &pa.IsActive, &pa.CreatedAt, &pa.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create parent account: %w", err)
	}

	// 2. Create Default Pocket (Conta Corrente)
	pocketQuery := `
		INSERT INTO pockets (
			user_id, parent_account_id, name, pocket_type, balance, is_active, display_order, created_at, updated_at, yield_enabled
		) VALUES (
			$1::uuid, $2::uuid, 'Conta Corrente', 'CAIXA', $3, true, 0, NOW(), NOW(), false
		) RETURNING id
	`

	var pocketID string
	err = tx.QueryRow(ctx, pocketQuery,
		userID,
		pa.ID,
		input.InitialBalance, // Set initial balance
	).Scan(&pocketID)

	if err != nil {
		return nil, fmt.Errorf("failed to create default pocket: %w", err)
	}

	// 3. Register Initial Balance Adjustment for history
	if input.InitialBalance != 0 {
		adjQuery := `
			INSERT INTO account_balance_adjustments (
				user_id, pocket_id, adjustment_date, balance, type, notes
			) VALUES (
				$1::uuid, $2::uuid, NOW(), $3, 'adjustment', 'Saldo Inicial - Criação da Conta'
			)
		`
		_, err = tx.Exec(ctx, adjQuery, userID, pocketID, input.InitialBalance)
		if err != nil {
			return nil, fmt.Errorf("failed to create initial balance adjustment: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return &pa, nil
}

// FindByID busca uma Conta Mãe por ID
func (r *ParentAccountRepository) FindByID(ctx context.Context, id, userID string) (*entity.ParentAccount, error) {
	query := `
		SELECT 
			pa.id, pa.user_id, pa.institution_name, pa.institution_type, 
			pa.color, pa.logo_url, pa.is_active, pa.created_at, pa.updated_at,
			COALESCE(v.total_balance, 0) as total_balance,
			COALESCE(v.caixa_balance, 0) as caixa_balance,
			COALESCE(v.reserva_balance, 0) as reserva_balance,
			COALESCE(v.investimento_balance, 0) as investimento_balance
		FROM parent_accounts pa
		LEFT JOIN v_parent_account_balances v ON pa.id = v.parent_account_id
		WHERE pa.id = $1 AND pa.user_id = $2::uuid
	`

	var pa entity.ParentAccount
	err := r.db.QueryRow(ctx, query, id, userID).Scan(
		&pa.ID, &pa.UserID, &pa.InstitutionName, &pa.InstitutionType,
		&pa.Color, &pa.LogoURL, &pa.IsActive, &pa.CreatedAt, &pa.UpdatedAt,
		&pa.TotalBalance, &pa.CaixaBalance, &pa.ReservaBalance, &pa.InvestimentoBalance,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to find parent account: %w", err)
	}

	return &pa, nil
}

// FindAll busca todas as Contas Mãe do usuário
func (r *ParentAccountRepository) FindAll(ctx context.Context, userID string, includeInactive bool) ([]entity.ParentAccount, error) {
	query := `
		SELECT 
			pa.id, pa.user_id, pa.institution_name, pa.institution_type, 
			pa.color, pa.logo_url, pa.is_active, pa.created_at, pa.updated_at,
			COALESCE(v.total_balance, 0) as total_balance,
			COALESCE(v.caixa_balance, 0) as caixa_balance,
			COALESCE(v.reserva_balance, 0) as reserva_balance,
			COALESCE(v.investimento_balance, 0) as investimento_balance
		FROM parent_accounts pa
		LEFT JOIN v_parent_account_balances v ON pa.id = v.parent_account_id
		WHERE pa.user_id = $1::uuid
	`

	if !includeInactive {
		query += " AND pa.is_active = true"
	}

	query += " ORDER BY pa.institution_name ASC"

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query parent accounts: %w", err)
	}
	defer rows.Close()

	var accounts []entity.ParentAccount
	for rows.Next() {
		var pa entity.ParentAccount
		err := rows.Scan(
			&pa.ID, &pa.UserID, &pa.InstitutionName, &pa.InstitutionType,
			&pa.Color, &pa.LogoURL, &pa.IsActive, &pa.CreatedAt, &pa.UpdatedAt,
			&pa.TotalBalance, &pa.CaixaBalance, &pa.ReservaBalance, &pa.InvestimentoBalance,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan parent account: %w", err)
		}
		accounts = append(accounts, pa)
	}

	return accounts, nil
}

// Update atualiza uma Conta Mãe
func (r *ParentAccountRepository) Update(ctx context.Context, id, userID string, input entity.UpdateParentAccountInput) (*entity.ParentAccount, error) {
	query := `UPDATE parent_accounts SET updated_at = NOW()`
	args := []interface{}{id, userID}
	argCount := 2

	if input.InstitutionName != nil {
		argCount++
		query += fmt.Sprintf(", institution_name = $%d", argCount)
		args = append(args, strings.ToUpper(*input.InstitutionName))
	}
	if input.InstitutionType != nil {
		argCount++
		query += fmt.Sprintf(", institution_type = $%d", argCount)
		args = append(args, *input.InstitutionType)
	}
	if input.Color != nil {
		argCount++
		query += fmt.Sprintf(", color = $%d", argCount)
		args = append(args, *input.Color)
	}
	if input.LogoURL != nil {
		argCount++
		query += fmt.Sprintf(", logo_url = $%d", argCount)
		args = append(args, *input.LogoURL)
	}
	if input.IsActive != nil {
		argCount++
		query += fmt.Sprintf(", is_active = $%d", argCount)
		args = append(args, *input.IsActive)
	}

	query += ` WHERE id = $1 AND user_id = $2::uuid 
		RETURNING id, user_id, institution_name, institution_type, color, logo_url, is_active, created_at, updated_at`

	var pa entity.ParentAccount
	err := r.db.QueryRow(ctx, query, args...).Scan(
		&pa.ID, &pa.UserID, &pa.InstitutionName, &pa.InstitutionType,
		&pa.Color, &pa.LogoURL, &pa.IsActive, &pa.CreatedAt, &pa.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to update parent account: %w", err)
	}

	return &pa, nil
}

// Delete deleta uma Conta Mãe (soft delete - marca como inativa)
func (r *ParentAccountRepository) Delete(ctx context.Context, id, userID string) error {
	query := `
		UPDATE parent_accounts 
		SET is_active = false, updated_at = NOW()
		WHERE id = $1 AND user_id = $2::uuid
	`

	result, err := r.db.Exec(ctx, query, id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete parent account: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("parent account not found")
	}

	return nil
}

// FindByInstitutionName busca uma Conta Mãe pelo nome da instituição
func (r *ParentAccountRepository) FindByInstitutionName(ctx context.Context, userID, institutionName string) (*entity.ParentAccount, error) {
	query := `
		SELECT 
			id, user_id, institution_name, institution_type, 
			color, logo_url, is_active, created_at, updated_at
		FROM parent_accounts
		WHERE user_id = $1::uuid AND UPPER(institution_name) = UPPER($2)
	`

	var pa entity.ParentAccount
	err := r.db.QueryRow(ctx, query, userID, institutionName).Scan(
		&pa.ID, &pa.UserID, &pa.InstitutionName, &pa.InstitutionType,
		&pa.Color, &pa.LogoURL, &pa.IsActive, &pa.CreatedAt, &pa.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to find parent account by institution name: %w", err)
	}

	return &pa, nil
}

// GetWithPockets busca uma Conta Mãe com todos os seus Pockets
func (r *ParentAccountRepository) GetWithPockets(ctx context.Context, id, userID string) (*entity.ParentAccount, error) {
	// Buscar parent account
	pa, err := r.FindByID(ctx, id, userID)
	if err != nil {
		return nil, err
	}

	// Buscar pockets
	pocketRepo := NewPocketRepository(r.db)
	pockets, err := pocketRepo.FindByParentAccount(ctx, id, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to load pockets: %w", err)
	}

	pa.Pockets = pockets
	return pa, nil
}
