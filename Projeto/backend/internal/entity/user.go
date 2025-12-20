package entity

import (
	"time"

	"github.com/google/uuid"
)

type SubscriptionStatus string
type SubscriptionPlan string
type BillingCycle string

const (
	SubscriptionStatusActive   SubscriptionStatus = "active"
	SubscriptionStatusPastDue  SubscriptionStatus = "past_due"
	SubscriptionStatusCanceled SubscriptionStatus = "canceled"
	SubscriptionStatusTrial    SubscriptionStatus = "trial"

	SubscriptionPlanFree      SubscriptionPlan = "free"
	SubscriptionPlanBasic     SubscriptionPlan = "basic"
	SubscriptionPlanPremium   SubscriptionPlan = "premium"
	SubscriptionPlanPremiumIA SubscriptionPlan = "premium_ia"
)

type User struct {
	ID                    uuid.UUID          `json:"id" db:"id"`
	FullName              string             `json:"full_name" db:"full_name"`
	Email                 string             `json:"email" db:"email"`
	SubscriptionStatus    SubscriptionStatus `json:"subscription_status" db:"subscription_status"`
	SubscriptionPlan      SubscriptionPlan   `json:"subscription_plan" db:"subscription_plan"`
	SubscriptionStartDate *time.Time         `json:"subscription_start_date,omitempty" db:"subscription_start_date"`
	SubscriptionDueDate   *time.Time         `json:"subscription_due_date,omitempty" db:"subscription_due_date"`
	SubscriptionEndDate   *time.Time         `json:"subscription_end_date,omitempty" db:"subscription_end_date"`
	BasePlan              SubscriptionPlan   `json:"base_plan" db:"base_plan"`
	IsTempAccess          bool               `json:"is_temp_access" db:"is_temp_access"`
	TempAccessExpiresAt   *time.Time         `json:"temp_access_expires_at,omitempty" db:"temp_access_expires_at"`
	TempAccessOrigin      *string            `json:"temp_access_origin,omitempty" db:"temp_access_origin"`
	UsedPromoCode         *string            `json:"used_promo_code,omitempty" db:"used_promo_code"`
	PrimaryCreditCardID   *string            `json:"primary_credit_card_id,omitempty" db:"primary_credit_card_id"`
	PrimaryCardLocked     bool               `json:"primary_card_locked" db:"primary_card_locked"`
	BillingCycle          BillingCycle       `json:"billing_cycle" db:"billing_cycle"`
	CreatedAt             time.Time          `json:"created_at" db:"created_at"`
	UpdatedAt             time.Time          `json:"updated_at" db:"updated_at"`
}
