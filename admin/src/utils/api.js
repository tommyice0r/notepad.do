import axios from "axios";

// Connect seamlessly to the same Go server whether hosted at :8080/admin/ or running in Vite dev mode
export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && (window.location.port === "5173" || window.location.port === "5174")
    ? "http://localhost:8080/api"
    : "/api");

export const PUBLIC_SITE_ORIGIN =
  import.meta.env.VITE_PUBLIC_SITE_URL ||
  (typeof window !== "undefined" && (window.location.port === "5174" || window.location.port === "8080")
    ? "http://localhost:5173"
    : window.location.origin);

const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
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
