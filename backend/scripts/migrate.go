package main

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"notepad-do-backend/db"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	_ = godotenv.Load()

	dsn := ""
	if len(os.Args) > 1 && strings.TrimSpace(os.Args[1]) != "" {
		dsn = strings.TrimSpace(os.Args[1])
	} else {
		dsn = os.Getenv("DATABASE_URL")
	}

	if dsn == "" {
		log.Fatal("ERROR: No se proporcionó la URL de conexión de PostgreSQL.\nUso: go run backend/scripts/migrate.go \"postgres://...\" o define DATABASE_URL en el entorno.")
	}

	fmt.Println("==================================================")
	fmt.Println("⚡ Conectando a la base de datos PostgreSQL...")
	fmt.Println("==================================================")

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ Error de conexión con PostgreSQL: %v\n", err)
	}

	sqlDB, err := database.DB()
	if err != nil {
		log.Fatalf("❌ Error obteniendo instancia SQL: %v\n", err)
	}
	defer sqlDB.Close()

	if err := sqlDB.Ping(); err != nil {
		log.Fatalf("❌ Error en Ping de PostgreSQL: %v\n", err)
	}

	fmt.Println("✅ Conexión establecida exitosamente.")
	fmt.Println("🚀 Ejecutando AutoMigrate de esquemas...")

	// Migrar todas las tablas
	err = database.AutoMigrate(
		&db.Note{},
		&db.Payment{},
		&db.ContactMessage{},
		&db.AuditLog{},
		&db.SystemSetting{},
	)
	if err != nil {
		log.Fatalf("❌ Error ejecutando migraciones: %v\n", err)
	}

	// Inicializar configuraciones por defecto
	defaults := map[string]string{
		"unlock_price_usd":  "500",
		"scraper_enabled":   "true",
		"maintenance_mode":  "false",
		"adsense_enabled":   "true",
		"max_note_length":   "500000",
		"site_announcement": "",
	}

	for k, v := range defaults {
		var setting db.SystemSetting
		if err := database.Where("key = ?", k).First(&setting).Error; err != nil {
			database.Create(&db.SystemSetting{
				Key:       k,
				Value:     v,
				UpdatedAt: time.Now(),
			})
		}
	}

	// Verificar tablas creadas
	var noteCount int64
	var settingCount int64
	database.Model(&db.Note{}).Count(&noteCount)
	database.Model(&db.SystemSetting{}).Count(&settingCount)

	fmt.Println("==================================================")
	fmt.Println("🎉 ¡Base de datos migrada y lista para producción!")
	fmt.Printf(" - Tablas verificadas: notes, payments, contact_messages, audit_logs, system_settings\n")
	fmt.Printf(" - Notas existentes: %d\n", noteCount)
	fmt.Printf(" - Ajustes del sistema inicializados: %d\n", settingCount)
	fmt.Println("==================================================")
}
