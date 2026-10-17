import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configured with base '/admin/' so it works seamlessly served directly by the Go server on :8080/admin/
// and also works in standalone Vite dev mode on :5174 with API proxy to :8080
export default defineConfig({
  base: '/admin/',
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
