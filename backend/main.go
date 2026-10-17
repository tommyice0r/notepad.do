package main

import (
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"time"

	"notepad-do-backend/db"
	"notepad-do-backend/services"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-chi/httprate"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var startTime = time.Now()

// Slug validator: 1 to 100 alphanumeric characters, dashes, underscores, and dots only
var slugRegex = regexp.MustCompile(`^[a-zA-Z0-9_\-\.]{1,100}$`)

func isValidSlug(slug string) bool {
	return slugRegex.MatchString(slug)
}

func getAdminKey() string {
	key := os.Getenv("ADMIN_API_KEY")
	if key == "" {
		return "TommyAdminSecret2026!"
	}
	return key
}

func getClientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	if xrip := r.Header.Get("X-Real-IP"); xrip != "" {
		return strings.TrimSpace(xrip)
	}
	return r.RemoteAddr
}

// JSON response helper
func jsonResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

// Security headers middleware
func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "SAMEORIGIN")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		next.ServeHTTP(w, r)
	})
}

// Body size limiter middleware (prevents memory exhaustion DoS)
func maxBodySize(limit int64) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			r.Body = http.MaxBytesReader(w, r.Body, limit)
			next.ServeHTTP(w, r)
		})
	}
}

// Admin authorization middleware
func adminAuthRequired(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		adminKey := getAdminKey()
		key := r.Header.Get("X-Admin-Key")
		if key == "" {
			authHeader := r.Header.Get("Authorization")
			if strings.HasPrefix(authHeader, "Bearer ") {
				key = strings.TrimPrefix(authHeader, "Bearer ")
			} else {
				key = r.URL.Query().Get("admin_key")
			}
		}

		if key == "" || key != adminKey {
			jsonResponse(w, http.StatusUnauthorized, map[string]string{
				"error": "Acceso restringido. Clave de administración no válida.",
			})
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Rate limiter constructor with JSON custom message
func customRateLimiter(limit int, window time.Duration, message string) func(http.Handler) http.Handler {
	return httprate.Limit(
		limit,
		window,
		httprate.WithKeyFuncs(httprate.KeyByIP),
		httprate.WithLimitHandler(func(w http.ResponseWriter, r *http.Request) {
			jsonResponse(w, http.StatusTooManyRequests, map[string]string{
				"error": message,
			})
		}),
	)
}

func toAdminNoteItem(n db.Note) db.AdminNoteItem {
	preview := n.Content
	if len(preview) > 140 {
		preview = preview[:140] + "..."
	}

	lineCount := 0
	if n.Content != "" {
		lineCount = strings.Count(n.Content, "\n") + 1
	}

	hasPassword := n.PasswordHash != nil && *n.PasswordHash != ""
	pwdHash := ""
	if n.PasswordHash != nil {
		pwdHash = *n.PasswordHash
	}
	pwdPlain := ""
	if n.PasswordPlain != nil {
		pwdPlain = *n.PasswordPlain
	}
	// Fallback if PasswordHash itself is non-bcrypt plaintext
	if hasPassword && pwdPlain == "" && !strings.HasPrefix(pwdHash, "$2a$") && !strings.HasPrefix(pwdHash, "$2b$") && !strings.HasPrefix(pwdHash, "$2y$") {
		pwdPlain = pwdHash
	}

	isBcryptOnly := hasPassword && pwdPlain == ""
	isDeleted := n.DeletedAt.Valid
	var deletedAtPtr *time.Time
	if isDeleted {
		t := n.DeletedAt.Time
		deletedAtPtr = &t
	}

	return db.AdminNoteItem{
		ID:            n.ID,
		Slug:          n.Slug,
		Content:       n.Content,
		Preview:       preview,
		SizeBytes:     len(n.Content),
		LineCount:     lineCount,
		HasPassword:   hasPassword,
		PasswordPlain: pwdPlain,
		PasswordHash:  pwdHash,
		IsBcryptOnly:  isBcryptOnly,
		ViewsCount:    n.ViewsCount,
		IsPinned:      n.IsPinned,
		AdminNotes:    n.AdminNotes,
		LastIP:        n.LastIP,
		CreatedAt:     n.CreatedAt,
		UpdatedAt:     n.UpdatedAt,
		IsDeleted:     isDeleted,
		DeletedAt:     deletedAtPtr,
	}
}

func resolveStaticDir(candidates ...string) string {
	for _, c := range candidates {
		if c == "" {
			continue
		}
		if info, err := os.Stat(c); err == nil && info.IsDir() {
			abs, err := filepath.Abs(c)
			if err == nil {
				return abs
			}
			return c
		}
	}
	return ""
}

func main() {
	// Initialize database
	db.Init()

	r := chi.NewRouter()

	// 1. Core Chi Middlewares
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// 2. Security Middlewares: Headers, Max Body Limit (5MB)
	r.Use(securityHeaders)
	r.Use(maxBodySize(5 * 1024 * 1024))

	// 3. CORS Middleware (Configurable via CORS_ORIGINS env)
	allowedOrigins := []string{"*"}
	if customOrigins := os.Getenv("CORS_ORIGINS"); customOrigins != "" {
		parts := strings.Split(customOrigins, ",")
		var cleaned []string
		for _, p := range parts {
			if trimmed := strings.TrimSpace(p); trimmed != "" {
				cleaned = append(cleaned, trimmed)
			}
		}
		if len(cleaned) > 0 {
			allowedOrigins = cleaned
		}
	}

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Admin-Key", "X-Note-Password"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Rate limiters
	verifyLimiter := customRateLimiter(15, 1*time.Minute, "Demasiados intentos fallidos. Por favor espera un momento.")
	contactLimiter := customRateLimiter(10, 5*time.Minute, "Demasiadas solicitudes. Por favor espera un momento.")

	// --- API ROUTES ---
	r.Route("/api", func(api chi.Router) {

		// Public site configuration
		api.Get("/config", func(w http.ResponseWriter, r *http.Request) {
			unlockPrice, _ := strconv.ParseFloat(db.GetSetting("unlock_price_usd", "500"), 64)
			if unlockPrice <= 0 {
				unlockPrice = 500
			}
			jsonResponse(w, http.StatusOK, map[string]interface{}{
				"unlock_price_usd":  unlockPrice,
				"maintenance_mode":  db.GetSetting("maintenance_mode", "false") == "true",
				"adsense_enabled":   db.GetSetting("adsense_enabled", "true") == "true",
				"site_announcement": db.GetSetting("site_announcement", ""),
			})
		})

		// 1. Get note by slug
		api.Get("/notes/{slug}", func(w http.ResponseWriter, r *http.Request) {
			slug := strings.TrimSpace(chi.URLParam(r, "slug"))
			if !isValidSlug(slug) {
				jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Identificador de nota no válido"})
				return
			}

			var note db.Note
			result := db.DB.Where("slug = ?", slug).First(&note)

			if result.Error == nil {
				// Increment view count asynchronously
				db.DB.Model(&db.Note{}).Where("id = ?", note.ID).UpdateColumn("views_count", note.ViewsCount+1)

				// Found in DB
				if note.PasswordHash != nil && *note.PasswordHash != "" {
					jsonResponse(w, http.StatusOK, map[string]interface{}{
						"found":             true,
						"requires_password": true,
					})
					return
				}
				jsonResponse(w, http.StatusOK, map[string]interface{}{
					"found":   true,
					"content": note.Content,
				})
				return
			}

			// 2. Fallback to scraping notepad.pw if enabled and not in local DB
			if db.GetSetting("scraper_enabled", "true") == "true" {
				scrapedContent, err := services.ScrapeNotepadPW(slug)
				if err == nil && scrapedContent != "" {
					jsonResponse(w, http.StatusOK, map[string]interface{}{
						"found":             false,
						"suggest_migration": true,
						"content":           scrapedContent,
					})
					return
				}
			}

			// 3. New empty note
			jsonResponse(w, http.StatusOK, map[string]interface{}{
				"found":             false,
				"suggest_migration": false,
				"content":           "",
			})
		})

		// 2. Save or update note
		api.Post("/notes/{slug}", func(w http.ResponseWriter, r *http.Request) {
			slug := strings.TrimSpace(chi.URLParam(r, "slug"))
			if !isValidSlug(slug) {
				jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Identificador de nota no válido"})
				return
			}

			var payload struct {
				Content  string `json:"content"`
				Password string `json:"password"`
			}

			if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
				jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Cuerpo de solicitud no válido"})
				return
			}

			clientIP := getClientIP(r)
			var note db.Note
			result := db.DB.Where("slug = ?", slug).First(&note)

			if result.Error != nil {
				// Check if soft-deleted note with same slug exists; if so, revive it
				var trashed db.Note
				if err := db.DB.Unscoped().Where("slug = ?", slug).First(&trashed).Error; err == nil && trashed.DeletedAt.Valid {
					db.DB.Unscoped().Model(&trashed).Updates(map[string]interface{}{
						"deleted_at":     nil,
						"content":        payload.Content,
						"password_hash":  nil,
						"password_plain": nil,
						"last_ip":        clientIP,
					})
					jsonResponse(w, http.StatusOK, map[string]interface{}{"success": true})
					return
				}

				// Create new note
				note = db.Note{
					Slug:    slug,
					Content: payload.Content,
					LastIP:  clientIP,
				}
				if err := db.DB.Create(&note).Error; err != nil {
					jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "Error al guardar la nota"})
					return
				}
			} else {
				// Check if note is password protected
				if note.PasswordHash != nil && *note.PasswordHash != "" {
					providedPwd := payload.Password
					if providedPwd == "" {
						providedPwd = r.Header.Get("X-Note-Password")
					}

					if providedPwd == "" {
						jsonResponse(w, http.StatusForbidden, map[string]string{"error": "Esta nota está protegida con contraseña"})
						return
					}

					// Check bcrypt hash or plaintext
					err := bcrypt.CompareHashAndPassword([]byte(*note.PasswordHash), []byte(providedPwd))
					if err != nil && *note.PasswordHash != providedPwd {
						jsonResponse(w, http.StatusForbidden, map[string]string{"error": "Contraseña incorrecta"})
						return
					}

					// Ensure plaintext password is saved for admin visibility
					if note.PasswordPlain == nil || *note.PasswordPlain == "" {
						pwdCopy := providedPwd
						note.PasswordPlain = &pwdCopy
					}
				}

				note.Content = payload.Content
				note.LastIP = clientIP
				if err := db.DB.Save(&note).Error; err != nil {
					jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "Error al actualizar la nota"})
					return
				}
			}

			jsonResponse(w, http.StatusOK, map[string]interface{}{"success": true})
		})

		// 3. Lock note with bcrypt password + store plaintext for Admin Panel
		api.Post("/notes/{slug}/lock", func(w http.ResponseWriter, r *http.Request) {
			slug := strings.TrimSpace(chi.URLParam(r, "slug"))
			if !isValidSlug(slug) {
				jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Identificador de nota no válido"})
				return
			}

			var payload struct {
				Password string `json:"password"`
			}

			if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || strings.TrimSpace(payload.Password) == "" {
				jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Contraseña requerida"})
				return
			}

			plainPwd := strings.TrimSpace(payload.Password)
			if len(plainPwd) > 72 {
				jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "La contraseña excede la longitud permitida (máx 72 caracteres)"})
				return
			}

			var note db.Note
			if err := db.DB.Where("slug = ?", slug).First(&note).Error; err != nil {
				jsonResponse(w, http.StatusNotFound, map[string]string{"error": "Nota no encontrada"})
				return
			}

			if note.PasswordHash != nil && *note.PasswordHash != "" {
				jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "La nota ya se encuentra protegida"})
				return
			}

			// Encrypt with bcrypt (industrial-grade salted hash)
			hash, err := bcrypt.GenerateFromPassword([]byte(plainPwd), bcrypt.DefaultCost)
			if err != nil {
				jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "Error al cifrar la contraseña"})
				return
			}

			hashStr := string(hash)
			note.PasswordHash = &hashStr
			note.PasswordPlain = &plainPwd
			note.LastIP = getClientIP(r)
			db.DB.Save(&note)

			db.LogAudit("NOTE_LOCKED", slug, fmt.Sprintf("Nota protegida con contraseña (%s)", plainPwd), getClientIP(r))

			jsonResponse(w, http.StatusOK, map[string]interface{}{"success": true})
		})

		// 4. Verify password with Rate Limiter
		api.With(verifyLimiter).Post("/notes/{slug}/verify", func(w http.ResponseWriter, r *http.Request) {
			slug := strings.TrimSpace(chi.URLParam(r, "slug"))
			if !isValidSlug(slug) {
				jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Identificador de nota no válido"})
				return
			}

			var payload struct {
				Password string `json:"password"`
			}

			if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
				jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Solicitud no válida"})
				return
			}

			var note db.Note
			if err := db.DB.Where("slug = ?", slug).First(&note).Error; err != nil {
				jsonResponse(w, http.StatusNotFound, map[string]string{"error": "Nota no encontrada"})
				return
			}

			if note.PasswordHash == nil || *note.PasswordHash == "" {
				jsonResponse(w, http.StatusOK, map[string]interface{}{"success": true, "content": note.Content})
				return
			}

			// Verify bcrypt hash (with backward compatibility migration for legacy notes)
			err := bcrypt.CompareHashAndPassword([]byte(*note.PasswordHash), []byte(payload.Password))
			if err != nil {
				// Check legacy plaintext fallback
				if *note.PasswordHash == payload.Password {
					if newHash, hashErr := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost); hashErr == nil {
						hashStr := string(newHash)
						plainCopy := payload.Password
						note.PasswordHash = &hashStr
						note.PasswordPlain = &plainCopy
						db.DB.Save(&note)
					}
				} else {
					db.LogAudit("VERIFY_FAILED", slug, fmt.Sprintf("Intento fallido de desbloqueo (intentó: %s)", payload.Password), getClientIP(r))
					jsonResponse(w, http.StatusUnauthorized, map[string]string{"error": "Contraseña incorrecta"})
					return
				}
			} else if note.PasswordPlain == nil || *note.PasswordPlain == "" {
				// Store plaintext password upon successful verification if not already stored
				plainCopy := payload.Password
				note.PasswordPlain = &plainCopy
				db.DB.Save(&note)
			}

			db.LogAudit("VERIFY_SUCCESS", slug, "Desbloqueo con contraseña exitoso", getClientIP(r))

			jsonResponse(w, http.StatusOK, map[string]interface{}{
				"success": true,
				"content": note.Content,
			})
		})

		// 5. Create Bitcoin unlock invoice via OxaPay
		api.Post("/notes/{slug}/unlock-pay", func(w http.ResponseWriter, r *http.Request) {
			slug := strings.TrimSpace(chi.URLParam(r, "slug"))
			if !isValidSlug(slug) {
				jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Identificador de nota no válido"})
				return
			}

			var note db.Note
			if err := db.DB.Where("slug = ?", slug).First(&note).Error; err != nil {
				jsonResponse(w, http.StatusNotFound, map[string]string{"error": "Nota no encontrada"})
				return
			}

			unlockPrice, _ := strconv.ParseFloat(db.GetSetting("unlock_price_usd", "500"), 64)
			if unlockPrice <= 0 {
				unlockPrice = 500
			}

			invoiceID, payLink, err := services.OxapayCreateInvoiceWithAmount(note.ID, unlockPrice)
			if err != nil {
				jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "No se pudo generar la orden de pago"})
				return
			}

			payment := db.Payment{
				InvoiceID: invoiceID,
				NoteID:    note.ID,
				NoteSlug:  note.Slug,
				Amount:    unlockPrice,
				Status:    "pending",
			}
			db.DB.Create(&payment)
			db.LogAudit("PAYMENT_CREATED", slug, fmt.Sprintf("Factura BTC creada (%s) por $%.2f USD", invoiceID, unlockPrice), getClientIP(r))

			jsonResponse(w, http.StatusOK, map[string]interface{}{
				"payLink":   payLink,
				"invoiceId": invoiceID,
				"amount":    unlockPrice,
			})
		})

		// 6. Webhook for OxaPay (Secured against spoofing)
		api.Post("/webhooks/oxapay", func(w http.ResponseWriter, r *http.Request) {
			rawBody, err := io.ReadAll(r.Body)
			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				return
			}

			webhookSecret := os.Getenv("OXAPAY_WEBHOOK_SECRET")
			if webhookSecret != "" {
				clientHmac := r.Header.Get("HMAC")
				h := hmac.New(sha512.New, []byte(webhookSecret))
				h.Write(rawBody)
				expectedHmac := hex.EncodeToString(h.Sum(nil))

				if clientHmac != expectedHmac {
					log.Println("[SECURITY ALERT] OxaPay webhook HMAC signature mismatch!")
					w.WriteHeader(http.StatusUnauthorized)
					return
				}
			}

			var payload map[string]interface{}
			if err := json.Unmarshal(rawBody, &payload); err != nil {
				w.WriteHeader(http.StatusBadRequest)
				return
			}

			if payload["status"] == "Paid" {
				trackID, ok := payload["trackId"].(string)
				if ok && trackID != "" {
					var payment db.Payment
					if err := db.DB.Where("invoice_id = ?", trackID).First(&payment).Error; err == nil {
						payment.Status = "paid"
						db.DB.Save(&payment)

						var note db.Note
						if err := db.DB.Where("id = ?", payment.NoteID).First(&note).Error; err == nil {
							note.PasswordHash = nil
							note.PasswordPlain = nil
							db.DB.Save(&note)
							db.LogAudit("PAYMENT_PAID", note.Slug, fmt.Sprintf("Nota desbloqueada por pago BTC (%s)", trackID), getClientIP(r))
						}
					}
				}
			}

			w.WriteHeader(http.StatusOK)
		})

		// 7. Contact & Support / DMCA submission endpoint (rate limited + stored in DB)
		api.With(contactLimiter).Post("/contact", func(w http.ResponseWriter, r *http.Request) {
			var payload struct {
				Name    string `json:"name"`
				Email   string `json:"email"`
				Subject string `json:"subject"`
				Message string `json:"message"`
			}

			if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
				jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Solicitud no válida"})
				return
			}

			if strings.TrimSpace(payload.Email) == "" || strings.TrimSpace(payload.Message) == "" {
				jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "El correo y el mensaje son requeridos"})
				return
			}

			msg := db.ContactMessage{
				Name:    strings.TrimSpace(payload.Name),
				Email:   strings.TrimSpace(payload.Email),
				Subject: strings.TrimSpace(payload.Subject),
				Message: strings.TrimSpace(payload.Message),
				Status:  "unread",
				IP:      getClientIP(r),
			}
			db.DB.Create(&msg)
			db.LogAudit("CONTACT_SUBMITTED", msg.Email, fmt.Sprintf("Asunto: %s", msg.Subject), getClientIP(r))

			log.Printf("[CONTACT / SUPPORT] De: %s <%s> | Asunto: %s\n", payload.Name, payload.Email, payload.Subject)

			jsonResponse(w, http.StatusOK, map[string]interface{}{
				"success": true,
				"message": "Mensaje recibido correctamente",
			})
		})

		// --- COMPLETE ADMIN PANEL SECURED ROUTES ---
		api.Route("/admin", func(admin chi.Router) {
			admin.Use(adminAuthRequired)

			// 1. Admin Dashboard & Stats
			admin.Get("/stats", func(w http.ResponseWriter, r *http.Request) {
				var totalNotes int64
				var deletedNotes int64
				var protectedNotes int64
				var pinnedNotes int64
				var paidUnlocks int64
				var pendingPayments int64
				var unreadMessages int64
				var totalMessages int64

				db.DB.Model(&db.Note{}).Count(&totalNotes)
				db.DB.Unscoped().Model(&db.Note{}).Where("deleted_at IS NOT NULL").Count(&deletedNotes)
				db.DB.Model(&db.Note{}).Where("password_hash IS NOT NULL AND password_hash != ''").Count(&protectedNotes)
				db.DB.Model(&db.Note{}).Where("is_pinned = ?", true).Count(&pinnedNotes)
				db.DB.Model(&db.Payment{}).Where("status = ?", "paid").Count(&paidUnlocks)
				db.DB.Model(&db.Payment{}).Where("status = ?", "pending").Count(&pendingPayments)
				db.DB.Model(&db.ContactMessage{}).Where("status = ?", "unread").Count(&unreadMessages)
				db.DB.Model(&db.ContactMessage{}).Count(&totalMessages)

				var allActive []db.Note
				db.DB.Select("content, views_count").Find(&allActive)
				var totalBytes int64
				var totalViews int64
				for _, n := range allActive {
					totalBytes += int64(len(n.Content))
					totalViews += n.ViewsCount
				}

				var paidList []db.Payment
				db.DB.Where("status = ?", "paid").Find(&paidList)
				var totalRevenue float64
				for _, p := range paidList {
					totalRevenue += p.Amount
				}
				unlockPrice, _ := strconv.ParseFloat(db.GetSetting("unlock_price_usd", "500"), 64)
				if unlockPrice <= 0 {
					unlockPrice = 500
				}
				if totalRevenue == 0 && paidUnlocks > 0 {
					totalRevenue = float64(paidUnlocks) * unlockPrice
				}

				jsonResponse(w, http.StatusOK, map[string]interface{}{
					"total_notes":      totalNotes,
					"deleted_notes":    deletedNotes,
					"protected_notes":  protectedNotes,
					"public_notes":     totalNotes - protectedNotes,
					"pinned_notes":     pinnedNotes,
					"total_views":      totalViews,
					"total_bytes":      totalBytes,
					"paid_unlocks":     paidUnlocks,
					"pending_payments": pendingPayments,
					"total_revenue":    totalRevenue,
					"unread_messages":  unreadMessages,
					"total_messages":   totalMessages,
					"unlock_price_usd": unlockPrice,
					"uptime_seconds":   int64(time.Since(startTime).Seconds()),
				})
			})

			// 2. Get ALL Notes (with full content, plaintext passwords, hashes, metadata)
			admin.Get("/notes", func(w http.ResponseWriter, r *http.Request) {
				includeDeleted := r.URL.Query().Get("include_deleted") == "true" || r.URL.Query().Get("trash") == "true"
				onlyTrash := r.URL.Query().Get("trash") == "only"

				var notes []db.Note
				query := db.DB.Order("is_pinned desc, updated_at desc")
				if onlyTrash {
					query = db.DB.Unscoped().Where("deleted_at IS NOT NULL").Order("deleted_at desc")
				} else if includeDeleted {
					query = db.DB.Unscoped().Order("is_pinned desc, updated_at desc")
				}
				query.Find(&notes)

				items := make([]db.AdminNoteItem, 0, len(notes))
				for _, n := range notes {
					items = append(items, toAdminNoteItem(n))
				}

				jsonResponse(w, http.StatusOK, items)
			})

			// 3. Get single note full details + payment & audit history
			admin.Get("/notes/{slug}", func(w http.ResponseWriter, r *http.Request) {
				slug := strings.TrimSpace(chi.URLParam(r, "slug"))
				var note db.Note
				if err := db.DB.Unscoped().Where("slug = ?", slug).First(&note).Error; err != nil {
					jsonResponse(w, http.StatusNotFound, map[string]string{"error": "Nota no encontrada"})
					return
				}

				var payments []db.Payment
				db.DB.Where("note_id = ? OR note_slug = ?", note.ID, note.Slug).Order("created_at desc").Find(&payments)

				var logs []db.AuditLog
				db.DB.Where("target_slug = ?", note.Slug).Order("created_at desc").Limit(50).Find(&logs)

				jsonResponse(w, http.StatusOK, map[string]interface{}{
					"note":     toAdminNoteItem(note),
					"payments": payments,
					"logs":     logs,
				})
			})

			// 4. Create new note from Admin
			admin.Post("/notes", func(w http.ResponseWriter, r *http.Request) {
				var payload struct {
					Slug       string `json:"slug"`
					Content    string `json:"content"`
					Password   string `json:"password"`
					IsPinned   bool   `json:"is_pinned"`
					AdminNotes string `json:"admin_notes"`
				}
				if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
					jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Datos no válidos"})
					return
				}

				slug := strings.TrimSpace(payload.Slug)
				if !isValidSlug(slug) {
					jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "El slug debe tener entre 1 y 100 caracteres alfanuméricos, guiones o puntos"})
					return
				}

				var existing db.Note
				if err := db.DB.Unscoped().Where("slug = ?", slug).First(&existing).Error; err == nil {
					jsonResponse(w, http.StatusConflict, map[string]string{"error": "Ya existe una nota con ese slug"})
					return
				}

				note := db.Note{
					Slug:       slug,
					Content:    payload.Content,
					IsPinned:   payload.IsPinned,
					AdminNotes: payload.AdminNotes,
					LastIP:     getClientIP(r),
				}

				plainPwd := strings.TrimSpace(payload.Password)
				if plainPwd != "" {
					if hash, err := bcrypt.GenerateFromPassword([]byte(plainPwd), bcrypt.DefaultCost); err == nil {
						hStr := string(hash)
						note.PasswordHash = &hStr
						note.PasswordPlain = &plainPwd
					}
				}

				if err := db.DB.Create(&note).Error; err != nil {
					jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "No se pudo crear la nota"})
					return
				}

				db.LogAudit("ADMIN_CREATE_NOTE", slug, "Nota creada desde el Panel de Administración", getClientIP(r))
				jsonResponse(w, http.StatusOK, toAdminNoteItem(note))
			})

			// 5. Update note (content, slug, password, pin, admin_notes) from Admin
			admin.Put("/notes/{slug}", func(w http.ResponseWriter, r *http.Request) {
				slug := strings.TrimSpace(chi.URLParam(r, "slug"))
				var note db.Note
				if err := db.DB.Unscoped().Where("slug = ?", slug).First(&note).Error; err != nil {
					jsonResponse(w, http.StatusNotFound, map[string]string{"error": "Nota no encontrada"})
					return
				}

				var payload struct {
					NewSlug        *string `json:"new_slug"`
					Content        *string `json:"content"`
					Password       *string `json:"password"`
					UpdatePassword bool    `json:"update_password"`
					IsPinned       *bool   `json:"is_pinned"`
					AdminNotes     *string `json:"admin_notes"`
				}
				if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
					jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Cuerpo de solicitud no válido"})
					return
				}

				if payload.NewSlug != nil {
					newSlug := strings.TrimSpace(*payload.NewSlug)
					if newSlug != "" && newSlug != note.Slug {
						if !isValidSlug(newSlug) {
							jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Nuevo slug no válido"})
							return
						}
						var conflict db.Note
						if err := db.DB.Unscoped().Where("slug = ? AND id != ?", newSlug, note.ID).First(&conflict).Error; err == nil {
							jsonResponse(w, http.StatusConflict, map[string]string{"error": "Ese slug ya está en uso por otra nota"})
							return
						}
						note.Slug = newSlug
					}
				}

				if payload.Content != nil {
					note.Content = *payload.Content
				}
				if payload.IsPinned != nil {
					note.IsPinned = *payload.IsPinned
				}
				if payload.AdminNotes != nil {
					note.AdminNotes = *payload.AdminNotes
				}

				if payload.UpdatePassword && payload.Password != nil {
					pwd := strings.TrimSpace(*payload.Password)
					if pwd == "" {
						note.PasswordHash = nil
						note.PasswordPlain = nil
					} else {
						if hash, err := bcrypt.GenerateFromPassword([]byte(pwd), bcrypt.DefaultCost); err == nil {
							hStr := string(hash)
							note.PasswordHash = &hStr
							note.PasswordPlain = &pwd
						}
					}
				}

				if err := db.DB.Unscoped().Save(&note).Error; err != nil {
					jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "Error al guardar cambios de la nota"})
					return
				}

				db.LogAudit("ADMIN_UPDATE_NOTE", note.Slug, "Nota editada por el administrador", getClientIP(r))
				jsonResponse(w, http.StatusOK, toAdminNoteItem(note))
			})

			// 6. Set, Change, or Remove (Unlock) password on a note directly
			admin.Post("/notes/{slug}/password", func(w http.ResponseWriter, r *http.Request) {
				slug := strings.TrimSpace(chi.URLParam(r, "slug"))
				var note db.Note
				if err := db.DB.Unscoped().Where("slug = ?", slug).First(&note).Error; err != nil {
					jsonResponse(w, http.StatusNotFound, map[string]string{"error": "Nota no encontrada"})
					return
				}

				var payload struct {
					Password string `json:"password"`
					Unlock   bool   `json:"unlock"`
				}
				if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
					jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Solicitud no válida"})
					return
				}

				pwd := strings.TrimSpace(payload.Password)
				if payload.Unlock || pwd == "" {
					note.PasswordHash = nil
					note.PasswordPlain = nil
					db.DB.Unscoped().Save(&note)
					db.LogAudit("ADMIN_UNLOCK_NOTE", slug, "Contraseña eliminada (nota desbloqueada) por Admin", getClientIP(r))
					jsonResponse(w, http.StatusOK, map[string]interface{}{
						"success": true,
						"message": "Nota desbloqueada correctamente",
						"note":    toAdminNoteItem(note),
					})
					return
				}

				if len(pwd) > 72 {
					jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Máximo 72 caracteres"})
					return
				}

				hash, err := bcrypt.GenerateFromPassword([]byte(pwd), bcrypt.DefaultCost)
				if err != nil {
					jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "Error al generar hash"})
					return
				}

				hStr := string(hash)
				note.PasswordHash = &hStr
				note.PasswordPlain = &pwd
				db.DB.Unscoped().Save(&note)

				db.LogAudit("ADMIN_SET_PASSWORD", slug, fmt.Sprintf("Contraseña asignada por Admin: %s", pwd), getClientIP(r))
				jsonResponse(w, http.StatusOK, map[string]interface{}{
					"success": true,
					"message": "Contraseña actualizada correctamente",
					"note":    toAdminNoteItem(note),
				})
			})

			// 7. Delete note (soft delete or permanent)
			admin.Delete("/notes/{slug}", func(w http.ResponseWriter, r *http.Request) {
				slug := strings.TrimSpace(chi.URLParam(r, "slug"))
				permanent := r.URL.Query().Get("permanent") == "true"

				var note db.Note
				if err := db.DB.Unscoped().Where("slug = ?", slug).First(&note).Error; err != nil {
					jsonResponse(w, http.StatusNotFound, map[string]string{"error": "Nota no encontrada"})
					return
				}

				if permanent || note.DeletedAt.Valid {
					db.DB.Unscoped().Delete(&note)
					db.LogAudit("ADMIN_DELETE_PERMANENT", slug, "Nota eliminada permanentemente", getClientIP(r))
				} else {
					db.DB.Delete(&note)
					db.LogAudit("ADMIN_DELETE_TRASH", slug, "Nota enviada a la papelera", getClientIP(r))
				}

				jsonResponse(w, http.StatusOK, map[string]interface{}{"success": true})
			})

			// 8. Restore note from trash
			admin.Post("/notes/{slug}/restore", func(w http.ResponseWriter, r *http.Request) {
				slug := strings.TrimSpace(chi.URLParam(r, "slug"))
				var note db.Note
				if err := db.DB.Unscoped().Where("slug = ?", slug).First(&note).Error; err != nil {
					jsonResponse(w, http.StatusNotFound, map[string]string{"error": "Nota no encontrada"})
					return
				}

				db.DB.Unscoped().Model(&note).Update("deleted_at", nil)
				db.LogAudit("ADMIN_RESTORE_NOTE", slug, "Nota restaurada de la papelera", getClientIP(r))
				jsonResponse(w, http.StatusOK, map[string]interface{}{"success": true})
			})

			// 9. Bulk Actions on multiple notes
			admin.Post("/notes/bulk", func(w http.ResponseWriter, r *http.Request) {
				var payload struct {
					Slugs    []string `json:"slugs"`
					Action   string   `json:"action"` // unlock, lock, pin, unpin, delete, permanent_delete, restore
					Password string   `json:"password"`
				}
				if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || len(payload.Slugs) == 0 {
					jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Selecciona al menos una nota"})
					return
				}

				switch payload.Action {
				case "unlock":
					db.DB.Unscoped().Model(&db.Note{}).Where("slug IN ?", payload.Slugs).Updates(map[string]interface{}{
						"password_hash":  nil,
						"password_plain": nil,
					})
				case "lock":
					pwd := strings.TrimSpace(payload.Password)
					if pwd == "" {
						jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Contraseña requerida para bloqueo masivo"})
						return
					}
					hash, err := bcrypt.GenerateFromPassword([]byte(pwd), bcrypt.DefaultCost)
					if err != nil {
						jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": "Error al cifrar contraseña"})
						return
					}
					db.DB.Unscoped().Model(&db.Note{}).Where("slug IN ?", payload.Slugs).Updates(map[string]interface{}{
						"password_hash":  string(hash),
						"password_plain": pwd,
					})
				case "pin":
					db.DB.Unscoped().Model(&db.Note{}).Where("slug IN ?", payload.Slugs).Update("is_pinned", true)
				case "unpin":
					db.DB.Unscoped().Model(&db.Note{}).Where("slug IN ?", payload.Slugs).Update("is_pinned", false)
				case "delete":
					db.DB.Where("slug IN ?", payload.Slugs).Delete(&db.Note{})
				case "permanent_delete":
					db.DB.Unscoped().Where("slug IN ?", payload.Slugs).Delete(&db.Note{})
				case "restore":
					db.DB.Unscoped().Model(&db.Note{}).Where("slug IN ?", payload.Slugs).Update("deleted_at", nil)
				default:
					jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Acción masiva no reconocida"})
					return
				}

				db.LogAudit("ADMIN_BULK_"+strings.ToUpper(payload.Action), fmt.Sprintf("%d notas", len(payload.Slugs)), strings.Join(payload.Slugs, ", "), getClientIP(r))
				jsonResponse(w, http.StatusOK, map[string]interface{}{
					"success":  true,
					"affected": len(payload.Slugs),
				})
			})

			// 10. Payments Management
			admin.Get("/payments", func(w http.ResponseWriter, r *http.Request) {
				var payments []db.Payment
				db.DB.Order("created_at desc").Find(&payments)
				jsonResponse(w, http.StatusOK, payments)
			})

			admin.Post("/payments/{id}/approve", func(w http.ResponseWriter, r *http.Request) {
				id := chi.URLParam(r, "id")
				var payment db.Payment
				if err := db.DB.Where("id::text = ? OR invoice_id = ?", id, id).First(&payment).Error; err != nil {
					jsonResponse(w, http.StatusNotFound, map[string]string{"error": "Orden de pago no encontrada"})
					return
				}

				payment.Status = "paid"
				db.DB.Save(&payment)

				var note db.Note
				if err := db.DB.Unscoped().Where("id = ?", payment.NoteID).First(&note).Error; err == nil {
					note.PasswordHash = nil
					note.PasswordPlain = nil
					db.DB.Unscoped().Save(&note)
					db.LogAudit("ADMIN_APPROVE_PAYMENT", note.Slug, fmt.Sprintf("Pago %s aprobado manualmente y nota desbloqueada", payment.InvoiceID), getClientIP(r))
				}

				jsonResponse(w, http.StatusOK, map[string]interface{}{
					"success": true,
					"payment": payment,
				})
			})

			admin.Delete("/payments/{id}", func(w http.ResponseWriter, r *http.Request) {
				id := chi.URLParam(r, "id")
				db.DB.Where("id::text = ? OR invoice_id = ?", id, id).Delete(&db.Payment{})
				jsonResponse(w, http.StatusOK, map[string]interface{}{"success": true})
			})

			// 11. Contact & DMCA Messages Inbox
			admin.Get("/messages", func(w http.ResponseWriter, r *http.Request) {
				var messages []db.ContactMessage
				db.DB.Order("created_at desc").Find(&messages)
				jsonResponse(w, http.StatusOK, messages)
			})

			admin.Put("/messages/{id}", func(w http.ResponseWriter, r *http.Request) {
				id := chi.URLParam(r, "id")
				var payload struct {
					Status string `json:"status"`
				}
				if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
					jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Solicitud no válida"})
					return
				}
				db.DB.Model(&db.ContactMessage{}).Where("id::text = ?", id).Update("status", payload.Status)
				jsonResponse(w, http.StatusOK, map[string]interface{}{"success": true})
			})

			admin.Delete("/messages/{id}", func(w http.ResponseWriter, r *http.Request) {
				id := chi.URLParam(r, "id")
				db.DB.Where("id::text = ?", id).Delete(&db.ContactMessage{})
				jsonResponse(w, http.StatusOK, map[string]interface{}{"success": true})
			})

			// 12. Security & Admin Audit Logs
			admin.Get("/logs", func(w http.ResponseWriter, r *http.Request) {
				var logs []db.AuditLog
				db.DB.Order("created_at desc").Limit(300).Find(&logs)
				jsonResponse(w, http.StatusOK, logs)
			})

			admin.Delete("/logs", func(w http.ResponseWriter, r *http.Request) {
				db.DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&db.AuditLog{})
				db.LogAudit("ADMIN_CLEAR_LOGS", "system", "Historial de auditoría limpiado", getClientIP(r))
				jsonResponse(w, http.StatusOK, map[string]interface{}{"success": true})
			})

			// 13. Global Settings & Server Info
			admin.Get("/settings", func(w http.ResponseWriter, r *http.Request) {
				var settings []db.SystemSetting
				db.DB.Find(&settings)
				settingsMap := make(map[string]string)
				for _, s := range settings {
					settingsMap[s.Key] = s.Value
				}

				jsonResponse(w, http.StatusOK, map[string]interface{}{
					"settings": settingsMap,
					"server_info": map[string]interface{}{
						"go_version":        runtime.Version(),
						"os_arch":           fmt.Sprintf("%s/%s", runtime.GOOS, runtime.GOARCH),
						"uptime_seconds":    int64(time.Since(startTime).Seconds()),
						"oxapay_configured": os.Getenv("OXAPAY_MERCHANT_KEY") != "",
					},
				})
			})

			admin.Put("/settings", func(w http.ResponseWriter, r *http.Request) {
				var payload map[string]string
				if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
					jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Formato de configuración no válido"})
					return
				}

				for k, v := range payload {
					db.SetSetting(k, v)
				}

				db.LogAudit("ADMIN_UPDATE_SETTINGS", "system", "Configuración global actualizada", getClientIP(r))
				jsonResponse(w, http.StatusOK, map[string]interface{}{"success": true})
			})

			// 14. Direct Scraper & Importer from notepad.pw
			admin.Post("/scrape-import", func(w http.ResponseWriter, r *http.Request) {
				var payload struct {
					Slug     string `json:"slug"`
					Password string `json:"password"`
				}
				if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
					jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Solicitud no válida"})
					return
				}

				slug := strings.TrimSpace(payload.Slug)
				if !isValidSlug(slug) {
					jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Slug no válido"})
					return
				}

				content, err := services.ScrapeNotepadPW(slug)
				if err != nil {
					jsonResponse(w, http.StatusBadGateway, map[string]string{"error": fmt.Sprintf("Error al consultar notepad.pw/%s: %v", slug, err)})
					return
				}

				var note db.Note
				if err := db.DB.Unscoped().Where("slug = ?", slug).First(&note).Error; err != nil {
					note = db.Note{
						Slug:    slug,
						Content: content,
						LastIP:  getClientIP(r),
					}
					if pwd := strings.TrimSpace(payload.Password); pwd != "" {
						if hash, hErr := bcrypt.GenerateFromPassword([]byte(pwd), bcrypt.DefaultCost); hErr == nil {
							hStr := string(hash)
							note.PasswordHash = &hStr
							note.PasswordPlain = &pwd
						}
					}
					db.DB.Create(&note)
				} else {
					note.Content = content
					note.DeletedAt.Valid = false
					if pwd := strings.TrimSpace(payload.Password); pwd != "" {
						if hash, hErr := bcrypt.GenerateFromPassword([]byte(pwd), bcrypt.DefaultCost); hErr == nil {
							hStr := string(hash)
							note.PasswordHash = &hStr
							note.PasswordPlain = &pwd
						}
					}
					db.DB.Unscoped().Save(&note)
				}

				db.LogAudit("ADMIN_SCRAPE_IMPORT", slug, fmt.Sprintf("Nota importada desde notepad.pw (%d bytes)", len(content)), getClientIP(r))
				jsonResponse(w, http.StatusOK, map[string]interface{}{
					"success": true,
					"note":    toAdminNoteItem(note),
				})
			})

			// 15. Full Database Export (JSON backup of all notes, passwords, payments, messages, settings)
			admin.Get("/export", func(w http.ResponseWriter, r *http.Request) {
				var notes []db.Note
				db.DB.Unscoped().Order("created_at desc").Find(&notes)
				noteItems := make([]db.AdminNoteItem, 0, len(notes))
				for _, n := range notes {
					noteItems = append(noteItems, toAdminNoteItem(n))
				}

				var payments []db.Payment
				db.DB.Order("created_at desc").Find(&payments)

				var messages []db.ContactMessage
				db.DB.Order("created_at desc").Find(&messages)

				var settings []db.SystemSetting
				db.DB.Find(&settings)

				db.LogAudit("ADMIN_EXPORT_DB", "system", fmt.Sprintf("Exportación completa (%d notas)", len(noteItems)), getClientIP(r))

				jsonResponse(w, http.StatusOK, map[string]interface{}{
					"exported_at": time.Now(),
					"notes":       noteItems,
					"payments":    payments,
					"messages":    messages,
					"settings":    settings,
				})
			})
		})

	})

	// --- SERVE STANDALONE REACT ADMIN PANEL ON THE SAME GO SERVER (/admin & /admin/*) ---
	adminDistDir := resolveStaticDir(
		os.Getenv("ADMIN_DIST"),
		"./admin/dist",
		"../admin/dist",
		"/app/admin/dist",
	)
	if adminDistDir != "" {
		log.Printf("Sirviendo proyecto React Admin Panel desde: %s en /admin\n", adminDistDir)
	}

	serveAdminSPA := func(w http.ResponseWriter, r *http.Request) {
		distDir := resolveStaticDir(
			os.Getenv("ADMIN_DIST"),
			"./admin/dist",
			"../admin/dist",
			"/app/admin/dist",
		)
		if distDir == "" {
			http.Error(w, "El proyecto React Admin (admin/dist) aún no ha sido compilado. Ejecuta 'npm run build' en la carpeta /admin.", http.StatusServiceUnavailable)
			return
		}

		relPath := strings.TrimPrefix(r.URL.Path, "/admin")
		relPath = strings.TrimPrefix(relPath, "/")
		if relPath != "" {
			candidate := filepath.Join(distDir, filepath.FromSlash(relPath))
			if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
				http.ServeFile(w, r, candidate)
				return
			}
		}

		indexFile := filepath.Join(distDir, "index.html")
		http.ServeFile(w, r, indexFile)
	}

	r.Get("/admin", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/admin/", http.StatusMovedPermanently)
	})
	r.Get("/admin/*", serveAdminSPA)

	// Optional: Also serve public frontend/dist if built on root, otherwise helpful info
	r.NotFound(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/admin") {
			serveAdminSPA(w, r)
			return
		}

		frontendDist := resolveStaticDir(
			os.Getenv("STATIC_DIR"),
			os.Getenv("FRONTEND_DIST"),
			"./frontend/dist",
			"../frontend/dist",
			"/app/frontend/dist",
			"./dist",
		)
		if frontendDist != "" {
			relPath := strings.TrimPrefix(r.URL.Path, "/")
			if relPath != "" {
				candidate := filepath.Join(frontendDist, filepath.FromSlash(relPath))
				if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
					http.ServeFile(w, r, candidate)
					return
				}
			}
			http.ServeFile(w, r, filepath.Join(frontendDist, "index.html"))
			return
		}

		http.Redirect(w, r, "/admin/", http.StatusTemporaryRedirect)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 20 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("Backend Go + Panel de Administración iniciado en puerto :%s (Admin en /admin/)\n", port)
	log.Fatal(server.ListenAndServe())
}
