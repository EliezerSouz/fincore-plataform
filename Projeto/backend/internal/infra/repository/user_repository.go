package repository

import (
	"context"
	"fmt"
	"time"

	"financeiro-api/internal/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository struct {
	DB *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{DB: db}
}

func (r *UserRepository) Create(ctx context.Context, user *entity.User) error {
	query := `
		INSERT INTO public.users (
			id, full_name, email, 
			subscription_status, subscription_plan, base_plan,
			is_temp_access, temp_access_expires_at, temp_access_origin,
			subscription_started_at, billing_cycle
		)
		VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING created_at, updated_at
	`
	// Normalmente o ID vem do Auth (Supabase), então já deve estar setado.
	if user.ID == uuid.Nil {
		return fmt.Errorf("user ID cannot be nil")
	}

	// Default BasePlan if not set
	if user.BasePlan == "" {
		user.BasePlan = entity.SubscriptionPlanFree
	}

	err := r.DB.QueryRow(ctx, query,
		user.ID,
		user.FullName,
		user.Email,
		user.SubscriptionStatus,
		user.SubscriptionPlan,
		user.BasePlan,
		user.IsTempAccess,
		user.TempAccessExpiresAt,
		user.TempAccessOrigin,
		user.SubscriptionStartDate,
		user.BillingCycle,
	).Scan(&user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}
	return nil
}

func (r *UserRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.User, error) {
	query := `
		SELECT 
			id, full_name, email, 
			subscription_status, subscription_plan, base_plan,
			is_temp_access, temp_access_expires_at, temp_access_origin, used_promo_code,
			subscription_started_at, subscription_ends_at, 
			billing_cycle, created_at, updated_at 
		FROM public.users WHERE id = $1::uuid`

	var user entity.User
	err := r.DB.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.FullName,
		&user.Email,
		&user.SubscriptionStatus,
		&user.SubscriptionPlan,
		&user.BasePlan,
		&user.IsTempAccess,
		&user.TempAccessExpiresAt,
		&user.TempAccessOrigin,
		&user.UsedPromoCode,
		&user.SubscriptionStartDate,
		&user.SubscriptionEndDate,
		&user.BillingCycle,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}
	return &user, nil
}

func (r *UserRepository) UpdateSubscription(ctx context.Context, id uuid.UUID, status entity.SubscriptionStatus, plan entity.SubscriptionPlan) error {
	query := `UPDATE public.users SET subscription_status = $1, subscription_plan = $2, updated_at = $3 WHERE id = $4::uuid`
	_, err := r.DB.Exec(ctx, query, status, plan, time.Now(), id)
	return err
}

func (r *UserRepository) UpdatePrimaryCard(ctx context.Context, id uuid.UUID, cardID string, locked bool) error {
	query := `UPDATE public.users SET primary_credit_card_id = $1, primary_card_locked = $2, updated_at = $3 WHERE id = $4::uuid`
	_, err := r.DB.Exec(ctx, query, cardID, locked, time.Now(), id)
	return err
}

func (r *UserRepository) UpdatePlanDetails(ctx context.Context, user *entity.User) error {
	query := `
		UPDATE public.users SET 
			subscription_plan = $1,
			subscription_status = $2,
			is_temp_access = $3,
			temp_access_expires_at = $4,
			temp_access_origin = $5,
			used_promo_code = $6,
			redeemed_promo_codes = $7,
			updated_at = $8
		WHERE id = $9::uuid
	`
	_, err := r.DB.Exec(ctx, query,
		user.SubscriptionPlan,
		user.SubscriptionStatus,
		user.IsTempAccess,
		user.TempAccessExpiresAt,
		user.TempAccessOrigin,
		user.UsedPromoCode,
		user.RedeemedPromoCodes,
		time.Now(),
		user.ID,
	)
	return err
}

// RedeemPromoCode ativa um código promocional para o usuário
func (r *UserRepository) RedeemPromoCode(ctx context.Context, userID uuid.UUID, codeInput string) error {
	tx, err := r.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// 1. Buscar o código
	var planType string
	var durationDays int
	var active bool
	var usageLimit, usageCount int

	queryCode := `
		SELECT plan_type, duration_days, active, usage_limit, usage_count 
		FROM public.promo_codes 
		WHERE LOWER(code) = LOWER($1)
		FOR UPDATE
	`
	err = tx.QueryRow(ctx, queryCode, codeInput).Scan(&planType, &durationDays, &active, &usageLimit, &usageCount)
	if err != nil {
		return fmt.Errorf("código promocional inválido ou não encontrado")
	}

	if !active {
		return fmt.Errorf("este código promocional não está mais ativo")
	}

	if usageCount >= usageLimit {
		return fmt.Errorf("limite de uso deste código excedido")
	}

	// 2. Buscar Usuário para validação
	var currentPlan string
	var expiresAt *time.Time
	var redeemedCodes []string

	queryUser := `
		SELECT subscription_plan, subscription_expires_at, redeemed_promo_codes 
		FROM public.users 
		WHERE id = $1 
		FOR UPDATE
	`
	err = tx.QueryRow(ctx, queryUser, userID).Scan(&currentPlan, &expiresAt, &redeemedCodes)
	if err != nil {
		return fmt.Errorf("usuário não encontrado")
	}

	// Verificar se já usou este código
	for _, usedCode := range redeemedCodes {
		if usedCode == codeInput { // Case sensitive check or normalized? Input should be normalized
			return fmt.Errorf("você já utilizou este código promocional")
		}
	}

	// 3. Calcular Novo Estado
	newPlan := planType
	newExpiresAt := time.Now().AddDate(0, 0, durationDays)

	// Se já tem assinatura ativa do mesmo plano ou superior, estender
	// Simplificação: Se o plano novo é 'premium_ia' ou igual ao atual, estende.
	// Se o plano atual é 'premium_ia' e o novo é 'premium', mantem 'premium_ia' mas estende data?
	// Regra simples: O plano vira o do código. A data estende.

	if expiresAt != nil && expiresAt.After(time.Now()) {
		// Se já tem data futura, adiciona os dias
		extendedDate := expiresAt.AddDate(0, 0, durationDays)
		newExpiresAt = extendedDate
	}

	// Hierarquia básica: premium_ia > premium > basic > free
	if currentPlan == "premium_ia" && newPlan == "premium" {
		newPlan = "premium_ia" // Mantém o melhor plano
	}

	// 4. Atualizar Promo Code Stats
	_, err = tx.Exec(ctx, `UPDATE public.promo_codes SET usage_count = usage_count + 1 WHERE LOWER(code) = LOWER($1)`, codeInput)
	if err != nil {
		return err
	}

	// 5. Atualizar Usuário
	// Adiciona código ao array
	newRedeemed := append(redeemedCodes, codeInput)

	updateUser := `
		UPDATE public.users 
		SET subscription_plan = $1, 
			subscription_expires_at = $2, 
			redeemed_promo_codes = $3,
			subscription_status = 'active',
			updated_at = NOW()
		WHERE id = $4
	`
	_, err = tx.Exec(ctx, updateUser, newPlan, newExpiresAt, newRedeemed, userID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}
