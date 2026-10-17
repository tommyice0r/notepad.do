package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

func doReq(client *http.Client, method, url, adminKey string, headers map[string]string, body interface{}) (int, map[string]interface{}, []byte) {
	var bodyReader io.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		bodyReader = bytes.NewReader(b)
	}
	req, err := http.NewRequest(method, url, bodyReader)
	if err != nil {
		log.Fatalf("❌ Error creando request %s %s: %v", method, url, err)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if adminKey != "" {
		req.Header.Set("X-Admin-Key", adminKey)
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}

	resp, err := client.Do(req)
	if err != nil {
		log.Fatalf("❌ Error ejecutando %s %s: %v", method, url, err)
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	var parsed map[string]interface{}
	_ = json.Unmarshal(raw, &parsed)
	return resp.StatusCode, parsed, raw
}

func assertStatus(step string, got, expected int, raw []byte) {
	if got != expected {
		log.Fatalf("❌ [FAIL] %s -> esperado HTTP %d, obtenido HTTP %d. Respuesta: %s", step, expected, got, string(raw))
	}
	fmt.Printf("✅ [PASS] %s (HTTP %d)\n", step, got)
}

func main() {
	_ = godotenv.Load()

	baseURL := "http://localhost:8080"
	if len(os.Args) > 1 && strings.TrimSpace(os.Args[1]) != "" {
		baseURL = strings.TrimRight(strings.TrimSpace(os.Args[1]), "/")
	}

	adminKey := os.Getenv("ADMIN_API_KEY")
	if adminKey == "" {
		adminKey = "TommyAdminSecret2026!"
	}

	client := &http.Client{Timeout: 20 * time.Second}
	testSlug := fmt.Sprintf("e2e-dokploy-%d", time.Now().Unix())

	fmt.Println("==================================================")
	fmt.Printf("🚀 INICIANDO PRUEBAS E2E API CONTRA: %s\n", baseURL)
	fmt.Println("==================================================")

	// 1. GET /api/config
	code, data, raw := doReq(client, "GET", baseURL+"/api/config", "", nil, nil)
	assertStatus("1. GET /api/config (Configuración pública)", code, 200, raw)
	if data["unlock_price_usd"] == nil {
		log.Fatalf("❌ [FAIL] unlock_price_usd faltante en /api/config")
	}

	// 2. GET /api/notes/prueba
	code, data, raw = doReq(client, "GET", baseURL+"/api/notes/prueba", "", nil, nil)
	assertStatus("2. GET /api/notes/prueba (Lectura de nota 'prueba' en Dokploy DB)", code, 200, raw)
	if data["found"] != true {
		log.Fatalf("❌ [FAIL] Se esperaba found=true para /api/notes/prueba, obtenido: %s", string(raw))
	}

	// 3. POST /api/notes/{testSlug} (Create)
	code, _, raw = doReq(client, "POST", baseURL+"/api/notes/"+testSlug, "", nil, map[string]string{
		"content": "Contenido E2E inicial guardado en Dokploy PostgreSQL",
	})
	assertStatus("3. POST /api/notes/"+testSlug+" (Crear nota pública)", code, 200, raw)

	// 4. GET /api/notes/{testSlug} (Read)
	code, data, raw = doReq(client, "GET", baseURL+"/api/notes/"+testSlug, "", nil, nil)
	assertStatus("4. GET /api/notes/"+testSlug+" (Verificar contenido guardado)", code, 200, raw)
	if data["content"] != "Contenido E2E inicial guardado en Dokploy PostgreSQL" {
		log.Fatalf("❌ [FAIL] Contenido no coincide: %v", data["content"])
	}

	// 5. POST /api/notes/{testSlug}/lock (Lock with password)
	code, _, raw = doReq(client, "POST", baseURL+"/api/notes/"+testSlug+"/lock", "", nil, map[string]string{
		"password": "ClaveE2E2026!",
	})
	assertStatus("5. POST /api/notes/"+testSlug+"/lock (Bloquear nota con bcrypt)", code, 200, raw)

	// 6. GET /api/notes/{testSlug} (Should require password)
	code, data, raw = doReq(client, "GET", baseURL+"/api/notes/"+testSlug, "", nil, nil)
	assertStatus("6. GET /api/notes/"+testSlug+" (Verificar protección activa)", code, 200, raw)
	if data["requires_password"] != true {
		log.Fatalf("❌ [FAIL] Se esperaba requires_password=true")
	}

	// 7. POST /api/notes/{testSlug}/verify (Wrong password -> 401)
	code, _, raw = doReq(client, "POST", baseURL+"/api/notes/"+testSlug+"/verify", "", nil, map[string]string{
		"password": "ClaveIncorrecta",
	})
	assertStatus("7. POST /api/notes/"+testSlug+"/verify con clave errónea (Rechazo esperado)", code, 401, raw)

	// 8. POST /api/notes/{testSlug}/verify (Correct password -> 200)
	code, data, raw = doReq(client, "POST", baseURL+"/api/notes/"+testSlug+"/verify", "", nil, map[string]string{
		"password": "ClaveE2E2026!",
	})
	assertStatus("8. POST /api/notes/"+testSlug+"/verify con clave correcta (Desbloqueo exitoso)", code, 200, raw)
	if data["content"] != "Contenido E2E inicial guardado en Dokploy PostgreSQL" {
		log.Fatalf("❌ [FAIL] Contenido desbloqueado no coincide")
	}

	// 9. POST /api/notes/{testSlug} without password -> 403 Forbidden
	code, _, raw = doReq(client, "POST", baseURL+"/api/notes/"+testSlug, "", nil, map[string]string{
		"content": "Intento de sobreescritura sin clave",
	})
	assertStatus("9. POST /api/notes/"+testSlug+" sin clave (Protección contra escritura no autorizada)", code, 403, raw)

	// 10. POST /api/notes/{testSlug} with X-Note-Password header -> 200 OK
	code, _, raw = doReq(client, "POST", baseURL+"/api/notes/"+testSlug, "", map[string]string{
		"X-Note-Password": "ClaveE2E2026!",
	}, map[string]string{
		"content": "Contenido E2E actualizado con contraseña válida",
	})
	assertStatus("10. POST /api/notes/"+testSlug+" con X-Note-Password (Actualización autorizada)", code, 200, raw)

	// 11. POST /api/notes/{testSlug}/unlock-pay (Create OxaPay invoice)
	code, data, raw = doReq(client, "POST", baseURL+"/api/notes/"+testSlug+"/unlock-pay", "", nil, nil)
	assertStatus("11. POST /api/notes/"+testSlug+"/unlock-pay (Crear factura de desbloqueo BTC)", code, 200, raw)
	invoiceID, _ := data["invoiceId"].(string)
	if invoiceID == "" {
		log.Fatalf("❌ [FAIL] invoiceId vacío en unlock-pay")
	}

	// 12. POST /api/contact (Contact & DMCA message)
	code, _, raw = doReq(client, "POST", baseURL+"/api/contact", "", nil, map[string]string{
		"name":    "Auditor E2E",
		"email":   "auditor@notepad.do",
		"subject": "Verificación E2E Dokploy",
		"message": "Prueba de buzón de contacto y soporte en Dokploy PostgreSQL",
	})
	assertStatus("12. POST /api/contact (Envío de formulario de contacto/DMCA)", code, 200, raw)

	// 13. GET /api/admin/stats without key -> 401
	code, _, raw = doReq(client, "GET", baseURL+"/api/admin/stats", "", nil, nil)
	assertStatus("13. GET /api/admin/stats sin credenciales (Bloqueo de seguridad Admin)", code, 401, raw)

	// 14. GET /api/admin/stats with Admin Key -> 200
	code, data, raw = doReq(client, "GET", baseURL+"/api/admin/stats", adminKey, nil, nil)
	assertStatus("14. GET /api/admin/stats con X-Admin-Key (Estadísticas globales)", code, 200, raw)
	fmt.Printf("    📊 Total Notas en Dokploy DB: %v | Protegidas: %v | Pagos pendientes: %v\n",
		data["total_notes"], data["protected_notes"], data["pending_payments"])

	// 15. GET /api/admin/notes/{testSlug} (Inspector)
	code, data, raw = doReq(client, "GET", baseURL+"/api/admin/notes/"+testSlug, adminKey, nil, nil)
	assertStatus("15. GET /api/admin/notes/"+testSlug+" (Inspector detallado de nota + clave en texto plano)", code, 200, raw)
	noteObj, _ := data["note"].(map[string]interface{})
	if noteObj["password_plain"] != "ClaveE2E2026!" {
		log.Fatalf("❌ [FAIL] Admin Inspector no devolvió password_plain esperado: %v", noteObj["password_plain"])
	}

	// 16. POST /api/admin/payments/{invoiceID}/approve (Approve payment & auto-unlock note)
	code, _, raw = doReq(client, "POST", baseURL+"/api/admin/payments/"+invoiceID+"/approve", adminKey, nil, nil)
	assertStatus("16. POST /api/admin/payments/"+invoiceID+"/approve (Aprobar pago y desbloquear nota)", code, 200, raw)

	// 17. Verify note is now unlocked publicly
	code, data, raw = doReq(client, "GET", baseURL+"/api/notes/"+testSlug, "", nil, nil)
	assertStatus("17. GET /api/notes/"+testSlug+" tras aprobación de pago (Nota desbloqueada)", code, 200, raw)
	if data["requires_password"] == true {
		log.Fatalf("❌ [FAIL] La nota sigue bloqueada después de aprobar el pago")
	}

	// 18. PUT /api/admin/notes/{testSlug} (Admin edit note)
	code, _, raw = doReq(client, "PUT", baseURL+"/api/admin/notes/"+testSlug, adminKey, nil, map[string]interface{}{
		"is_pinned":   true,
		"admin_notes": "Verificado por E2E",
	})
	assertStatus("18. PUT /api/admin/notes/"+testSlug+" (Edición administrativa de nota)", code, 200, raw)

	// 19. DELETE /api/admin/notes/{testSlug} (Soft delete to trash)
	code, _, raw = doReq(client, "DELETE", baseURL+"/api/admin/notes/"+testSlug, adminKey, nil, nil)
	assertStatus("19. DELETE /api/admin/notes/"+testSlug+" (Enviar nota a papelera)", code, 200, raw)

	// 20. POST /api/admin/notes/{testSlug}/restore (Restore from trash)
	code, _, raw = doReq(client, "POST", baseURL+"/api/admin/notes/"+testSlug+"/restore", adminKey, nil, nil)
	assertStatus("20. POST /api/admin/notes/"+testSlug+"/restore (Restaurar nota desde papelera)", code, 200, raw)

	// 21. POST /api/admin/notes/bulk (Permanent delete cleanup)
	code, _, raw = doReq(client, "POST", baseURL+"/api/admin/notes/bulk", adminKey, nil, map[string]interface{}{
		"slugs":  []string{testSlug, "e2e-dokploy-1792278694"},
		"action": "permanent_delete",
	})
	assertStatus("21. POST /api/admin/notes/bulk [permanent_delete] (Limpieza de nota de prueba)", code, 200, raw)

	// 22. Cleanup test payment
	_, _, _ = doReq(client, "DELETE", baseURL+"/api/admin/payments/inv_1792278703_210ff371", adminKey, nil, nil)
	code, _, raw = doReq(client, "DELETE", baseURL+"/api/admin/payments/"+invoiceID, adminKey, nil, nil)
	assertStatus("22. DELETE /api/admin/payments/"+invoiceID+" (Limpieza de factura de prueba)", code, 200, raw)

	// 23. Verify & cleanup test contact message
	code, _, raw = doReq(client, "GET", baseURL+"/api/admin/messages", adminKey, nil, nil)
	assertStatus("23. GET /api/admin/messages (Bandeja de mensajes Admin)", code, 200, raw)
	var msgList []map[string]interface{}
	_ = json.Unmarshal(raw, &msgList)
	for _, m := range msgList {
		if m["email"] == "auditor@notepad.do" {
			if idStr, ok := m["id"].(string); ok {
				doReq(client, "DELETE", baseURL+"/api/admin/messages/"+idStr, adminKey, nil, nil)
			}
		}
	}

	// 24. GET /api/admin/settings & GET /api/admin/logs & GET /api/admin/export
	code, _, raw = doReq(client, "GET", baseURL+"/api/admin/settings", adminKey, nil, nil)
	assertStatus("24. GET /api/admin/settings (Configuración del servidor)", code, 200, raw)

	code, _, raw = doReq(client, "GET", baseURL+"/api/admin/logs", adminKey, nil, nil)
	assertStatus("25. GET /api/admin/logs (Historial de auditoría en Dokploy DB)", code, 200, raw)

	code, _, raw = doReq(client, "GET", baseURL+"/api/admin/export", adminKey, nil, nil)
	assertStatus("26. GET /api/admin/export (Exportación completa JSON de respaldo)", code, 200, raw)

	// 27. GET /admin/ (Standalone React Admin SPA)
	code, _, raw = doReq(client, "GET", baseURL+"/admin/", "", nil, nil)
	assertStatus("27. GET /admin/ (Panel React Admin compilado servido en /admin/)", code, 200, raw)

	fmt.Println("==================================================")
	fmt.Println("🏆 ¡LAS 27 PRUEBAS END-TO-END DE API + DOKPLOY DB PASARON AL 100%!")
	fmt.Println("==================================================")
}
