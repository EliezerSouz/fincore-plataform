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
			updated_at = $7
		WHERE id = $8::uuid
	`
	_, err := r.DB.Exec(ctx, query,
		user.SubscriptionPlan,
		user.SubscriptionStatus,
		user.IsTempAccess,
		user.TempAccessExpiresAt,
		user.TempAccessOrigin,
		user.UsedPromoCode,
		time.Now(),
		user.ID,
	)
	return err
}
