import axios from "axios";

/**
 * Calculates and normalizes API_BASE for Admin Panel in Dokploy:
 * 1. Checks runtime window.__APP_CONFIG__.VITE_API_URL
 * 2. Checks build-time import.meta.env.VITE_API_URL
 * 3. Normalizes trailing slashes and ensures /api prefix
 * 4. Fallback for local development or same-host deployment
 */
export function getAdminApiBase() {
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

  if (
    typeof window !== "undefined" &&
    (window.location.port === "5173" || window.location.port === "5174")
  ) {
    return "http://localhost:8080/api";
  }

  return "/api";
}

export const API_BASE = getAdminApiBase();

export const PUBLIC_SITE_ORIGIN =
  import.meta.env.VITE_PUBLIC_SITE_URL ||
  (typeof window !== "undefined" && (window.location.port === "5174" || window.location.port === "8080")
    ? "http://localhost:5173"
    : window.location.origin);

const api = axios.create({
  baseURL: API_BASE,
  timeout: 25000,
});

export function getSavedAdminKey() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("notepad_admin_key") ||
    sessionStorage.getItem("notepad_admin_key") ||
    ""
  );
}

export function saveAdminKey(key, remember = true) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("notepad_admin_key", key);
  if (remember) {
    localStorage.setItem("notepad_admin_key", key);
  }
}

export function clearAdminKey() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("notepad_admin_key");
  localStorage.removeItem("notepad_admin_key");
}

api.interceptors.request.use((config) => {
  const adminKey = getSavedAdminKey();
  if (adminKey && !config.headers["X-Admin-Key"]) {
    config.headers["X-Admin-Key"] = adminKey;
  }
  return config;
});

export default api;
