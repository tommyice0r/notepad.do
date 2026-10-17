// Runtime configuration for Docker & Dokploy
// This file is overwritten dynamically by entrypoint.sh in production containers
window.__APP_CONFIG__ = window.__APP_CONFIG__ || {
  VITE_API_URL: ""
};
