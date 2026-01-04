package usecase

import (
	"context"
	"fmt"

	"financeiro-api/internal/entity"
	"financeiro-api/internal/infra/repository"

	"time"

	"github.com/google/uuid"
)

var ValidPromoCodes = map[string]time.Duration{
	"PREMIUM30": 30 * 24 * time.Hour,
	"TRIAL15":   15 * 24 * time.Hour,
}

type UserService struct {
	Repo     *repository.UserRepository
	CardRepo *repository.CardRepository
}

func NewUserService(repo *repository.UserRepository, cardRepo *repository.CardRepository) *UserService {
	return &UserService{
		Repo:     repo,
		CardRepo: cardRepo,
	}
}

func (s *UserService) GetUserProfile(ctx context.Context, id uuid.UUID) (*entity.User, error) {
	// 1. Fetch User
	user, err := s.Repo.FindByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get user profile: %w", err)
	}

	// 2. Check Expiration (Logic for Expiration Rule)
	// "quando acesso temporário expirar: usuário volta automaticamente ao plano_base"
	if user.IsTempAccess && user.TempAccessExpiresAt != nil {
		if time.Now().After(*user.TempAccessExpiresAt) {
			// Expired! Revert to BasePlan
			user.IsTempAccess = false
			user.SubscriptionPlan = user.BasePlan
			user.TempAccessOrigin = nil
			user.TempAccessExpiresAt = nil

			// Update in DB async or sync? Sync is safer for "Get" consistency.
			_ = s.Repo.UpdatePlanDetails(ctx, user)
		}
	}

	return user, nil
}

func (s *UserService) SetupUser(ctx context.Context, userID uuid.UUID, promoCode string) error {
	user, err := s.Repo.FindByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	if promoCode == "" {
		return nil
	}

	// 1. Strict Rule: One Promo Code per Lifetime
	if user.UsedPromoCode != nil && *user.UsedPromoCode != "" {
		// User already used a promo code.
		// We silently ignore or return error?
		// Requirement: "Após expiração... Não pode reativar com outro código"
		return fmt.Errorf("user already used a promo code: %s", *user.UsedPromoCode)
	}

	// 2. Redeem promo code using database
	// This will validate the code, check if user already used it, and apply the benefits
	if err := s.Repo.RedeemPromoCode(ctx, userID, promoCode); err != nil {
		return fmt.Errorf("failed to redeem promo code: %w", err)
	}

	return nil
}

func (s *UserService) SetPrimaryCard(ctx context.Context, userID uuid.UUID, cardID string, locked bool) error {
	user, err := s.Repo.FindByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	if user.PrimaryCardLocked {
		return fmt.Errorf("primary card selection is locked")
	}

	// Verify if card belongs to user
	_, err = s.CardRepo.FindByID(ctx, cardID, userID.String())
	if err != nil {
		return fmt.Errorf("card not found or does not belong to user: %w", err)
	}

	return s.Repo.UpdatePrimaryCard(ctx, userID, cardID, locked)
}

func (s *UserService) RedeemPromoCode(ctx context.Context, userID uuid.UUID, code string) error {
	if code == "" {
		return fmt.Errorf("código promocional não pode ser vazio")
	}
	return s.Repo.RedeemPromoCode(ctx, userID, code)
}

func (s *UserService) UpdateProfile(ctx context.Context, userID uuid.UUID, fullName, phone, avatarURL *string) error {
	return s.Repo.UpdateProfile(ctx, userID, fullName, phone, avatarURL)
}
