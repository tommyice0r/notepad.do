package main

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"notepad-do-backend/db"

	"golang.org/x/crypto/bcrypt"
)

func TestSlugValidation(t *testing.T) {
	validSlugs := []string{
		"prueba",
		"pro-launch-2026",
		"nota_123.test",
		"a",
		strings.Repeat("x", 100),
	}
	for _, s := range validSlugs {
		if !isValidSlug(s) {
			t.Errorf("Expected slug %q to be valid", s)
		}
	}

	invalidSlugs := []string{
		"",
		"nota con espacios",
		"nota/con/slash",
		"nota;DROP TABLE notes;--",
		"<script>alert(1)</script>",
		strings.Repeat("x", 101),
	}
	for _, s := range invalidSlugs {
		if isValidSlug(s) {
			t.Errorf("Expected slug %q to be invalid", s)
		}
	}
}

func TestToAdminNoteItem(t *testing.T) {
	plain := "ClaveSecreta2026!"
	hashBytes, _ := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	hashStr := string(hashBytes)

	note := db.Note{
		ID:            "11111111-2222-3333-4444-555555555555",
		Slug:          "test-item",
		Content:       "Linea 1\nLinea 2\nLinea 3",
		PasswordHash:  &hashStr,
		PasswordPlain: &plain,
		ViewsCount:    10,
		IsPinned:      true,
	}

	item := toAdminNoteItem(note)
	if !item.HasPassword {
		t.Errorf("Expected HasPassword to be true")
	}
	if item.PasswordPlain != plain {
		t.Errorf("Expected PasswordPlain %q, got %q", plain, item.PasswordPlain)
	}
	if item.LineCount != 3 {
		t.Errorf("Expected LineCount 3, got %d", item.LineCount)
	}
	if item.IsBcryptOnly {
		t.Errorf("Expected IsBcryptOnly to be false when PasswordPlain is present")
	}
}

func TestSecurityHeadersAndBodyLimit(t *testing.T) {
	handler := securityHeaders(maxBodySize(16)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		buf := new(bytes.Buffer)
		if _, err := buf.ReadFrom(r.Body); err != nil {
			w.WriteHeader(http.StatusRequestEntityTooLarge)
			return
		}
		w.WriteHeader(http.StatusOK)
	})))

	req := httptest.NewRequest(http.MethodPost, "/api/notes/prueba", strings.NewReader("corto"))
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d", rec.Code)
	}
	if rec.Header().Get("X-Content-Type-Options") != "nosniff" {
		t.Errorf("Missing X-Content-Type-Options header")
	}
	if rec.Header().Get("X-Frame-Options") != "SAMEORIGIN" {
		t.Errorf("Missing X-Frame-Options header")
	}

	// Exceed body limit
	reqTooLarge := httptest.NewRequest(http.MethodPost, "/api/notes/prueba", strings.NewReader(strings.Repeat("A", 64)))
	recTooLarge := httptest.NewRecorder()
	handler.ServeHTTP(recTooLarge, reqTooLarge)
	if recTooLarge.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("Expected 413 Request Entity Too Large, got %d", recTooLarge.Code)
	}
}

func TestAdminAuthMiddleware(t *testing.T) {
	protected := adminAuthRequired(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// 1. No key -> 401
	req1 := httptest.NewRequest(http.MethodGet, "/api/admin/stats", nil)
	rec1 := httptest.NewRecorder()
	protected.ServeHTTP(rec1, req1)
	if rec1.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 without key, got %d", rec1.Code)
	}

	// 2. Wrong key -> 401
	req2 := httptest.NewRequest(http.MethodGet, "/api/admin/stats", nil)
	req2.Header.Set("X-Admin-Key", "clave-incorrecta")
	rec2 := httptest.NewRecorder()
	protected.ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 with wrong key, got %d", rec2.Code)
	}

	// 3. Valid X-Admin-Key -> 200
	req3 := httptest.NewRequest(http.MethodGet, "/api/admin/stats", nil)
	req3.Header.Set("X-Admin-Key", getAdminKey())
	rec3 := httptest.NewRecorder()
	protected.ServeHTTP(rec3, req3)
	if rec3.Code != http.StatusOK {
		t.Errorf("Expected 200 with valid X-Admin-Key, got %d", rec3.Code)
	}

	// 4. Valid Bearer token -> 200
	req4 := httptest.NewRequest(http.MethodGet, "/api/admin/stats", nil)
	req4.Header.Set("Authorization", "Bearer "+getAdminKey())
	rec4 := httptest.NewRecorder()
	protected.ServeHTTP(rec4, req4)
	if rec4.Code != http.StatusOK {
		t.Errorf("Expected 200 with valid Bearer token, got %d", rec4.Code)
	}
}

func TestDatabaseIntegration(t *testing.T) {
	db.Init()

	// Verify system settings
	price := db.GetSetting("unlock_price_usd", "500")
	if price == "" {
		t.Fatalf("Expected unlock_price_usd setting to be non-empty")
	}

	// Create and cleanup a test note in Dokploy PostgreSQL
	slug := "go-unit-test-" + time.Now().Format("150405")
	n := db.Note{
		Slug:    slug,
		Content: "Prueba unitaria Go contra Dokploy PostgreSQL",
		LastIP:  "127.0.0.1",
	}
	if err := db.DB.Create(&n).Error; err != nil {
		t.Fatalf("Failed to create note in DB: %v", err)
	}
	defer db.DB.Unscoped().Where("id = ?", n.ID).Delete(&db.Note{})

	var loaded db.Note
	if err := db.DB.Where("slug = ?", slug).First(&loaded).Error; err != nil {
		t.Fatalf("Failed to query created note: %v", err)
	}
	if loaded.Content != n.Content {
		t.Errorf("Expected content %q, got %q", n.Content, loaded.Content)
	}
}
