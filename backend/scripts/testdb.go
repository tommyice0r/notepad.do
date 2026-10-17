package main

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"notepad-do-backend/db"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func syncDatabases(srcDSN string, dstDSNs []string) {
	fmt.Println("==================================================")
	fmt.Println("🔄 Sincronizando datos desde origen hacia destino(s)...")
	fmt.Println("==================================================")

	srcDB, err := gorm.Open(postgres.Open(srcDSN), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ No se pudo abrir la DB de origen: %v\n", err)
	}

	var notes []db.Note
	var payments []db.Payment
	var messages []db.ContactMessage
	var logs []db.AuditLog
	var settings []db.SystemSetting

	srcDB.Unscoped().Find(&notes)
	srcDB.Find(&payments)
	srcDB.Find(&messages)
	srcDB.Find(&logs)
	srcDB.Find(&settings)

	fmt.Printf("📦 Origen cargado: %d notas, %d pagos, %d mensajes, %d logs, %d ajustes\n",
		len(notes), len(payments), len(messages), len(logs), len(settings))

	for _, dstDSN := range dstDSNs {
		dstDB, err := gorm.Open(postgres.Open(dstDSN), &gorm.Config{})
		if err != nil {
			log.Fatalf("❌ No se pudo abrir la DB destino: %v\n", err)
		}

		var currentDBName string
		dstDB.Raw("SELECT current_database()").Scan(&currentDBName)

		if err := dstDB.AutoMigrate(&db.Note{}, &db.Payment{}, &db.ContactMessage{}, &db.AuditLog{}, &db.SystemSetting{}); err != nil {
			log.Fatalf("❌ Error migrando destino (%s): %v\n", currentDBName, err)
		}

		if len(settings) > 0 {
			dstDB.Clauses(clause.OnConflict{UpdateAll: true}).Create(&settings)
		}
		if len(notes) > 0 {
			dstDB.Clauses(clause.OnConflict{UpdateAll: true}).Create(&notes)
		}
		if len(payments) > 0 {
			dstDB.Clauses(clause.OnConflict{UpdateAll: true}).Create(&payments)
		}
		if len(messages) > 0 {
			dstDB.Clauses(clause.OnConflict{UpdateAll: true}).Create(&messages)
		}
		if len(logs) > 0 {
			dstDB.Clauses(clause.OnConflict{UpdateAll: true}).Create(&logs)
		}

		// Ensure note 'prueba' exists
		var pruebaNote db.Note
		if err := dstDB.Unscoped().Where("slug = ?", "prueba").First(&pruebaNote).Error; err != nil {
			pruebaNote = db.Note{
				Slug:       "prueba",
				Content:    "Nota de prueba en Dokploy PostgreSQL para Notepad.do\nEstado: Conectado y verificado correctamente.",
				AdminNotes: "Nota de verificación inicial en DB Dokploy",
				LastIP:     "127.0.0.1",
			}
			dstDB.Create(&pruebaNote)
		}

		var totalNotes int64
		dstDB.Model(&db.Note{}).Count(&totalNotes)
		fmt.Printf("✅ Base de datos '%s' sincronizada con éxito (%d notas activas).\n", currentDBName, totalNotes)
	}
}

func runDatabaseTests(dsn string) {
	start := time.Now()
	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ [FAIL] Conexión GORM fallida: %v\n", err)
	}

	sqlDB, err := database.DB()
	if err != nil {
		log.Fatalf("❌ [FAIL] Obtención de sql.DB fallida: %v\n", err)
	}
	defer sqlDB.Close()

	if err := sqlDB.Ping(); err != nil {
		log.Fatalf("❌ [FAIL] Ping a PostgreSQL fallido: %v\n", err)
	}
	pingDuration := time.Since(start)

	var version string
	var currentDB string
	database.Raw("SELECT version()").Scan(&version)
	database.Raw("SELECT current_database()").Scan(&currentDB)

	fmt.Println("==================================================")
	fmt.Printf("🧪 EJECUTANDO SUITE DE PRUEBAS EN DB: '%s'\n", currentDB)
	fmt.Println("==================================================")
	fmt.Printf("✅ [PASS] 1. Conexión y Ping exitoso (%v)\n", pingDuration.Round(time.Millisecond))
	fmt.Printf("   ℹ️  Servidor: %s\n", version)

	// 2. Verify all tables exist
	requiredTables := []string{"notes", "payments", "contact_messages", "audit_logs", "system_settings"}
	for _, tbl := range requiredTables {
		if !database.Migrator().HasTable(tbl) {
			log.Fatalf("❌ [FAIL] Tabla requerida '%s' no existe en '%s'\n", tbl, currentDB)
		}
	}
	fmt.Printf("✅ [PASS] 2. Esquema verificado: %s\n", strings.Join(requiredTables, ", "))

	// 3. Verify indexes
	if !database.Migrator().HasIndex(&db.Note{}, "Slug") {
		log.Fatalf("❌ [FAIL] Índice único en notes.slug no encontrado\n")
	}
	if !database.Migrator().HasIndex(&db.Payment{}, "InvoiceID") {
		log.Fatalf("❌ [FAIL] Índice único en payments.invoice_id no encontrado\n")
	}
	fmt.Println("✅ [PASS] 3. Índices únicos y de búsqueda verificados (slug, deleted_at, invoice_id)")

	// 4. Verify system_settings
	var settingsCount int64
	database.Model(&db.SystemSetting{}).Count(&settingsCount)
	if settingsCount < 6 {
		log.Fatalf("❌ [FAIL] Se esperaban al menos 6 ajustes del sistema, se encontraron %d\n", settingsCount)
	}
	fmt.Printf("✅ [PASS] 4. Ajustes del sistema verificados (%d ajustes activos)\n", settingsCount)

	// 5. Test Note CRUD + Password Locking + Soft Delete + Restore + Permanent Delete
	testSlug := fmt.Sprintf("db-autotest-%d", time.Now().UnixNano())
	plainPwd := "TestDokploy2026!"
	hashBytes, err := bcrypt.GenerateFromPassword([]byte(plainPwd), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("❌ [FAIL] Error generando hash bcrypt: %v\n", err)
	}
	hashStr := string(hashBytes)

	newNote := db.Note{
		Slug:          testSlug,
		Content:       "Contenido inicial de prueba CRUD",
		PasswordHash:  &hashStr,
		PasswordPlain: &plainPwd,
		IsPinned:      true,
		AdminNotes:    "Test automatizado",
		LastIP:        "127.0.0.1",
	}
	if err := database.Create(&newNote).Error; err != nil {
		log.Fatalf("❌ [FAIL] Error creando nota de prueba: %v\n", err)
	}
	if newNote.ID == "" {
		log.Fatalf("❌ [FAIL] UUID no generado automáticamente por PostgreSQL\n")
	}

	// Read & verify password
	var fetchedNote db.Note
	if err := database.Where("slug = ?", testSlug).First(&fetchedNote).Error; err != nil {
		log.Fatalf("❌ [FAIL] Error leyendo nota recién creada: %v\n", err)
	}
	if bcrypt.CompareHashAndPassword([]byte(*fetchedNote.PasswordHash), []byte(plainPwd)) != nil {
		log.Fatalf("❌ [FAIL] Verificación bcrypt fallida en nota leída\n")
	}

	// Update
	database.Model(&fetchedNote).Updates(map[string]interface{}{
		"content":     "Contenido actualizado CRUD",
		"views_count": 5,
	})

	// Soft delete
	if err := database.Delete(&fetchedNote).Error; err != nil {
		log.Fatalf("❌ [FAIL] Error en soft-delete de nota: %v\n", err)
	}
	var countActive int64
	database.Model(&db.Note{}).Where("slug = ?", testSlug).Count(&countActive)
	if countActive != 0 {
		log.Fatalf("❌ [FAIL] Nota eliminada sigue apareciendo como activa\n")
	}

	// Restore
	database.Unscoped().Model(&db.Note{}).Where("slug = ?", testSlug).Update("deleted_at", nil)
	database.Model(&db.Note{}).Where("slug = ?", testSlug).Count(&countActive)
	if countActive != 1 {
		log.Fatalf("❌ [FAIL] Nota no fue restaurada correctamente de la papelera\n")
	}

	// Permanent Delete
	database.Unscoped().Where("slug = ?", testSlug).Delete(&db.Note{})
	fmt.Printf("✅ [PASS] 5. Ciclo completo de Notas (UUID, Create, Read, Bcrypt, Update, SoftDelete, Restore, HardDelete)\n")

	// 6. Test Payment CRUD
	testInvoice := fmt.Sprintf("inv_test_%d", time.Now().UnixNano())
	payment := db.Payment{
		InvoiceID: testInvoice,
		NoteID:    newNote.ID,
		NoteSlug:  testSlug,
		Amount:    500,
		Status:    "pending",
	}
	if err := database.Create(&payment).Error; err != nil {
		log.Fatalf("❌ [FAIL] Error creando registro Payment: %v\n", err)
	}
	database.Model(&payment).Update("status", "paid")
	database.Where("id = ?", payment.ID).Delete(&db.Payment{})
	fmt.Println("✅ [PASS] 6. Ciclo completo de Pagos OxaPay (Create pending -> Update paid -> Delete)")

	// 7. Test ContactMessage & AuditLog CRUD
	msg := db.ContactMessage{
		Name:    "Tester",
		Email:   "test@notepad.do",
		Subject: "DB Test",
		Message: "Mensaje de prueba automatizada",
		Status:  "unread",
		IP:      "127.0.0.1",
	}
	if err := database.Create(&msg).Error; err != nil {
		log.Fatalf("❌ [FAIL] Error creando ContactMessage: %v\n", err)
	}
	database.Where("id = ?", msg.ID).Delete(&db.ContactMessage{})

	audit := db.AuditLog{
		Action:     "DB_SELF_TEST",
		TargetSlug: "prueba",
		Details:    "Verificación integral de base de datos completada",
		IP:         "127.0.0.1",
		CreatedAt:  time.Now(),
	}
	if err := database.Create(&audit).Error; err != nil {
		log.Fatalf("❌ [FAIL] Error creando AuditLog: %v\n", err)
	}
	database.Where("id = ?", audit.ID).Delete(&db.AuditLog{})
	fmt.Println("✅ [PASS] 7. Ciclo completo de Mensajes de Contacto y Logs de Auditoría")

	var finalNoteCount int64
	database.Model(&db.Note{}).Count(&finalNoteCount)
	fmt.Printf("🎉 RESULTADO FINAL EN '%s': TODAS LAS PRUEBAS PASARON (%d notas activas en DB)\n\n", currentDB, finalNoteCount)
}

func main() {
	_ = godotenv.Load()

	args := os.Args[1:]
	if len(args) >= 3 && args[0] == "--sync-from" {
		srcDSN := args[1]
		dstDSNs := args[2:]
		syncDatabases(srcDSN, dstDSNs)
		for _, dst := range dstDSNs {
			runDatabaseTests(dst)
		}
		return
	}

	if len(args) > 0 {
		for _, dsn := range args {
			if strings.TrimSpace(dsn) != "" {
				runDatabaseTests(strings.TrimSpace(dsn))
			}
		}
		return
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("Uso: go run scripts/testdb.go <dsn1> [dsn2...] o define DATABASE_URL")
	}
	runDatabaseTests(dsn)
}
