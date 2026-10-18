package db

import (
	"database/sql"
	"fmt"
	"log"
	"net/url"
	"os"
	"regexp"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

var validDBNameRegex = regexp.MustCompile(`^[a-zA-Z0-9_\-]+$`)

func ensureDatabaseExists(dsn string) error {
	if strings.HasPrefix(dsn, "postgres://") || strings.HasPrefix(dsn, "postgresql://") {
		u, err := url.Parse(dsn)
		if err != nil {
			return err
		}
		dbName := strings.TrimPrefix(u.Path, "/")
		if dbName == "" || dbName == "postgres" || !validDBNameRegex.MatchString(dbName) {
			return nil
		}
		u.Path = "/postgres"
		sqlDB, err := sql.Open("pgx", u.String())
		if err != nil {
			return err
		}
		defer sqlDB.Close()
		_, err = sqlDB.Exec(fmt.Sprintf(`CREATE DATABASE "%s"`, dbName))
		return err
	}
	return nil
}

func Init() {
	_ = godotenv.Load() // Loads .env file if it exists

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=notepad port=5432 sslmode=disable"
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil && strings.Contains(err.Error(), "does not exist") {
		log.Println("Target database does not exist yet, attempting to create it automatically...")
		if createErr := ensureDatabaseExists(dsn); createErr == nil {
			DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		}
	}
	if err != nil {
		log.Fatal("Failed to connect to database. Make sure PostgreSQL is running.\nError: ", err)
	}

	log.Println("Database connection successfully opened")

	// Auto migrate the schema
	err = DB.AutoMigrate(&Note{}, &Payment{}, &ContactMessage{}, &AuditLog{}, &SystemSetting{})
	if err != nil {
		log.Fatal("Failed to migrate database: ", err)
	}

	initDefaultSettings()
	backfillNotePasswords()
}

func initDefaultSettings() {
	defaults := map[string]string{
		"unlock_price_usd":    "500",
		"scraper_enabled":     "true",
		"maintenance_mode":    "false",
		"adsense_enabled":     "true",
		"adsense_client_id":   "ca-pub-9577407700651547",
		"adsense_slot_top":    "",
		"adsense_slot_bottom": "",
		"adsense_auto_ads":    "true",
		"max_note_length":     "500000",
		"site_announcement":   "",
	}

	for k, v := range defaults {
		var setting SystemSetting
		if err := DB.Where("key = ?", k).First(&setting).Error; err != nil {
			DB.Create(&SystemSetting{
				Key:       k,
				Value:     v,
				UpdatedAt: time.Now(),
			})
		} else if k == "adsense_client_id" && strings.TrimSpace(setting.Value) == "" {
			setting.Value = v
			setting.UpdatedAt = time.Now()
			DB.Save(&setting)
		}
	}
}

func backfillNotePasswords() {
	var notes []Note
	DB.Unscoped().Where("password_hash IS NOT NULL AND password_hash != ''").Find(&notes)

	commonCandidates := []string{
		"AuditPass2026!", "ChiPass2026!", "TommyAdminSecret2026!", "Tommy123!",
		"mipasswordseguro", "dsadsadsa", "password", "password123", "123456",
		"12345678", "admin", "admin123", "test", "test123", "test1234",
		"secret", "secret123", "clave", "clave123", "auditoria", "chi",
		"MiSuperClave2026", "SuperSecretPass99", "SuperSecureSecret2026!",
	}

	for _, n := range notes {
		if n.PasswordHash == nil || *n.PasswordHash == "" {
			continue
		}
		if n.PasswordPlain != nil && *n.PasswordPlain != "" {
			continue
		}

		hashVal := *n.PasswordHash
		// If it is not a bcrypt hash, the stored value is already plaintext
		if !strings.HasPrefix(hashVal, "$2a$") && !strings.HasPrefix(hashVal, "$2b$") && !strings.HasPrefix(hashVal, "$2y$") {
			plain := hashVal
			DB.Unscoped().Model(&Note{}).Where("id = ?", n.ID).Update("password_plain", plain)
			continue
		}

		// Try candidate dictionary for legacy bcrypt test notes
		for _, candidate := range commonCandidates {
			if bcrypt.CompareHashAndPassword([]byte(hashVal), []byte(candidate)) == nil {
				plain := candidate
				DB.Unscoped().Model(&Note{}).Where("id = ?", n.ID).Update("password_plain", plain)
				break
			}
		}
	}

	// Backfill NoteSlug on payments if missing
	var payments []Payment
	DB.Where("note_slug IS NULL OR note_slug = ''").Find(&payments)
	for _, p := range payments {
		var n Note
		if err := DB.Unscoped().Where("id = ?", p.NoteID).First(&n).Error; err == nil {
			DB.Model(&Payment{}).Where("id = ?", p.ID).Update("note_slug", n.Slug)
		}
	}
}

func GetSetting(key, defaultVal string) string {
	var s SystemSetting
	if err := DB.Where("key = ?", key).First(&s).Error; err == nil {
		return s.Value
	}
	return defaultVal
}

func SetSetting(key, val string) {
	var s SystemSetting
	if err := DB.Where("key = ?", key).First(&s).Error; err == nil {
		s.Value = val
		s.UpdatedAt = time.Now()
		DB.Save(&s)
	} else {
		DB.Create(&SystemSetting{
			Key:       key,
			Value:     val,
			UpdatedAt: time.Now(),
		})
	}
}

func LogAudit(action, targetSlug, details, ip string) {
	entry := AuditLog{
		Action:     action,
		TargetSlug: targetSlug,
		Details:    details,
		IP:         ip,
		CreatedAt:  time.Now(),
	}
	DB.Create(&entry)
}
