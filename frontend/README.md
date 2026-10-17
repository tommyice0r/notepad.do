# Notepad.do — UI Frontend

Frontend público de **Notepad.do**, el bloc de notas web instantáneo con guardado automático, cifrado de notas con contraseña, compatibilidad AdSense y dark theme de alto contraste.

## 🚀 Despliegue en Dokploy

1. Crea una nueva **Application** en Dokploy.
2. Conecta este repositorio.
3. **Build Type**: `Dockerfile`.
4. **Port**: `80`.
5. En la sección **Environment**, define la URL de tu API del servidor:
   ```env
   VITE_API_URL=https://api.tu-dominio.com
   ```
   *(La URL se normaliza e inyecta dinámicamente en tiempo de ejecución al iniciar el contenedor).*
