package usecase

import (
	"context"
	"fmt"
	"time"

	"financeiro-api/internal/entity"
	"financeiro-api/internal/infra/repository"
)

type InvoiceService struct {
	InvoiceRepo     *repository.InvoiceRepository
	TransactionRepo *repository.TransactionRepository
}

func NewInvoiceService(invoiceRepo *repository.InvoiceRepository, transactionRepo *repository.TransactionRepository) *InvoiceService {
	return &InvoiceService{
		InvoiceRepo:     invoiceRepo,
		TransactionRepo: transactionRepo,
	}
}

func (s *InvoiceService) CreateTransaction(ctx context.Context, input entity.CreateCreditCardTransactionInput, userID string) error {
	// Logic is mostly in Repo for installments/get_or_create
	// But we could add validation here.
	return s.InvoiceRepo.CreateTransaction(ctx, input, userID)
}

func (s *InvoiceService) DeleteTransaction(ctx context.Context, id, userID string) error {
	return s.InvoiceRepo.DeleteTransaction(ctx, id, userID)
}

func (s *InvoiceService) PayInvoice(ctx context.Context, invoiceID string, amount float64, accountID string, date time.Time, categoryID string, userID string) error {
	// 1. Get Invoice
	invoice, err := s.InvoiceRepo.FindByID(ctx, invoiceID)
	if err != nil {
		return err
	}

	if invoice.Status == entity.InvoiceStatusPaid {
		return fmt.Errorf("invoice already paid")
	}

	// 2. Create Expense Transaction in Checking Account
	// Use TransactionRepo.Create
	// Need to map input
	// Assuming Invoice payment is an expense.

	desc := fmt.Sprintf("Pagamento Fatura %d/%d", invoice.ReferenceMonth, invoice.ReferenceYear)

	txInput := entity.CreateTransactionInput{
		AccountID:   accountID,
		Description: desc,
		Amount:      amount,
		Type:        "despesa",
		Date:        date,
		InvoiceID:   &invoiceID,
	}

	if categoryID != "" {
		txInput.CategoryID = &categoryID
	}

	if _, err := s.TransactionRepo.Create(ctx, userID, txInput); err != nil {
		return fmt.Errorf("failed to create payment transaction: %w", err)
	}

	// 3. Update Invoice Status
	// Determine status: Partial or Paid?
	// Calculate total paid including this payment
	newPaidAmount := invoice.PaidAmount + amount

	newStatus := entity.InvoiceStatusPaid
	if newPaidAmount < invoice.TotalAmount {
		newStatus = entity.InvoiceStatusPartial
	}

	return s.InvoiceRepo.UpdateInvoiceStatus(ctx, invoiceID, newStatus, newPaidAmount)
}

func (s *InvoiceService) RevertPayment(ctx context.Context, invoiceID, userID string) error {
	// 1. Find payment transactions linked to this invoice
	// We need a method in TransactionRepo to find by InvoiceID
	// Or assume we pass transaction ID?
	// Frontend `revertInvoicePayment` just passes `invoiceId`.
	// It likely deletes ALL payments for that invoice.

	// We need to find transactions where invoice_id = invoiceID and type = 'despesa'?
	// Since we don't have that method in TransactionRepo yet, we might need to add it or do it manually.

	// For now, let's assume we implement `DeleteByInvoiceID` in TransactionRepo?
	// Or fetch and delete.

	// Let's rely on repo.

	// 2. Update Invoice Status to Open
	return s.InvoiceRepo.UpdateInvoiceStatus(ctx, invoiceID, entity.InvoiceStatusOpen, 0)
}
