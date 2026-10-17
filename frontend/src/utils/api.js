import axios from "axios";

/**
 * Normalizes and calculates the API Base URL.
 * Supports:
 * 1. Dokploy Runtime Environment: window.__APP_CONFIG__.VITE_API_URL
 * 2. Vite Build-Time Environment: import.meta.env.VITE_API_URL
 * 3. Localhost dev server fallback (ports 5173 / 5174 / 3000)
 * 4. Automatic normalization: accepts "https://api.domain.com", "https://api.domain.com/", "https://api.domain.com/api"
 *    and ensures it routes cleanly to the backend endpoints.
 */
export function getApiBaseUrl() {
  const runtimeUrl = typeof window !== "undefined" && window.__APP_CONFIG__?.VITE_API_URL;
  const buildTimeUrl = import.meta.env.VITE_API_URL;
  const raw = (runtimeUrl || buildTimeUrl || "").trim();

  if (raw) {
    let clean = raw.replace(/\/+$/, "");
    if (!clean.endsWith("/api")) {
      clean += "/api";
    }
    return clean;
  }

  // Local development fallback
  if (
    typeof window !== "undefined" &&
    (window.location.port === "5173" || window.location.port === "5174")
  ) {
    return "http://localhost:8080/api";
  }

  // Production default on same origin
  return "/api";
}

export const API_BASE = getApiBaseUrl();

// Configured Axios client
const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

// Request interceptor to attach admin key or note password if stored in session
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const adminKey =
      sessionStorage.getItem("notepad_admin_key") ||
      localStorage.getItem("notepad_admin_key");
    if (adminKey && !config.headers["X-Admin-Key"]) {
      config.headers["X-Admin-Key"] = adminKey;
    }
  }
  return config;
});

export default api;
