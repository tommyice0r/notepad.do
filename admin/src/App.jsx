import { useState, useEffect, useMemo } from "react";
import api, {
  getSavedAdminKey,
  saveAdminKey,
  clearAdminKey,
  getAdminApiBase,
  getCustomApiOverride,
  setCustomApiOverride,
  PUBLIC_SITE_ORIGIN
} from "./utils/api";
import { scanAllNotesGlobal } from "./utils/patternScanner";
import PasswordModal from "./components/PasswordModal";
import CreateNoteModal from "./components/CreateNoteModal";
import NoteInspectorModal from "./components/NoteInspectorModal";
import {
  Shield, KeyRound, Lock, Unlock, FileText, DollarSign,
  CheckCircle2, Search, Copy, Check, RefreshCw, LogOut,
  AlertCircle, ExternalLink, Plus, Trash2, Eye, EyeOff,
  Pin, CreditCard, User, Globe, Database, Settings,
  MessageSquare, Activity, Download, DownloadCloud,
  Sparkles, FolderArchive, CheckSquare, Square, RotateCcw,
  Server, Link2
} from "lucide-react";

export default function App() {
  const [adminKey, setAdminKey] = useState(() => getSavedAdminKey());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [currentApiEndpoint, setCurrentApiEndpoint] = useState(() => getAdminApiBase());
  const [showEndpointConfig, setShowEndpointConfig] = useState(false);
  const [customEndpointInput, setCustomEndpointInput] = useState(() => getCustomApiOverride());

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState("notes"); // "dashboard" | "notes" | "vault" | "payments" | "messages" | "settings"

  // Server Data States
  const [stats, setStats] = useState({
    total_notes: 0,
    deleted_notes: 0,
    protected_notes: 0,
    public_notes: 0,
    pinned_notes: 0,
    total_views: 0,
    total_bytes: 0,
    paid_unlocks: 0,
    pending_payments: 0,
    total_revenue: 0,
    unread_messages: 0,
    total_messages: 0,
    unlock_price_usd: 500,
    uptime_seconds: 0
  });
  const [notes, setNotes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState({
    unlock_price_usd: "500",
    scraper_enabled: "true",
    maintenance_mode: "false",
    adsense_enabled: "true",
    max_note_length: "500000",
    site_announcement: ""
  });
  const [serverInfo, setServerInfo] = useState({});

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Notes Manager Filters & States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "protected" | "public" | "pinned" | "sensitive" | "trash"
  const [sortBy, setSortBy] = useState("updated_desc"); // "updated_desc" | "created_desc" | "views_desc" | "size_desc" | "slug_asc"
  const [showPasswordsPlain, setShowPasswordsPlain] = useState(true);
  const [selectedSlugs, setSelectedSlugs] = useState([]);
  const [bulkPassword, setBulkPassword] = useState("");

  // Vault Sub-Tab
  const [vaultTab, setVaultTab] = useState("note_locks"); // "note_locks" | "text_passwords" | "cards" | "users" | "proxies" | "crypto_keys"

  // Modals State
  const [inspectingNote, setInspectingNote] = useState(null);
  const [passwordModalNote, setPasswordModalNote] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalMode, setCreateModalMode] = useState("create");

  // Toast helper
  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Fetch all Admin data
  const fetchAllAdminData = async (keyToUse) => {
    const key = keyToUse || adminKey;
    if (!key) return;

    setLoading(true);
    setLoginError("");
    const headers = { "X-Admin-Key": key };

    try {
      const [statsRes, notesRes, paymentsRes, messagesRes, logsRes, settingsRes] = await Promise.all([
        api.get("/admin/stats", { headers }),
        api.get("/admin/notes?include_deleted=true", { headers }),
        api.get("/admin/payments", { headers }),
        api.get("/admin/messages", { headers }),
        api.get("/admin/logs", { headers }),
        api.get("/admin/settings", { headers })
      ]);

      setStats(statsRes.data || {});
      setNotes(Array.isArray(notesRes.data) ? notesRes.data : []);
      setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
      setMessages(Array.isArray(messagesRes.data) ? messagesRes.data : []);
      setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
      if (settingsRes.data?.settings) {
        setSettings((prev) => ({ ...prev, ...settingsRes.data.settings }));
      }
      if (settingsRes.data?.server_info) {
        setServerInfo(settingsRes.data.server_info);
      }

      saveAdminKey(key, rememberSession);
      setAdminKey(key);
      setIsAuthenticated(true);
    } catch (err) {
      if (err.response?.status === 401) {
        setLoginError("Clave maestra de administración incorrecta.");
        setIsAuthenticated(false);
        clearAdminKey();
      } else {
        const endpoint = getAdminApiBase();
        const msg = err.response?.data?.error || err.message || "Error de red/CORS";
        setLoginError(`No se pudo conectar con el servidor Go en ${endpoint} (${msg}). Verifica que el backend esté en ejecución y permita CORS.`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey) {
      fetchAllAdminData(adminKey);
    }
  }, []);

  // Global intelligence scan across all active notes
  const activeNotes = useMemo(() => notes.filter((n) => !n.is_deleted), [notes]);
  const trashedNotes = useMemo(() => notes.filter((n) => n.is_deleted), [notes]);
  const globalScan = useMemo(() => scanAllNotesGlobal(activeNotes), [activeNotes]);

  // Filtered & Sorted Notes
  const filteredNotes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    let list = notes.filter((n) => {
      if (statusFilter === "trash") {
        if (!n.is_deleted) return false;
      } else {
        if (n.is_deleted) return false;
      }

      if (statusFilter === "protected" && !n.has_password) return false;
      if (statusFilter === "public" && n.has_password) return false;
      if (statusFilter === "pinned" && !n.is_pinned) return false;
      if (statusFilter === "sensitive") {
        const scan = globalScan.bySlug[n.slug];
        if (!scan || scan.totalFindings === 0) return false;
      }

      if (!q) return true;
      const matchSlug = (n.slug || "").toLowerCase().includes(q);
      const matchContent = (n.content || "").toLowerCase().includes(q);
      const matchPwd = (n.password_plain || "").toLowerCase().includes(q);
      const matchIp = (n.last_ip || "").toLowerCase().includes(q);
      const matchAdminNotes = (n.admin_notes || "").toLowerCase().includes(q);
      return matchSlug || matchContent || matchPwd || matchIp || matchAdminNotes;
    });

    list.sort((a, b) => {
      if (statusFilter !== "trash" && a.is_pinned !== b.is_pinned) {
        return a.is_pinned ? -1 : 1;
      }
      if (sortBy === "created_desc") {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      if (sortBy === "views_desc") {
        return (b.views_count || 0) - (a.views_count || 0);
      }
      if (sortBy === "size_desc") {
        return (b.size_bytes || 0) - (a.size_bytes || 0);
      }
      if (sortBy === "slug_asc") {
        return (a.slug || "").localeCompare(b.slug || "");
      }
      return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
    });

    return list;
  }, [notes, searchTerm, statusFilter, sortBy, globalScan]);

  // --- AUTH HANDLERS ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginInput.trim()) return;
    fetchAllAdminData(loginInput.trim());
  };

  const handleLogout = () => {
    clearAdminKey();
    setAdminKey("");
    setIsAuthenticated(false);
    setNotes([]);
    setLoginInput("");
  };

  // --- CRUD & ADMIN ACTIONS ---
  const handleSetNotePassword = async (slug, password) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/notes/${encodeURIComponent(slug)}/password`, {
        password,
        unlock: false
      });
      showToast(`Contraseña actualizada para /${slug}`);
      setPasswordModalNote(null);
      await fetchAllAdminData();
    } catch (err) {
      showToast(err.response?.data?.error || "Error al actualizar contraseña", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlockNote = async (slug) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/notes/${encodeURIComponent(slug)}/password`, {
        password: "",
        unlock: true
      });
      showToast(`Nota /${slug} desbloqueada (contraseña eliminada)`);
      setPasswordModalNote(null);
      await fetchAllAdminData();
    } catch (err) {
      showToast(err.response?.data?.error || "Error al desbloquear nota", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateNote = async (payload) => {
    setActionLoading(true);
    try {
      await api.post("/admin/notes", payload);
      showToast(`Nota /${payload.slug} creada exitosamente`);
      setCreateModalOpen(false);
      await fetchAllAdminData();
    } catch (err) {
      showToast(err.response?.data?.error || "Error al crear la nota", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleScrapeImport = async ({ slug, password }) => {
    setActionLoading(true);
    try {
      await api.post("/admin/scrape-import", { slug, password });
      showToast(`Nota /${slug} importada desde notepad.pw`);
      setCreateModalOpen(false);
      await fetchAllAdminData();
    } catch (err) {
      showToast(err.response?.data?.error || "No se pudo importar desde notepad.pw", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveInspectedNote = async (originalSlug, payload) => {
    setActionLoading(true);
    try {
      const res = await api.put(`/admin/notes/${encodeURIComponent(originalSlug)}`, payload);
      showToast(`Cambios guardados en /${res.data.slug}`);
      setInspectingNote(null);
      await fetchAllAdminData();
    } catch (err) {
      showToast(err.response?.data?.error || "Error al guardar cambios", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePin = async (note) => {
    try {
      await api.put(`/admin/notes/${encodeURIComponent(note.slug)}`, {
        is_pinned: !note.is_pinned
      });
      showToast(note.is_pinned ? `Nota /${note.slug} desfijada` : `Nota /${note.slug} fijada arriba`);
      await fetchAllAdminData();
    } catch (err) {
      showToast("No se pudo cambiar el estado fijado", "error");
    }
  };

  const handleDeleteNote = async (slug, permanent = false) => {
    setActionLoading(true);
    try {
      await api.delete(`/admin/notes/${encodeURIComponent(slug)}?permanent=${permanent}`);
      showToast(permanent ? `Nota /${slug} eliminada permanentemente` : `Nota /${slug} enviada a la papelera`);
      setInspectingNote(null);
      setSelectedSlugs((prev) => prev.filter((s) => s !== slug));
      await fetchAllAdminData();
    } catch (err) {
      showToast("Error al eliminar la nota", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreNote = async (slug) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/notes/${encodeURIComponent(slug)}/restore`);
      showToast(`Nota /${slug} restaurada de la papelera`);
      setInspectingNote(null);
      await fetchAllAdminData();
    } catch (err) {
      showToast("Error al restaurar la nota", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // --- BULK ACTIONS ---
  const toggleSelectSlug = (slug) => {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const toggleSelectAllFiltered = () => {
    if (selectedSlugs.length === filteredNotes.length && filteredNotes.length > 0) {
      setSelectedSlugs([]);
    } else {
      setSelectedSlugs(filteredNotes.map((n) => n.slug));
    }
  };

  const executeBulkAction = async (action) => {
    if (selectedSlugs.length === 0) return;
    if (action === "lock" && !bulkPassword.trim()) {
      showToast("Escribe una contraseña para el bloqueo masivo", "error");
      return;
    }

    setActionLoading(true);
    try {
      await api.post("/admin/notes/bulk", {
        slugs: selectedSlugs,
        action,
        password: bulkPassword.trim()
      });
      showToast(`Acción masiva (${action}) aplicada a ${selectedSlugs.length} notas`);
      setSelectedSlugs([]);
      setBulkPassword("");
      await fetchAllAdminData();
    } catch (err) {
      showToast(err.response?.data?.error || "Error en acción masiva", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // --- PAYMENTS, MESSAGES, SETTINGS & EXPORT ---
  const handleApprovePayment = async (id) => {
    try {
      await api.post(`/admin/payments/${id}/approve`);
      showToast("Pago aprobado y nota desbloqueada automáticamente");
      await fetchAllAdminData();
    } catch (err) {
      showToast("Error al aprobar pago", "error");
    }
  };

  const handleDeletePayment = async (id) => {
    try {
      await api.delete(`/admin/payments/${id}`);
      showToast("Registro de pago eliminado");
      await fetchAllAdminData();
    } catch (err) {
      showToast("Error al eliminar pago", "error");
    }
  };

  const handleUpdateMessageStatus = async (id, status) => {
    try {
      await api.put(`/admin/messages/${id}`, { status });
      showToast(`Mensaje marcado como ${status}`);
      await fetchAllAdminData();
    } catch (err) {
      showToast("Error al actualizar mensaje", "error");
    }
  };

  const handleDeleteMessage = async (id) => {
    try {
      await api.delete(`/admin/messages/${id}`);
      showToast("Mensaje eliminado");
      await fetchAllAdminData();
    } catch (err) {
      showToast("Error al eliminar mensaje", "error");
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.put("/admin/settings", settings);
      showToast("Configuración global de Notepad.do guardada");
      await fetchAllAdminData();
    } catch (err) {
      showToast("Error al guardar configuración", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      await api.delete("/admin/logs");
      showToast("Historial de auditoría limpiado");
      await fetchAllAdminData();
    } catch (err) {
      showToast("Error al limpiar registros", "error");
    }
  };

  const handleExportDatabase = async (format = "json") => {
    try {
      const res = await api.get("/admin/export");
      if (format === "csv") {
        const rows = [
          ["Slug", "HasPassword", "PasswordPlain", "PasswordHash", "Views", "SizeBytes", "UpdatedAt", "Content"]
        ];
        for (const n of res.data.notes || []) {
          rows.push([
            n.slug,
            n.has_password ? "YES" : "NO",
            n.password_plain || "",
            n.password_hash || "",
            String(n.views_count || 0),
            String(n.size_bytes || 0),
            n.updated_at || "",
            `"${(n.content || "").replace(/"/g, '""')}"`
          ]);
        }
        const csvContent = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `notepad-do-notas-passwords-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `notepad-do-backup-completo-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      showToast(`Exportación ${format.toUpperCase()} descargada`);
    } catch (err) {
      showToast("Error al exportar la base de datos", "error");
    }
  };

  // --- LOGIN VIEW ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[#060607]">
        <div className="w-full max-w-md pf-panel p-7 sm:p-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 flex items-center justify-center text-[#FF9F0A] mb-4 shadow-[0_8px_28px_rgba(255,159,10,0.2)]">
            <Shield className="w-8 h-8" />
          </div>

          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#FF9F0A] mb-1">
            Notepad.do · Servidor Go
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight text-center mb-1">
            Centro de Administración Master
          </h1>
          <p className="text-xs text-gray-400 text-center mb-6 leading-relaxed">
            Control total de todas las notas, contraseñas en texto plano, desbloqueos, inteligencia de datos y configuración del servidor.
          </p>

          <form method="post" onSubmit={handleLogin} className="w-full space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-key-input" className="text-xs font-bold text-gray-300">
                Clave Maestra de Administrador (ADMIN_API_KEY)
              </label>
              <div className="relative flex items-center">
                <input
                  id="admin-key-input"
                  name="admin_key"
                  type={showLoginPwd ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="Introduce la clave maestra..."
                  className="w-full bg-[#0E0E11] border border-white/[0.1] rounded-xl pl-4 pr-11 py-3 text-sm text-white placeholder-gray-500 font-mono-code focus:border-[#FF9F0A]"
                  autoFocus
                />
                <button
                  type="button"
                  aria-pressed={showLoginPwd}
                  aria-label={showLoginPwd ? "Ocultar clave" : "Mostrar clave"}
                  onClick={() => setShowLoginPwd(!showLoginPwd)}
                  className="absolute right-3 p-1.5 text-gray-400 hover:text-white rounded-lg"
                >
                  {showLoginPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-gray-200 select-none">
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#FF9F0A]"
                />
                <span>Mantener sesión iniciada</span>
              </label>
            </div>

            {loginError && (
              <div role="alert" aria-live="polite" className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-[#FF6961] font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full pf-btn-primary py-3 text-sm font-extrabold flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              <span>{loading ? "Verificando acceso..." : "Acceder al Panel Master"}</span>
            </button>

            <div className="pt-2 border-t border-white/[0.08] w-full">
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <div className="flex items-center gap-1.5 truncate mr-2">
                  <Server className="w-3.5 h-3.5 text-[#FF9F0A] shrink-0" />
                  <span className="text-gray-400">API:</span>
                  <span className="font-mono text-gray-300 truncate" title={currentApiEndpoint}>
                    {currentApiEndpoint}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEndpointConfig(!showEndpointConfig)}
                  className="text-[#FF9F0A] hover:underline text-[11px] font-semibold shrink-0"
                >
                  {showEndpointConfig ? "Cerrar" : "Cambiar"}
                </button>
              </div>

              {showEndpointConfig && (
                <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-left space-y-2">
                  <label className="text-[11px] font-bold text-gray-300 block">
                    URL del Backend Go:
                  </label>
                  <input
                    type="url"
                    value={customEndpointInput}
                    onChange={(e) => setCustomEndpointInput(e.target.value)}
                    placeholder="https://secure.notepad.do"
                    className="w-full bg-[#0E0E11] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-[#FF9F0A]"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomApiOverride(customEndpointInput);
                        const updated = getAdminApiBase();
                        setCurrentApiEndpoint(updated);
                        setShowEndpointConfig(false);
                        setLoginError("");
                      }}
                      className="px-3 py-1 bg-[#FF9F0A] text-black text-xs font-bold rounded-lg hover:bg-[#FFB340] transition-colors"
                    >
                      Guardar URL
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomApiOverride("");
                        setCustomEndpointInput("");
                        const updated = getAdminApiBase();
                        setCurrentApiEndpoint(updated);
                        setShowEndpointConfig(false);
                      }}
                      className="px-2.5 py-1 bg-white/[0.05] text-gray-400 text-xs rounded-lg hover:text-white transition-colors"
                    >
                      Restablecer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  const protectedNotesList = activeNotes.filter((n) => n.has_password);

  return (
    <div className="min-h-screen w-full bg-[#060607] text-[#EDEDED] font-manrope flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl border shadow-2xl text-xs font-extrabold flex items-center gap-2.5 transition-all ${
            toast.type === "error"
              ? "bg-[#1F1214] border-red-500/40 text-[#FF6961]"
              : "bg-[#121F17] border-emerald-500/40 text-[#30D158]"
          }`}
        >
          {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Top Master Header */}
      <header className="sticky top-0 z-30 bg-[#0A0A0C]/90 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 flex items-center justify-center text-[#FF9F0A]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Notepad.do <span className="text-[#FF9F0A]">Admin Master</span>
                </h1>
                <span className="pf-pill pf-pill-ok text-[10px]">Go Server :8080</span>
              </div>
              <p className="text-[11px] text-gray-400">
                {stats.total_notes} notas activas · {stats.protected_notes} con contraseña · {globalScan.cards.length + globalScan.passwords.length} credenciales/tarjetas detectadas
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCreateModalMode("create");
                setCreateModalOpen(true);
              }}
              className="pf-btn-primary px-3.5 py-2 text-xs font-extrabold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Nota</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCreateModalMode("import");
                setCreateModalOpen(true);
              }}
              className="pf-btn-secondary px-3 py-2 text-xs flex items-center gap-1.5"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-[#FF9F0A]" />
              <span className="hidden sm:inline">Importar notepad.pw</span>
            </button>

            <button
              type="button"
              onClick={() => handleExportDatabase("csv")}
              className="pf-btn-secondary px-3 py-2 text-xs flex items-center gap-1.5"
              title="Descargar CSV con todas las notas y sus contraseñas"
            >
              <Download className="w-3.5 h-3.5 text-[#30D158]" />
              <span className="hidden md:inline">Exportar Claves CSV</span>
            </button>

            <button
              type="button"
              onClick={() => fetchAllAdminData()}
              disabled={loading}
              className="pf-btn-secondary px-3 py-2 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#FF9F0A]" : ""}`} />
              <span className="hidden sm:inline">Sincronizar</span>
            </button>

            <a
              href={PUBLIC_SITE_ORIGIN}
              target="_blank"
              rel="noreferrer"
              className="pf-btn-secondary px-3 py-2 text-xs flex items-center gap-1.5"
            >
              <span>Ir a Notepad.do</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </a>

            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-[#FF6961] border border-red-500/25 text-xs font-bold"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center gap-1.5 overflow-x-auto pb-2.5">
          {[
            { id: "notes", label: `Todas las Notas y Contraseñas (${activeNotes.length})`, icon: FileText },
            { id: "dashboard", label: "Dashboard & Resumen", icon: Activity },
            {
              id: "vault",
              label: `Bóveda de Claves & Tarjetas (${protectedNotesList.length + globalScan.passwords.length + globalScan.cards.length})`,
              icon: KeyRound
            },
            { id: "payments", label: `Pagos BTC (${payments.length})`, icon: DollarSign },
            {
              id: "messages",
              label: `Soporte / DMCA (${stats.unread_messages || 0} nuevos)`,
              icon: MessageSquare
            },
            { id: "settings", label: "Configuración, Logs & Backup", icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap flex items-center gap-2 transition-all ${
                  isActive
                    ? "bg-[#FF9F0A] text-black shadow-[0_4px_16px_rgba(255,159,10,0.3)]"
                    : "bg-[#141416] text-gray-400 hover:text-white border border-white/[0.05]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-[1440px] w-full mx-auto flex-1 p-4 sm:p-6 space-y-6">
        {/* =========================================================
            TAB 1: TODAS LAS NOTAS Y CONTRASEÑAS (NOTES & PASSWORDS)
           ========================================================= */}
        {activeTab === "notes" && (
          <div className="space-y-4">
            {/* Quick Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`pf-panel p-4 text-left transition-all ${statusFilter === "all" ? "border-[#FF9F0A]" : ""}`}
              >
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                  Total Notas Activas
                </span>
                <span className="text-2xl font-extrabold text-white mt-1 block">{activeNotes.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("protected")}
                className={`pf-panel p-4 text-left transition-all ${statusFilter === "protected" ? "border-[#FF6961]" : ""}`}
              >
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF6961] block">
                  Con Contraseña 🔒
                </span>
                <span className="text-2xl font-extrabold text-[#FF6961] mt-1 block">{protectedNotesList.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("public")}
                className={`pf-panel p-4 text-left transition-all ${statusFilter === "public" ? "border-[#30D158]" : ""}`}
              >
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#30D158] block">
                  Públicas Abiertas 🌐
                </span>
                <span className="text-2xl font-extrabold text-[#30D158] mt-1 block">
                  {activeNotes.length - protectedNotesList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("sensitive")}
                className={`pf-panel p-4 text-left transition-all ${statusFilter === "sensitive" ? "border-[#FF9F0A]" : ""}`}
              >
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF9F0A] block">
                  Con Datos / Tarjetas 💳
                </span>
                <span className="text-2xl font-extrabold text-[#FF9F0A] mt-1 block">
                  {activeNotes.filter((n) => (globalScan.bySlug[n.slug]?.totalFindings || 0) > 0).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("pinned")}
                className={`pf-panel p-4 text-left transition-all ${statusFilter === "pinned" ? "border-[#FF9F0A]" : ""}`}
              >
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                  Notas Fijadas 📌
                </span>
                <span className="text-2xl font-extrabold text-white mt-1 block">
                  {activeNotes.filter((n) => n.is_pinned).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("trash")}
                className={`pf-panel p-4 text-left transition-all ${statusFilter === "trash" ? "border-red-500" : ""}`}
              >
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                  Papelera 🗑️
                </span>
                <span className="text-2xl font-extrabold text-gray-300 mt-1 block">{trashedNotes.length}</span>
              </button>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="pf-panel p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  aria-label="Buscar por slug, contenido, contraseña de nota o IP"
                  placeholder="Buscar por /slug, texto dentro de la nota, contraseña de bloqueo o IP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0E0E11] border border-white/[0.1] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 font-mono-code focus:border-[#FF9F0A]"
                />
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filtrar notas por estado"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#0E0E11] border border-white/[0.1] rounded-xl px-3 py-2.5 text-xs font-bold text-white"
                >
                  <option value="all">Todas las activas ({activeNotes.length})</option>
                  <option value="protected">Protegidas con Contraseña ({protectedNotesList.length})</option>
                  <option value="public">Públicas ({activeNotes.length - protectedNotesList.length})</option>
                  <option value="sensitive">Con Tarjetas / Claves Detectadas</option>
                  <option value="pinned">Fijadas (Pinned)</option>
                  <option value="trash">Papelera ({trashedNotes.length})</option>
                </select>

                <select
                  aria-label="Ordenar notas"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#0E0E11] border border-white/[0.1] rounded-xl px-3 py-2.5 text-xs font-bold text-white"
                >
                  <option value="updated_desc">Más recientes</option>
                  <option value="created_desc">Fecha de creación</option>
                  <option value="views_desc">Más vistas</option>
                  <option value="size_desc">Mayor tamaño</option>
                  <option value="slug_asc">Slug (A-Z)</option>
                </select>

                <button
                  type="button"
                  onClick={() => setShowPasswordsPlain(!showPasswordsPlain)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold border flex items-center gap-1.5 transition-colors ${
                    showPasswordsPlain
                      ? "bg-[#FF9F0A]/15 border-[#FF9F0A]/40 text-[#FF9F0A]"
                      : "bg-[#0E0E11] border-white/[0.1] text-gray-400"
                  }`}
                >
                  {showPasswordsPlain ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{showPasswordsPlain ? "Claves Visibles" : "Claves Ocultas"}</span>
                </button>
              </div>
            </div>

            {/* Bulk Actions Bar when items are selected */}
            {selectedSlugs.length > 0 && (
              <div className="pf-panel p-3.5 bg-[#1B1710] border-[#FF9F0A]/40 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#FF9F0A]">
                  <CheckSquare className="w-4 h-4" />
                  <span>{selectedSlugs.length} nota(s) seleccionada(s)</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => executeBulkAction("unlock")}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-[#30D158] border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Quitar Contraseñas (Desbloquear)</span>
                  </button>

                  <div className="flex items-center gap-1 bg-[#0E0E11] border border-white/[0.1] rounded-xl px-2 py-1">
                    <input
                      type="text"
                      placeholder="Nueva clave grupal..."
                      value={bulkPassword}
                      onChange={(e) => setBulkPassword(e.target.value)}
                      className="bg-transparent text-xs text-white font-mono-code px-2 py-0.5 focus:outline-none w-36"
                    />
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => executeBulkAction("lock")}
                      className="px-2.5 py-1 rounded-lg bg-[#FF9F0A] text-black text-[11px] font-extrabold"
                    >
                      Bloquear
                    </button>
                  </div>

                  {statusFilter === "trash" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => executeBulkAction("restore")}
                        className="pf-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#30D158]" />
                        <span>Restaurar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => executeBulkAction("permanent_delete")}
                        className="px-3 py-1.5 rounded-xl bg-red-500/20 text-[#FF6961] border border-red-500/30 text-xs font-extrabold"
                      >
                        Eliminar Definitivo
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => executeBulkAction("delete")}
                      className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-[#FF6961] border border-red-500/30 text-xs font-extrabold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Papelera</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Master Notes Table */}
            <div className="pf-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0E0E11] border-b border-white/[0.08] text-gray-400 font-extrabold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5 w-10">
                        <button
                          type="button"
                          onClick={toggleSelectAllFiltered}
                          aria-label="Seleccionar todas las notas"
                          className="text-gray-400 hover:text-white"
                        >
                          {selectedSlugs.length === filteredNotes.length && filteredNotes.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-[#FF9F0A]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3.5">Nota / Slug</th>
                      <th className="px-4 py-3.5">Contraseña de la Nota</th>
                      <th className="px-4 py-3.5">Contenido Completo & Datos Detectados</th>
                      <th className="px-4 py-3.5">Métricas & Fecha</th>
                      <th className="px-4 py-3.5 text-right">Acciones Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {filteredNotes.map((note) => {
                      const scan = globalScan.bySlug[note.slug] || { counts: {}, totalFindings: 0 };
                      const isSelected = selectedSlugs.includes(note.slug);

                      return (
                        <tr
                          key={note.id || note.slug}
                          className={`hover:bg-white/[0.025] transition-colors ${
                            note.is_pinned ? "bg-[#FF9F0A]/[0.03]" : ""
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="px-4 py-4 align-top">
                            <button
                              type="button"
                              onClick={() => toggleSelectSlug(note.slug)}
                              aria-label={`Seleccionar nota ${note.slug}`}
                              className="text-gray-500 hover:text-white mt-0.5"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#FF9F0A]" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          {/* Slug & Quick Info */}
                          <td className="px-4 py-4 align-top whitespace-nowrap">
                            <div className="flex items-center gap-2 font-mono-code">
                              {note.is_pinned && (
                                <Pin className="w-3.5 h-3.5 text-[#FF9F0A] shrink-0" title="Nota fijada" />
                              )}
                              <button
                                type="button"
                                onClick={() => setInspectingNote(note)}
                                className="text-sm font-bold text-[#FF9F0A] hover:underline text-left"
                              >
                                /{note.slug}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopy(`${PUBLIC_SITE_ORIGIN}/${note.slug}`, `url-${note.slug}`)}
                                title="Copiar enlace de la nota"
                                className="text-gray-500 hover:text-white p-1"
                              >
                                {copiedId === `url-${note.slug}` ? (
                                  <Check className="w-3.5 h-3.5 text-[#30D158]" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <div className="text-[11px] text-gray-500 font-mono-code mt-1 flex items-center gap-2">
                              <span>IP: {note.last_ip || "local"}</span>
                            </div>
                            {note.admin_notes && (
                              <div className="mt-1.5 inline-block px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-[10px] text-amber-300 font-semibold">
                                📌 {note.admin_notes}
                              </div>
                            )}
                          </td>

                          {/* Password Column (Plaintext + Copy + Unlock/Edit) */}
                          <td className="px-4 py-4 align-top whitespace-nowrap">
                            {note.has_password ? (
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="pf-pill pf-pill-danger">
                                    <Lock className="w-3 h-3" />
                                    Protegida
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => handleUnlockNote(note.slug)}
                                    title="Quitar contraseña inmediatamente (Desbloquear)"
                                    className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-[#30D158] border border-emerald-500/30 text-[10px] font-extrabold flex items-center gap-1"
                                  >
                                    <Unlock className="w-2.5 h-2.5" />
                                    <span>Desbloquear</span>
                                  </button>
                                </div>

                                {/* Actual Note Password */}
                                <div className="flex items-center gap-1.5 bg-[#0E0E11] border border-[#FF9F0A]/30 rounded-xl px-2.5 py-1.5 max-w-[260px]">
                                  <KeyRound className="w-3.5 h-3.5 text-[#FF9F0A] shrink-0" />
                                  {note.password_plain ? (
                                    <>
                                      <span className="font-mono-code text-xs font-bold text-white truncate">
                                        {showPasswordsPlain ? note.password_plain : "••••••••••"}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopy(note.password_plain, `pwd-${note.slug}`)}
                                        title="Copiar contraseña en texto plano"
                                        className="ml-auto text-gray-400 hover:text-white p-1 shrink-0"
                                      >
                                        {copiedId === `pwd-${note.slug}` ? (
                                          <Check className="w-3.5 h-3.5 text-[#30D158]" />
                                        ) : (
                                          <Copy className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setPasswordModalNote(note)}
                                      className="text-[11px] text-amber-300 hover:underline truncate text-left"
                                      title={note.password_hash}
                                    >
                                      Hash Bcrypt (Clic para cambiar clave)
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-start gap-1.5">
                                <span className="pf-pill pf-pill-ok">
                                  <Globe className="w-3 h-3" />
                                  Pública (Sin clave)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setPasswordModalNote(note)}
                                  className="text-[11px] font-bold text-gray-400 hover:text-[#FF9F0A] flex items-center gap-1"
                                >
                                  <Lock className="w-3 h-3" />
                                  <span>+ Asignar contraseña</span>
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Full Content Preview & Detected Patterns */}
                          <td className="px-4 py-4 align-top max-w-md">
                            <div
                              onClick={() => setInspectingNote(note)}
                              className="cursor-pointer bg-[#0E0E11] hover:bg-[#16161A] border border-white/[0.06] rounded-xl p-2.5 font-mono-code text-xs text-gray-300 line-clamp-3 whitespace-pre-wrap break-words transition-colors"
                            >
                              {note.content ? (
                                note.content.slice(0, 220) + (note.content.length > 220 ? "..." : "")
                              ) : (
                                <span className="text-gray-600 italic">Nota vacía</span>
                              )}
                            </div>

                            {/* Pattern Badges */}
                            {scan.totalFindings > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                {scan.counts.cards > 0 && (
                                  <span className="px-2 py-0.5 rounded-md bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 text-[#FF9F0A] text-[10px] font-extrabold">
                                    💳 {scan.counts.cards} Tarjeta(s)
                                  </span>
                                )}
                                {scan.counts.passwords > 0 && (
                                  <span className="px-2 py-0.5 rounded-md bg-red-500/15 border border-red-500/30 text-[#FF6961] text-[10px] font-extrabold">
                                    🔑 {scan.counts.passwords} Clave(s) en texto
                                  </span>
                                )}
                                {scan.counts.users > 0 && (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[#30D158] text-[10px] font-extrabold">
                                    👤 {scan.counts.users} Usuario(s)
                                  </span>
                                )}
                                {scan.counts.proxies > 0 && (
                                  <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-extrabold">
                                    🌐 {scan.counts.proxies} Proxy(s)
                                  </span>
                                )}
                                {(scan.counts.crypto > 0 || scan.counts.keys > 0) && (
                                  <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[10px] font-extrabold">
                                    ⚡ {scan.counts.crypto + scan.counts.keys} Crypto/Keys
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Metrics & Timestamp */}
                          <td className="px-4 py-4 align-top whitespace-nowrap font-mono-code text-[11px] text-gray-400">
                            <div className="text-white font-bold">
                              {(note.size_bytes || 0).toLocaleString()} B · {note.line_count || 0} lín.
                            </div>
                            <div>👁️ {note.views_count || 0} vistas</div>
                            <div className="text-gray-500 mt-1">
                              {new Date(note.updated_at || note.created_at).toLocaleString()}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-4 align-top text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInspectingNote(note)}
                                className="pf-btn-primary px-3 py-1.5 text-xs font-extrabold flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ver / Editar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setPasswordModalNote(note)}
                                title="Gestionar contraseña de esta nota"
                                className="pf-btn-secondary p-2 text-xs text-[#FF9F0A]"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleTogglePin(note)}
                                title={note.is_pinned ? "Desfijar nota" : "Fijar nota"}
                                className={`pf-btn-secondary p-2 text-xs ${
                                  note.is_pinned ? "text-[#FF9F0A] border-[#FF9F0A]/40" : "text-gray-400"
                                }`}
                              >
                                <Pin className="w-3.5 h-3.5" />
                              </button>

                              {note.is_deleted ? (
                                <button
                                  type="button"
                                  onClick={() => handleRestoreNote(note.slug)}
                                  title="Restaurar nota"
                                  className="p-2 rounded-xl bg-emerald-500/15 text-[#30D158] border border-emerald-500/30"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(note.slug, false)}
                                  title="Enviar a la papelera"
                                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-[#FF6961] border border-red-500/20"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredNotes.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                          No se encontraron notas con los filtros seleccionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: DASHBOARD & RESUMEN GENERAL
           ========================================================= */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="pf-panel p-5">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span className="font-extrabold uppercase tracking-wider">Total de Notas</span>
                  <FileText className="w-4 h-4 text-[#FF9F0A]" />
                </div>
                <div className="text-3xl font-extrabold text-white">{stats.total_notes}</div>
                <div className="text-[11px] text-gray-500 font-mono-code mt-1">
                  {stats.protected_notes} protegidas · {stats.public_notes} públicas
                </div>
              </div>

              <div className="pf-panel p-5">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span className="font-extrabold uppercase tracking-wider">Contraseñas de Notas</span>
                  <KeyRound className="w-4 h-4 text-[#FF6961]" />
                </div>
                <div className="text-3xl font-extrabold text-[#FF6961]">{protectedNotesList.length}</div>
                <div className="text-[11px] text-gray-500 font-mono-code mt-1">
                  +{globalScan.passwords.length} claves detectadas dentro del texto
                </div>
              </div>

              <div className="pf-panel p-5">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span className="font-extrabold uppercase tracking-wider">Ingresos Desbloqueos BTC</span>
                  <DollarSign className="w-4 h-4 text-[#30D158]" />
                </div>
                <div className="text-3xl font-extrabold text-[#30D158]">
                  ${(stats.total_revenue || 0).toLocaleString()} <span className="text-xs text-gray-400">USD</span>
                </div>
                <div className="text-[11px] text-gray-500 font-mono-code mt-1">
                  {stats.paid_unlocks} pagados · {stats.pending_payments} pendientes
                </div>
              </div>

              <div className="pf-panel p-5">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span className="font-extrabold uppercase tracking-wider">Tráfico & Almacenamiento</span>
                  <Database className="w-4 h-4 text-[#FF9F0A]" />
                </div>
                <div className="text-3xl font-extrabold text-white">
                  {(stats.total_views || 0).toLocaleString()} <span className="text-xs text-gray-400">vistas</span>
                </div>
                <div className="text-[11px] text-gray-500 font-mono-code mt-1">
                  {((stats.total_bytes || 0) / 1024).toFixed(2)} KB almacenados en PostgreSQL
                </div>
              </div>
            </div>

            {/* Direct Password Directory Card */}
            <div className="pf-panel p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#FF9F0A]" />
                    <span>Directorio Rápido de Notas con Contraseña ({protectedNotesList.length})</span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    Listado directo de todas las notas bloqueadas junto con su contraseña en texto plano y acceso inmediato.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("vault")}
                  className="pf-btn-secondary px-3.5 py-2 text-xs"
                >
                  Abrir Bóveda Completa →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {protectedNotesList.map((n) => (
                  <div
                    key={n.slug}
                    className="pf-well p-4 flex flex-col justify-between gap-3 border border-white/[0.08]"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setInspectingNote(n)}
                        className="text-sm font-extrabold text-[#FF9F0A] font-mono-code hover:underline"
                      >
                        /{n.slug}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUnlockNote(n.slug)}
                        className="text-[11px] font-bold text-[#30D158] hover:underline flex items-center gap-1"
                      >
                        <Unlock className="w-3 h-3" />
                        Desbloquear
                      </button>
                    </div>

                    <div className="bg-[#141416] border border-white/[0.06] rounded-xl p-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 block font-bold">
                          Contraseña:
                        </span>
                        <span className="text-xs font-mono-code font-bold text-white break-all">
                          {n.password_plain || "Hash Bcrypt (Clic en Editar)"}
                        </span>
                      </div>
                      {n.password_plain ? (
                        <button
                          type="button"
                          onClick={() => handleCopy(n.password_plain, `dash-pwd-${n.slug}`)}
                          className="pf-btn-secondary px-2.5 py-1.5 text-[11px] shrink-0"
                        >
                          {copiedId === `dash-pwd-${n.slug}` ? "Copiada" : "Copiar"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPasswordModalNote(n)}
                          className="pf-btn-secondary px-2.5 py-1.5 text-[11px] shrink-0 text-[#FF9F0A]"
                        >
                          Asignar
                        </button>
                      )}
                    </div>

                    <div className="text-[11px] text-gray-400 font-mono-code truncate">
                      {n.content || "Sin contenido"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: BÓVEDA DE CONTRASEÑAS Y DATOS DETECTADOS (VAULT)
           ========================================================= */}
        {activeTab === "vault" && (
          <div className="space-y-4">
            <div className="pf-panel p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-white">
                  Bóveda Central de Contraseñas, Tarjetas y Credenciales
                </h2>
                <p className="text-xs text-gray-400">
                  Extracción automática en tiempo real de todas las contraseñas de notas y datos sensibles almacenados en Notepad.do.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "note_locks", label: `Claves de Notas (${globalScan.noteLocks.length})` },
                  { id: "text_passwords", label: `Claves en Texto (${globalScan.passwords.length})` },
                  { id: "cards", label: `Tarjetas CC (${globalScan.cards.length})` },
                  { id: "users", label: `Usuarios/Emails (${globalScan.users.length})` },
                  { id: "proxies", label: `Proxies (${globalScan.proxies.length})` },
                  { id: "crypto_keys", label: `Crypto & API Keys (${globalScan.crypto.length + globalScan.keys.length})` }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setVaultTab(t.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all ${
                      vaultTab === t.id
                        ? "bg-[#FF9F0A] text-black"
                        : "bg-[#0E0E11] text-gray-400 hover:text-white border border-white/[0.06]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pf-panel overflow-hidden">
              {vaultTab === "note_locks" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0E0E11] border-b border-white/[0.08] text-gray-400 uppercase text-[10px] font-extrabold">
                      <tr>
                        <th className="px-6 py-3.5">Nota (/slug)</th>
                        <th className="px-6 py-3.5">Contraseña en Texto Plano</th>
                        <th className="px-6 py-3.5">Hash Bcrypt Almacenado</th>
                        <th className="px-6 py-3.5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05] font-mono-code">
                      {globalScan.noteLocks.map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="px-6 py-4 text-[#FF9F0A] font-bold">/{item.slug}</td>
                          <td className="px-6 py-4">
                            {item.password_plain ? (
                              <span className="px-2.5 py-1 rounded-lg bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 text-white font-bold">
                                {item.password_plain}
                              </span>
                            ) : (
                              <span className="text-amber-300/80 italic">Sólo Hash Bcrypt</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{item.password_hash}</td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {item.password_plain && (
                              <button
                                type="button"
                                onClick={() => handleCopy(item.password_plain, `vl-pwd-${idx}`)}
                                className="pf-btn-secondary px-3 py-1.5 text-xs"
                              >
                                {copiedId === `vl-pwd-${idx}` ? "Copiada" : "Copiar Clave"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const found = notes.find((n) => n.slug === item.slug);
                                if (found) setPasswordModalNote(found);
                              }}
                              className="pf-btn-secondary px-3 py-1.5 text-xs text-[#FF9F0A]"
                            >
                              Cambiar / Desbloquear
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {vaultTab === "text_passwords" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono-code">
                    <thead className="bg-[#0E0E11] border-b border-white/[0.08] text-gray-400 uppercase text-[10px] font-manrope font-extrabold">
                      <tr>
                        <th className="px-6 py-3.5">Nota Origen</th>
                        <th className="px-6 py-3.5">Contraseña Extraída</th>
                        <th className="px-6 py-3.5">Línea Original</th>
                        <th className="px-6 py-3.5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {globalScan.passwords.map((p, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="px-6 py-3.5 text-[#FF9F0A] font-bold">/{p.slug}</td>
                          <td className="px-6 py-3.5 text-white font-bold">{p.value}</td>
                          <td className="px-6 py-3.5 text-gray-400">{p.full}</td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleCopy(p.value, `vp-${idx}`)}
                              className="pf-btn-secondary px-3 py-1 text-xs"
                            >
                              {copiedId === `vp-${idx}` ? "Copiada" : "Copiar"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {vaultTab === "cards" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono-code">
                    <thead className="bg-[#0E0E11] border-b border-white/[0.08] text-gray-400 uppercase text-[10px] font-manrope font-extrabold">
                      <tr>
                        <th className="px-6 py-3.5">Nota Origen</th>
                        <th className="px-6 py-3.5">Número de Tarjeta</th>
                        <th className="px-6 py-3.5">Red / Marca</th>
                        <th className="px-6 py-3.5">Exp / CVV</th>
                        <th className="px-6 py-3.5">Validación Luhn</th>
                        <th className="px-6 py-3.5 text-right">Copiar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {globalScan.cards.map((c, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="px-6 py-3.5 text-[#FF9F0A] font-bold">/{c.slug}</td>
                          <td className="px-6 py-3.5 text-white font-bold">{c.formatted}</td>
                          <td className="px-6 py-3.5 text-gray-300">{c.brand}</td>
                          <td className="px-6 py-3.5 text-gray-300">
                            {c.exp || "--/--"} · CVV: {c.cvv || "---"}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`pf-pill ${c.isValid ? "pf-pill-ok" : "pf-pill-danger"}`}>
                              {c.isValid ? "Luhn Válida" : "Inválida"}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleCopy(`${c.digits}|${c.exp || ""}|${c.cvv || ""}`, `vc-${idx}`)}
                              className="pf-btn-secondary px-3 py-1 text-xs"
                            >
                              {copiedId === `vc-${idx}` ? "Copiada" : "Copiar Pipe"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {vaultTab === "users" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono-code">
                    <thead className="bg-[#0E0E11] border-b border-white/[0.08] text-gray-400 uppercase text-[10px] font-manrope font-extrabold">
                      <tr>
                        <th className="px-6 py-3.5">Nota Origen</th>
                        <th className="px-6 py-3.5">Usuario / Correo</th>
                        <th className="px-6 py-3.5 text-right">Copiar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {globalScan.users.map((u, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="px-6 py-3.5 text-[#FF9F0A] font-bold">/{u.slug}</td>
                          <td className="px-6 py-3.5 text-white">{u.value}</td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleCopy(u.value, `vu-${idx}`)}
                              className="pf-btn-secondary px-3 py-1 text-xs"
                            >
                              {copiedId === `vu-${idx}` ? "Copiado" : "Copiar"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {vaultTab === "proxies" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono-code">
                    <thead className="bg-[#0E0E11] border-b border-white/[0.08] text-gray-400 uppercase text-[10px] font-manrope font-extrabold">
                      <tr>
                        <th className="px-6 py-3.5">Nota Origen</th>
                        <th className="px-6 py-3.5">Proxy Completo</th>
                        <th className="px-6 py-3.5 text-right">Copiar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {globalScan.proxies.map((pr, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="px-6 py-3.5 text-[#FF9F0A] font-bold">/{pr.slug}</td>
                          <td className="px-6 py-3.5 text-purple-300">{pr.raw}</td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleCopy(pr.raw, `vpr-${idx}`)}
                              className="pf-btn-secondary px-3 py-1 text-xs"
                            >
                              {copiedId === `vpr-${idx}` ? "Copiado" : "Copiar"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {vaultTab === "crypto_keys" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono-code">
                    <thead className="bg-[#0E0E11] border-b border-white/[0.08] text-gray-400 uppercase text-[10px] font-manrope font-extrabold">
                      <tr>
                        <th className="px-6 py-3.5">Nota Origen</th>
                        <th className="px-6 py-3.5">Tipo / Red</th>
                        <th className="px-6 py-3.5">Dirección / API Token</th>
                        <th className="px-6 py-3.5 text-right">Copiar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {globalScan.crypto.map((cr, idx) => (
                        <tr key={`c-${idx}`} className="hover:bg-white/[0.02]">
                          <td className="px-6 py-3.5 text-[#FF9F0A] font-bold">/{cr.slug}</td>
                          <td className="px-6 py-3.5 text-amber-300">{cr.network}</td>
                          <td className="px-6 py-3.5 text-white">{cr.address}</td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleCopy(cr.address, `vcr-${idx}`)}
                              className="pf-btn-secondary px-3 py-1 text-xs"
                            >
                              Copiar
                            </button>
                          </td>
                        </tr>
                      ))}
                      {globalScan.keys.map((k, idx) => (
                        <tr key={`k-${idx}`} className="hover:bg-white/[0.02]">
                          <td className="px-6 py-3.5 text-[#FF9F0A] font-bold">/{k.slug}</td>
                          <td className="px-6 py-3.5 text-sky-300">{k.type}</td>
                          <td className="px-6 py-3.5 text-white">{k.key}</td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleCopy(k.key, `vk-${idx}`)}
                              className="pf-btn-secondary px-3 py-1 text-xs"
                            >
                              Copiar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 4: PAGOS Y DESBLOQUEOS BITCOIN / OXAPAY
           ========================================================= */}
        {activeTab === "payments" && (
          <div className="pf-panel overflow-hidden">
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-white">Órdenes de Pago OxaPay (Bitcoin)</h2>
                <p className="text-xs text-gray-400">
                  Aprueba pagos manualmente para desbloquear una nota al instante o revisa transacciones completadas.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0E0E11] border-b border-white/[0.08] text-gray-400 uppercase text-[10px] font-extrabold">
                  <tr>
                    <th className="px-6 py-3.5">Factura / Track ID</th>
                    <th className="px-6 py-3.5">Nota Asociada</th>
                    <th className="px-6 py-3.5">Monto USD</th>
                    <th className="px-6 py-3.5">Estado</th>
                    <th className="px-6 py-3.5">Fecha</th>
                    <th className="px-6 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] font-mono-code">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4 text-white font-bold">{p.invoice_id}</td>
                      <td className="px-6 py-4 text-[#FF9F0A]">/{p.note_slug || p.note_id}</td>
                      <td className="px-6 py-4 text-white font-bold">${p.amount} USD</td>
                      <td className="px-6 py-4">
                        <span className={`pf-pill ${p.status === "paid" ? "pf-pill-ok" : "pf-pill-warm"}`}>
                          {p.status === "paid" ? "Pagado" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{new Date(p.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {p.status !== "paid" && (
                          <button
                            type="button"
                            onClick={() => handleApprovePayment(p.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-[#30D158] border border-emerald-500/30 text-xs font-extrabold font-manrope"
                          >
                            Aprobar y Desbloquear
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeletePayment(p.id)}
                          className="p-2 rounded-xl bg-red-500/10 text-[#FF6961] hover:bg-red-500/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500 font-manrope">
                        No hay órdenes de pago registradas aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 5: SOPORTE, CONTACTO & REPORTES DMCA
           ========================================================= */}
        {activeTab === "messages" && (
          <div className="pf-panel overflow-hidden">
            <div className="p-5 border-b border-white/[0.08]">
              <h2 className="text-lg font-extrabold text-white">Bandeja de Soporte, Contacto y Reportes DMCA</h2>
              <p className="text-xs text-gray-400">
                Mensajes enviados por usuarios desde los formularios públicos de Notepad.do.
              </p>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {messages.map((m) => (
                <div key={m.id} className="p-5 flex flex-col sm:flex-row items-start justify-between gap-4 hover:bg-white/[0.02]">
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`pf-pill ${
                          m.status === "unread"
                            ? "pf-pill-warm"
                            : m.status === "resolved"
                            ? "pf-pill-ok"
                            : "bg-white/10 text-gray-300"
                        }`}
                      >
                        {m.status}
                      </span>
                      <span className="text-sm font-extrabold text-white">{m.subject || "Sin asunto"}</span>
                      <span className="text-xs text-[#FF9F0A] font-mono-code">
                        {m.name} &lt;{m.email}&gt;
                      </span>
                      <span className="text-[11px] text-gray-500 font-mono-code">
                        · IP: {m.ip} · {new Date(m.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed bg-[#0E0E11] p-3.5 rounded-xl border border-white/[0.06]">
                      {m.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {m.status !== "read" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateMessageStatus(m.id, "read")}
                        className="pf-btn-secondary px-3 py-1.5 text-xs"
                      >
                        Marcar Leído
                      </button>
                    )}
                    {m.status !== "resolved" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateMessageStatus(m.id, "resolved")}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-[#30D158] border border-emerald-500/30 text-xs font-extrabold"
                      >
                        Resuelto
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(m.id)}
                      className="p-2 rounded-xl bg-red-500/10 text-[#FF6961]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="p-12 text-center text-gray-500 text-xs">
                  No hay mensajes de soporte ni reportes DMCA.
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 6: CONFIGURACIÓN GLOBAL, LOGS DE SEGURIDAD & BACKUP
           ========================================================= */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Global Server Settings Form */}
            <div className="pf-panel p-6 space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-white">Configuración Global de Notepad.do</h3>
                <p className="text-xs text-gray-400">
                  Ajusta los parámetros operativos del servidor Go en caliente.
                </p>
              </div>

              <form method="post" onSubmit={handleSaveSettings} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="set-unlock-price" className="text-xs font-bold text-gray-300">
                    Precio de Desbloqueo Bitcoin OxaPay (USD)
                  </label>
                  <input
                    id="set-unlock-price"
                    type="number"
                    value={settings.unlock_price_usd}
                    onChange={(e) => setSettings({ ...settings, unlock_price_usd: e.target.value })}
                    className="bg-[#0E0E11] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono-code"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="set-announcement" className="text-xs font-bold text-gray-300">
                    Anuncio Global en Notepad.do (Opcional)
                  </label>
                  <input
                    id="set-announcement"
                    type="text"
                    value={settings.site_announcement}
                    onChange={(e) => setSettings({ ...settings, site_announcement: e.target.value })}
                    placeholder="Ej: Mantenimiento programado o aviso importante..."
                    className="bg-[#0E0E11] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>

                <div className="space-y-2.5 pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.scraper_enabled === "true"}
                      onChange={(e) =>
                        setSettings({ ...settings, scraper_enabled: e.target.checked ? "true" : "false" })
                      }
                      className="w-4 h-4 rounded accent-[#FF9F0A]"
                    />
                    <span className="text-xs font-bold text-gray-200">
                      Habilitar Scraper Automático de respaldo desde notepad.pw
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.adsense_enabled === "true"}
                      onChange={(e) =>
                        setSettings({ ...settings, adsense_enabled: e.target.checked ? "true" : "false" })
                      }
                      className="w-4 h-4 rounded accent-[#FF9F0A]"
                    />
                    <span className="text-xs font-bold text-gray-200">
                      Mostrar Banners de Google AdSense en el Editor Público
                    </span>
                  </label>
                </div>

                <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                  <div className="text-[11px] text-gray-500 font-mono-code">
                    Runtime: {serverInfo.go_version || "Go"} ({serverInfo.os_arch || "server"})
                  </div>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="pf-btn-primary px-5 py-2.5 text-xs font-extrabold"
                  >
                    Guardar Configuración
                  </button>
                </div>
              </form>

              {/* Full Backup Export Box */}
              <div className="pf-well p-4 space-y-3 border-t border-white/[0.06]">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#FF9F0A]">
                  Respaldo y Exportación Completa
                </h4>
                <p className="text-xs text-gray-400">
                  Descarga una copia íntegra de todas las notas, contraseñas en texto plano, pagos y configuración.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportDatabase("json")}
                    className="pf-btn-secondary px-4 py-2 text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-[#FF9F0A]" />
                    <span>Descargar Backup JSON Completo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportDatabase("csv")}
                    className="pf-btn-secondary px-4 py-2 text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-[#30D158]" />
                    <span>Exportar Tabla de Notas y Contraseñas (CSV)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Security & Password Attempt Audit Logs */}
            <div className="pf-panel p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Registro de Auditoría y Seguridad ({logs.length})
                  </h3>
                  <p className="text-xs text-gray-400">
                    Monitorea bloqueos de notas, contraseñas intentadas y acciones administrativas en tiempo real.
                  </p>
                </div>
                {logs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearLogs}
                    className="pf-btn-secondary px-3 py-1.5 text-xs text-[#FF6961]"
                  >
                    Limpiar Logs
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {logs.map((l) => (
                  <div
                    key={l.id}
                    className="pf-well p-3 text-xs flex flex-col gap-1 border border-white/[0.05]"
                  >
                    <div className="flex items-center justify-between font-mono-code text-[11px]">
                      <span className="text-[#FF9F0A] font-extrabold">{l.action}</span>
                      <span className="text-gray-400">/{l.target_slug}</span>
                      <span className="text-gray-500">{new Date(l.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-gray-200 font-mono-code text-xs">{l.details}</div>
                    <div className="text-[10px] text-gray-500 font-mono-code">IP: {l.ip}</div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="py-12 text-center text-gray-500 text-xs">
                    No hay eventos registrados todavía.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {passwordModalNote && (
        <PasswordModal
          note={passwordModalNote}
          onClose={() => setPasswordModalNote(null)}
          onSavePassword={handleSetNotePassword}
          onUnlockNote={handleUnlockNote}
          loading={actionLoading}
        />
      )}

      <CreateNoteModal
        isOpen={createModalOpen}
        initialMode={createModalMode}
        onClose={() => setCreateModalOpen(false)}
        onCreateNote={handleCreateNote}
        onScrapeImport={handleScrapeImport}
        loading={actionLoading}
      />

      {inspectingNote && (
        <NoteInspectorModal
          note={inspectingNote}
          onClose={() => setInspectingNote(null)}
          onSaveNote={handleSaveInspectedNote}
          onDeleteNote={handleDeleteNote}
          onRestoreNote={handleRestoreNote}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
