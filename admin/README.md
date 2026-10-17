# Notepad.do — UI Admin Panel

Panel de Administración Maestro para **Notepad.do**, desarrollado en React 19, Tailwind CSS y Vite.

## 🚀 Despliegue en Dokploy

1. Crea una nueva **Application** en Dokploy.
2. Conecta este repositorio.
3. **Build Type**: `Dockerfile`.
4. **Port**: `80`.
5. En la sección **Environment**, define la URL de tu backend API:
   ```env
   VITE_API_URL=https://api.tu-dominio.com
   ```
   *(La URL se inyecta dinámicamente en tiempo de ejecución al iniciar el contenedor).*
