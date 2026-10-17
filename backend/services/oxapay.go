package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

// OxapayCreateInvoice creates a default $500 BTC invoice
func OxapayCreateInvoice(noteID string) (string, string, error) {
	return OxapayCreateInvoiceWithAmount(noteID, 500)
}

// OxapayCreateInvoiceWithAmount creates a BTC invoice with a dynamic USD amount
func OxapayCreateInvoiceWithAmount(noteID string, amount float64) (string, string, error) {
	if amount <= 0 {
		amount = 500
	}
	merchantKey := os.Getenv("OXAPAY_MERCHANT_KEY")
	if merchantKey == "" {
		// Mock behavior if no key is set (for development)
		mockID := fmt.Sprintf("inv_%d_%s", time.Now().Unix(), noteID[:minLen(8, len(noteID))])
		return mockID, fmt.Sprintf("https://oxapay.com/pay/%s", mockID), nil
	}

	payload := map[string]interface{}{
		"merchant":    merchantKey,
		"amount":      amount,
		"currency":    "USD",
		"payCurrency": "BTC",
		"orderId":     noteID,
		"description": "Unlock note password on Notepad.do",
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return "", "", err
	}

	resp, err := http.Post("https://api.oxapay.com/merchants/request", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&result)

	if result["result"] == float64(100) || result["result"] == 100 {
		return fmt.Sprintf("%v", result["trackId"]), fmt.Sprintf("%v", result["payLink"]), nil
	}

	return "", "", fmt.Errorf("Oxapay error: %v", result["message"])
}

func minLen(a, b int) int {
	if a < b {
		return a
	}
	return b
}
