package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// CDIService handles fetching CDI rates from Banco Central do Brasil API
type CDIService struct {
	client  *http.Client
	baseURL string
}

func NewCDIService() *CDIService {
	return &CDIService{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
		baseURL: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados",
	}
}

// BCBResponse represents the response from Banco Central API
type BCBResponse struct {
	Data  string `json:"data"`  // Format: "DD/MM/YYYY"
	Valor string `json:"valor"` // CDI rate as string
}

// GetCurrentCDIRate fetches the most recent CDI rate from Banco Central
func (s *CDIService) GetCurrentCDIRate(ctx context.Context) (float64, error) {
	// Get last 5 days to ensure we get the most recent business day
	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -5)

	url := fmt.Sprintf("%s?formato=json&dataInicial=%s&dataFinal=%s",
		s.baseURL,
		startDate.Format("02/01/2006"),
		endDate.Format("02/01/2006"),
	)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return 0, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return 0, fmt.Errorf("failed to fetch CDI rate: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, fmt.Errorf("failed to read response: %w", err)
	}

	var data []BCBResponse
	if err := json.Unmarshal(body, &data); err != nil {
		return 0, fmt.Errorf("failed to parse response: %w", err)
	}

	if len(data) == 0 {
		return 0, fmt.Errorf("no CDI data available")
	}

	// Get the most recent rate (last item in array)
	latestRate := data[len(data)-1]

	// Parse the rate (comes as string with comma as decimal separator)
	var rate float64
	_, err = fmt.Sscanf(latestRate.Valor, "%f", &rate)
	if err != nil {
		// Try replacing comma with dot
		valorNormalized := latestRate.Valor
		for i, c := range valorNormalized {
			if c == ',' {
				valorNormalized = valorNormalized[:i] + "." + valorNormalized[i+1:]
				break
			}
		}
		_, err = fmt.Sscanf(valorNormalized, "%f", &rate)
		if err != nil {
			return 0, fmt.Errorf("failed to parse CDI rate: %w", err)
		}
	}

	fmt.Printf("📊 Fetched CDI rate from Banco Central: %.2f%% (date: %s)\n", rate, latestRate.Data)
	return rate, nil
}

// GetCDIRateForDate fetches the CDI rate for a specific date
func (s *CDIService) GetCDIRateForDate(ctx context.Context, date time.Time) (float64, error) {
	url := fmt.Sprintf("%s?formato=json&dataInicial=%s&dataFinal=%s",
		s.baseURL,
		date.Format("02/01/2006"),
		date.Format("02/01/2006"),
	)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return 0, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return 0, fmt.Errorf("failed to fetch CDI rate: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, fmt.Errorf("failed to read response: %w", err)
	}

	var data []BCBResponse
	if err := json.Unmarshal(body, &data); err != nil {
		return 0, fmt.Errorf("failed to parse response: %w", err)
	}

	if len(data) == 0 {
		return 0, fmt.Errorf("no CDI data available for date %s", date.Format("2006-01-02"))
	}

	// Parse the rate
	var rate float64
	valorNormalized := data[0].Valor
	for i, c := range valorNormalized {
		if c == ',' {
			valorNormalized = valorNormalized[:i] + "." + valorNormalized[i+1:]
			break
		}
	}
	_, err = fmt.Sscanf(valorNormalized, "%f", &rate)
	if err != nil {
		return 0, fmt.Errorf("failed to parse CDI rate: %w", err)
	}

	return rate, nil
}

// GetCDIHistory fetches CDI rates for a date range
func (s *CDIService) GetCDIHistory(ctx context.Context, startDate, endDate time.Time) ([]BCBResponse, error) {
	url := fmt.Sprintf("%s?formato=json&dataInicial=%s&dataFinal=%s",
		s.baseURL,
		startDate.Format("02/01/2006"),
		endDate.Format("02/01/2006"),
	)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch CDI history: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var data []BCBResponse
	if err := json.Unmarshal(body, &data); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return data, nil
}
