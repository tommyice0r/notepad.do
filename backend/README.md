# Notepad.do — Backend API

Servidor API de alto rendimiento para **Notepad.do**, desarrollado en **Go (Chi v5)** con **PostgreSQL (GORM)**, cifrado Bcrypt, rate limiting y endpoints administrativos protegidos.

## 🚀 Despliegue en Dokploy

1. Crea una nueva **Application** en Dokploy.
2. Conecta este repositorio.
3. **Build Type**: `Dockerfile`.
4. **Port**: `8080`.
5. En la sección **Environment**, configura las variables del servidor:
   ```env
   DATABASE_URL=postgres://usuario:password@host:5432/nombre_db?sslmode=require
   ADMIN_API_KEY=TommyAdminSecret2026!
   PORT=8080
   CORS_ORIGINS=*
   ```

## 🗄️ Migración de Base de Datos

Para inicializar las tablas de PostgreSQL remotas:
```bash
go run scripts/migrate.go "postgres://usuario:password@host:5432/nombre_db?sslmode=require"
```
