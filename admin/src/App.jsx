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
import BrandLogo from "./components/BrandLogo";
import {
  Shield, KeyRound, Lock, Unlock, FileText, DollarSign,
  CheckCircle2, Search, Copy, Check, RefreshCw, LogOut,
  AlertCircle, ExternalLink, Plus, Trash2, Eye, EyeOff,
  Pin, CreditCard, User, Globe, Database, Settings,
  MessageSquare, Activity, Download, DownloadCloud,
  Sparkles, CheckSquare, Square, RotateCcw,
  Server, ChevronRight, Hash, Filter, ArrowUpDown
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
  const [activeTab, setActiveTab] = useState("notes"); // "notes" | "vault" | "payments" | "messages" | "logs" | "settings"

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
    adsense_client_id: "",
    adsense_slot_top: "",
    adsense_slot_bottom: "",
    adsense_auto_ads: "true",
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

    try {
      const headers = { "X-Admin-Key": key };
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
        setLoginError("Clave de administrador incorrecta.");
        setIsAuthenticated(false);
        clearAdminKey();
      } else {
        const endpoint = getAdminApiBase();
        const msg = err.response?.data?.error || err.message || "Error de red/CORS";
        setLoginError(`No se pudo conectar con el servidor Go en ${endpoint} (${msg}). Verifica que el backend esté accesible.`);
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
      if (statusFilter !== "trash") {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
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

  // Auth Handlers
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

  // CRUD & Admin Actions
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
        password,
        unlock: true
      });
      showToast(`Nota /${slug} desbloqueada`);
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
      showToast(note.is_pinned ? `Nota /${note.slug} desfijada` : `Nota /${note.slug} fijada`);
      await fetchAllAdminData();
    } catch (err) {
      showToast("No se pudo cambiar el estado fijado", "error");
    }
  };

  const handleDeleteNote = async (slug, permanent = false) => {
    setActionLoading(true);
    try {
      await api.delete(`/admin/notes/${encodeURIComponent(slug)}?permanent=${permanent}`);
      showToast(permanent ? `Nota /${slug} eliminada definitivamente` : `Nota /${slug} enviada a papelera`);
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
      showToast(`Nota /${slug} restaurada`);
      setInspectingNote(null);
      await fetchAllAdminData();
    } catch (err) {
      showToast("Error al restaurar la nota", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Actions
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

  // Payments, Messages, Settings & Export
  const handleApprovePayment = async (id) => {
    try {
      await api.post(`/admin/payments/${id}/approve`);
      showToast("Pago aprobado y nota desbloqueada");
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
      showToast("Configuración del servidor guardada");
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

  const handleExportDatabase = async (format = "csv") => {
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
        a.download = `notepad-do-passwords-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `notepad-do-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      showToast(`Exportación ${format.toUpperCase()} completada`);
    } catch (err) {
      showToast("Error al exportar base de datos", "error");
    }
  };

  // --- LOGIN SCREEN (Clean Minimalist Console Architecture) ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[#09090B]">
        <div className="w-full max-w-sm console-card p-7 flex flex-col items-center border border-white/[0.08]">
          <BrandLogo size="lg" className="mb-4" />

          <h1 className="text-xl font-bold text-white tracking-tight text-center mb-1">
            Notepad Console
          </h1>
          <p className="text-xs text-zinc-400 text-center mb-6">
            Centro de Operaciones y Base de Datos
          </p>

          <form method="post" onSubmit={handleLogin} className="w-full space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-key-input" className="text-xs font-semibold text-zinc-300">
                Clave Maestra (ADMIN_API_KEY)
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
                  className="w-full bg-[#0D0E10] border border-white/[0.08] rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 font-mono-code focus:border-[#F59E0B] focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  aria-pressed={showLoginPwd}
                  aria-label={showLoginPwd ? "Ocultar clave" : "Mostrar clave"}
                  onClick={() => setShowLoginPwd(!showLoginPwd)}
                  className="absolute right-2.5 p-1 text-zinc-500 hover:text-white rounded-md"
                >
                  {showLoginPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-zinc-200 select-none">
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-[#F59E0B]"
                />
                <span>Recordar sesión</span>
              </label>
            </div>

            {loginError && (
              <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full console-btn-primary py-2.5 text-xs flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
              <span>{loading ? "Verificando acceso..." : "Acceder a la Consola"}</span>
            </button>

            <div className="pt-3 border-t border-white/[0.06] w-full">
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <div className="flex items-center gap-1.5 truncate mr-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-zinc-400">API:</span>
                  <span className="font-mono text-zinc-300 truncate" title={currentApiEndpoint}>
                    {currentApiEndpoint}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEndpointConfig(!showEndpointConfig)}
                  className="text-[#F59E0B] hover:underline text-[11px] font-medium shrink-0"
                >
                  {showEndpointConfig ? "Cerrar" : "Cambiar"}
                </button>
              </div>

              {showEndpointConfig && (
                <div className="mt-3 p-3 rounded-xl bg-[#0D0E10] border border-white/[0.08] text-left space-y-2">
                  <label className="text-[11px] font-semibold text-zinc-300 block">
                    URL del Backend:
                  </label>
                  <input
                    type="url"
                    value={customEndpointInput}
                    onChange={(e) => setCustomEndpointInput(e.target.value)}
                    placeholder="https://secure.notepad.do"
                    className="w-full bg-[#111113] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono-code focus:border-[#F59E0B] focus:outline-none"
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
                      className="console-btn-primary px-3 py-1 text-xs"
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
                      className="console-btn-secondary px-2.5 py-1 text-xs"
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
  const sensitiveNotesCount = activeNotes.filter((n) => (globalScan.bySlug[n.slug]?.totalFindings || 0) > 0).length;

  return (
    <div className="min-h-screen w-full bg-[#09090B] text-[#F4F4F5] flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl border shadow-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            toast.type === "error"
              ? "bg-[#181113] border-rose-500/30 text-rose-400"
              : "bg-[#0F1A14] border-emerald-500/30 text-emerald-400"
          }`}
        >
          {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#09090B]/90 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-tight">
                  Notepad Console
                </h1>
                <span className="console-badge console-badge-emerald text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  En línea
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono-code">
                {stats.total_notes} notas registradas · {stats.protected_notes} protegidas
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
              className="console-btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5"
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
              className="console-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="hidden sm:inline">Importar notepad.pw</span>
            </button>

            <button
              type="button"
              onClick={() => handleExportDatabase("csv")}
              className="console-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
              title="Descargar base de datos con contraseñas en CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Exportar CSV</span>
            </button>

            <button
              type="button"
              onClick={() => fetchAllAdminData()}
              disabled={loading}
              className="console-btn-secondary px-2.5 py-1.5 text-xs flex items-center gap-1.5"
              title="Sincronizar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#F59E0B]" : ""}`} />
            </button>

            <a
              href={PUBLIC_SITE_ORIGIN}
              target="_blank"
              rel="noreferrer"
              className="console-btn-secondary px-2.5 py-1.5 text-xs flex items-center gap-1"
              title="Abrir sitio web público"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </a>

            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión"
              className="console-btn-danger px-2.5 py-1.5 text-xs flex items-center gap-1 ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col gap-6">
        
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="console-card p-4 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Total Notas
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white font-mono-code tabular-nums">
                {activeNotes.length}
              </span>
              <span className="text-xs text-zinc-400 font-mono-code">
                {((stats.total_bytes || 0) / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>

          <div className="console-card p-4 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Protegidas con Clave
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white font-mono-code tabular-nums">
                {protectedNotesList.length}
              </span>
              <span className="text-xs text-emerald-400 font-mono-code">
                {activeNotes.length - protectedNotesList.length} públicas
              </span>
            </div>
          </div>

          <div className="console-card p-4 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Bóveda de Inteligencia
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-[#F59E0B] font-mono-code tabular-nums">
                {globalScan.cards.length + globalScan.passwords.length}
              </span>
              <span className="text-xs text-zinc-400 font-mono-code">
                {globalScan.cards.length} tarjetas · {globalScan.passwords.length} claves
              </span>
            </div>
          </div>

          <div className="console-card p-4 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Ingresos OxaPay
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white font-mono-code tabular-nums">
                ${stats.total_revenue || 0}
              </span>
              <span className="text-xs text-zinc-400 font-mono-code">
                {payments.length} órdenes · {messages.length} mensajes
              </span>
            </div>
          </div>
        </div>

        {/* Segmented Navigation Tab Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-[#111113] border border-white/[0.08] rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "notes"
                ? "bg-white/[0.1] text-white shadow-sm border border-white/[0.1]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notas & Slugs</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/[0.06] text-[10px] font-mono-code">
              {activeNotes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("vault")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "vault"
                ? "bg-white/[0.1] text-white shadow-sm border border-white/[0.1]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Bóveda de Inteligencia</span>
            <span className="px-1.5 py-0.2 rounded-md bg-[#F59E0B]/15 text-[#F59E0B] text-[10px] font-mono-code font-bold">
              {globalScan.cards.length + globalScan.passwords.length + globalScan.proxies.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("payments")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "payments"
                ? "bg-white/[0.1] text-white shadow-sm border border-white/[0.1]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Órdenes OxaPay</span>
            {payments.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-mono-code">
                {payments.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("messages")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "messages"
                ? "bg-white/[0.1] text-white shadow-sm border border-white/[0.1]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Mensajes & DMCA</span>
            {messages.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-white/[0.06] text-[10px] font-mono-code">
                {messages.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "logs"
                ? "bg-white/[0.1] text-white shadow-sm border border-white/[0.1]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Auditoría & Logs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ml-auto ${
              activeTab === "settings"
                ? "bg-white/[0.1] text-white shadow-sm border border-white/[0.1]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configuración</span>
          </button>
        </div>

        {/* TAB 1: NOTAS & SLUGS */}
        {activeTab === "notes" && (
          <div className="flex flex-col gap-4">
            
            {/* Filter Pills Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`console-card p-3 text-left transition-all ${
                  statusFilter === "all" ? "border-white/[0.25] bg-white/[0.03]" : ""
                }`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">
                  Todas
                </span>
                <span className="text-lg font-bold text-white mt-0.5 block font-mono-code tabular-nums">
                  {activeNotes.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("protected")}
                className={`console-card p-3 text-left transition-all ${
                  statusFilter === "protected" ? "border-rose-500/50 bg-rose-500/5" : ""
                }`}
              >
                <div className="flex items-center justify-between text-rose-400">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Con Clave</span>
                  <Lock className="w-3 h-3" />
                </div>
                <span className="text-lg font-bold text-rose-400 mt-0.5 block font-mono-code tabular-nums">
                  {protectedNotesList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("public")}
                className={`console-card p-3 text-left transition-all ${
                  statusFilter === "public" ? "border-emerald-500/50 bg-emerald-500/5" : ""
                }`}
              >
                <div className="flex items-center justify-between text-emerald-400">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Públicas</span>
                  <Globe className="w-3 h-3" />
                </div>
                <span className="text-lg font-bold text-emerald-400 mt-0.5 block font-mono-code tabular-nums">
                  {activeNotes.length - protectedNotesList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("sensitive")}
                className={`console-card p-3 text-left transition-all ${
                  statusFilter === "sensitive" ? "border-[#F59E0B]/50 bg-[#F59E0B]/5" : ""
                }`}
              >
                <div className="flex items-center justify-between text-[#F59E0B]">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Con Hallazgos</span>
                  <Shield className="w-3 h-3" />
                </div>
                <span className="text-lg font-bold text-[#F59E0B] mt-0.5 block font-mono-code tabular-nums">
                  {sensitiveNotesCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("pinned")}
                className={`console-card p-3 text-left transition-all ${
                  statusFilter === "pinned" ? "border-white/[0.25] bg-white/[0.03]" : ""
                }`}
              >
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Fijadas</span>
                  <Pin className="w-3 h-3 text-[#F59E0B]" />
                </div>
                <span className="text-lg font-bold text-white mt-0.5 block font-mono-code tabular-nums">
                  {activeNotes.filter((n) => n.is_pinned).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("trash")}
                className={`console-card p-3 text-left transition-all ${
                  statusFilter === "trash" ? "border-rose-500/50 bg-rose-500/5" : ""
                }`}
              >
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Papelera</span>
                  <Trash2 className="w-3 h-3" />
                </div>
                <span className="text-lg font-bold text-zinc-400 mt-0.5 block font-mono-code tabular-nums">
                  {trashedNotes.length}
                </span>
              </button>
            </div>

            {/* Toolbar */}
            <div className="console-card p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por slug, contraseña, contenido o IP..."
                  className="w-full bg-[#0D0E10] border border-white/[0.08] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-[#F59E0B] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-[#0D0E10] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs">
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-xs text-zinc-300 focus:outline-none"
                  >
                    <option value="updated_desc" className="bg-[#111113]">Recientes primero</option>
                    <option value="created_desc" className="bg-[#111113]">Fecha creación</option>
                    <option value="views_desc" className="bg-[#111113]">Más vistas</option>
                    <option value="size_desc" className="bg-[#111113]">Mayor tamaño</option>
                    <option value="slug_asc" className="bg-[#111113]">Slug A-Z</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPasswordsPlain(!showPasswordsPlain)}
                  className="console-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
                >
                  {showPasswordsPlain ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPasswordsPlain ? "Ocultar Claves" : "Ver Claves"}</span>
                </button>
              </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedSlugs.length > 0 && (
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.12] flex flex-wrap items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                  <span>{selectedSlugs.length} nota(s) seleccionada(s)</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSlugs([])}
                    className="text-xs text-zinc-400 hover:text-white underline ml-2"
                  >
                    Deseleccionar
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={bulkPassword}
                      onChange={(e) => setBulkPassword(e.target.value)}
                      placeholder="Nueva clave común..."
                      className="bg-[#0D0E10] border border-white/[0.1] rounded-lg px-2.5 py-1 text-xs text-white font-mono-code focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => executeBulkAction("lock")}
                      className="console-btn-primary px-2.5 py-1 text-xs"
                    >
                      Bloquear Selección
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => executeBulkAction("unlock")}
                    className="console-btn-secondary px-2.5 py-1 text-xs text-emerald-400"
                  >
                    Desbloquear
                  </button>

                  {statusFilter === "trash" ? (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => executeBulkAction("restore")}
                      className="console-btn-secondary px-2.5 py-1 text-xs"
                    >
                      Restaurar
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => executeBulkAction("trash")}
                      className="console-btn-danger px-2.5 py-1 text-xs"
                    >
                      Mover a Papelera
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Notes Table */}
            <div className="console-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02] text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4 w-10">
                        <button
                          type="button"
                          onClick={toggleSelectAllFiltered}
                          aria-label="Seleccionar todas"
                          className="text-zinc-400 hover:text-white"
                        >
                          {selectedSlugs.length > 0 && selectedSlugs.length === filteredNotes.length ? (
                            <CheckSquare className="w-4 h-4 text-[#F59E0B]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-4 min-w-[180px]">Slug / Identificador</th>
                      <th className="py-3 px-4 min-w-[220px]">Contraseña</th>
                      <th className="py-3 px-4 min-w-[280px]">Contenido & Hallazgos</th>
                      <th className="py-3 px-4 min-w-[140px]">Telemetría</th>
                      <th className="py-3 px-4 text-right min-w-[140px]">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredNotes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-zinc-500 text-xs">
                          No se encontraron notas con el filtro seleccionado.
                        </td>
                      </tr>
                    ) : (
                      filteredNotes.map((note) => {
                        const isSelected = selectedSlugs.includes(note.slug);
                        const scan = globalScan.bySlug[note.slug] || { counts: {}, totalFindings: 0 };

                        return (
                          <tr
                            key={note.slug}
                            className={`hover:bg-white/[0.02] transition-colors ${
                              isSelected ? "bg-white/[0.03]" : ""
                            }`}
                          >
                            <td className="py-3 px-4 align-top">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectSlug(note.slug)}
                                className="w-3.5 h-3.5 rounded accent-[#F59E0B] cursor-pointer mt-1"
                              />
                            </td>

                            {/* Slug Column */}
                            <td className="py-3 px-4 align-top">
                              <div className="flex items-center gap-1.5">
                                {note.is_pinned && (
                                  <Pin className="w-3 h-3 text-[#F59E0B] shrink-0" title="Nota Fijada" />
                                )}
                                <span className="font-mono-code font-bold text-white text-xs">
                                  /{note.slug}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(note.slug, `slug-${note.slug}`)}
                                  className="text-zinc-500 hover:text-white p-0.5"
                                  title="Copiar slug"
                                >
                                  {copiedId === `slug-${note.slug}` ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                                <a
                                  href={`${PUBLIC_SITE_ORIGIN}/${note.slug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-zinc-500 hover:text-zinc-300 p-0.5"
                                  title="Abrir nota pública"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>

                              <div className="text-[10px] text-zinc-500 font-mono-code mt-1">
                                IP: {note.last_ip || "local"}
                              </div>

                              {note.admin_notes && (
                                <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300">
                                  <Pin className="w-2.5 h-2.5" />
                                  <span>{note.admin_notes}</span>
                                </div>
                              )}
                            </td>

                            {/* Password Column */}
                            <td className="py-3 px-4 align-top">
                              {note.has_password ? (
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="console-badge console-badge-rose text-[10px]">
                                      <Lock className="w-2.5 h-2.5" />
                                      Protegida
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleUnlockNote(note.slug)}
                                      className="text-[10px] font-semibold text-emerald-400 hover:underline"
                                    >
                                      Desbloquear
                                    </button>
                                  </div>

                                  <div className="flex items-center justify-between bg-[#0D0E10] border border-white/[0.08] rounded-lg px-2.5 py-1 max-w-[220px]">
                                    <div className="flex items-center gap-1.5 min-w-0 pr-1">
                                      <KeyRound className="w-3 h-3 text-[#F59E0B] shrink-0" />
                                      <span className="font-mono-code text-xs text-white truncate">
                                        {note.password_plain
                                          ? (showPasswordsPlain ? note.password_plain : "••••••••")
                                          : "Hash Bcrypt"}
                                      </span>
                                    </div>
                                    {note.password_plain && (
                                      <button
                                        type="button"
                                        onClick={() => handleCopy(note.password_plain, `pwd-${note.slug}`)}
                                        className="text-zinc-500 hover:text-white p-0.5"
                                        title="Copiar contraseña"
                                      >
                                        {copiedId === `pwd-${note.slug}` ? (
                                          <Check className="w-3 h-3 text-emerald-400" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-start gap-1">
                                  <span className="console-badge console-badge-emerald text-[10px]">
                                    <Globe className="w-2.5 h-2.5" />
                                    Pública
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setPasswordModalNote(note)}
                                    className="text-[11px] text-zinc-400 hover:text-[#F59E0B] flex items-center gap-1"
                                  >
                                    <Lock className="w-3 h-3" />
                                    <span>Asignar clave</span>
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* Content & Intelligence Column */}
                            <td className="py-3 px-4 align-top max-w-sm">
                              <div
                                onClick={() => setInspectingNote(note)}
                                className="cursor-pointer bg-[#0D0E10] hover:bg-[#141416] border border-white/[0.06] rounded-lg p-2 font-mono-code text-xs text-zinc-300 line-clamp-2 break-words transition-colors"
                              >
                                {note.content ? note.content.slice(0, 180) : <span className="text-zinc-600 italic">Vacía</span>}
                              </div>

                              {scan.totalFindings > 0 && (
                                <div className="flex flex-wrap items-center gap-1 mt-1.5">
                                  {scan.counts.cards > 0 && (
                                    <span className="console-badge console-badge-amber text-[10px]">
                                      <CreditCard className="w-2.5 h-2.5" />
                                      {scan.counts.cards} Tarjeta(s)
                                    </span>
                                  )}
                                  {scan.counts.passwords > 0 && (
                                    <span className="console-badge console-badge-rose text-[10px]">
                                      <KeyRound className="w-2.5 h-2.5" />
                                      {scan.counts.passwords} Clave(s)
                                    </span>
                                  )}
                                  {scan.counts.users > 0 && (
                                    <span className="console-badge console-badge-emerald text-[10px]">
                                      <User className="w-2.5 h-2.5" />
                                      {scan.counts.users} User(s)
                                    </span>
                                  )}
                                  {scan.counts.proxies > 0 && (
                                    <span className="console-badge console-badge-purple text-[10px]">
                                      <Globe className="w-2.5 h-2.5" />
                                      {scan.counts.proxies} Proxy
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Telemetry Column */}
                            <td className="py-3 px-4 align-top font-mono-code text-[11px] text-zinc-400 whitespace-nowrap">
                              <div className="text-white font-medium">
                                {(note.size_bytes || 0).toLocaleString()} B
                              </div>
                              <div className="flex items-center gap-1 text-zinc-400 mt-0.5">
                                <Eye className="w-3 h-3 text-zinc-500" />
                                <span>{note.views_count || 0} vistas</span>
                              </div>
                              <div className="text-zinc-500 text-[10px] mt-0.5">
                                {new Date(note.updated_at || note.created_at).toLocaleDateString()}
                              </div>
                            </td>

                            {/* Actions Column */}
                            <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setInspectingNote(note)}
                                  className="console-btn-primary px-2.5 py-1 text-xs"
                                >
                                  Editar
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setPasswordModalNote(note)}
                                  className="console-btn-secondary p-1"
                                  title="Gestionar contraseña"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleTogglePin(note)}
                                  className="console-btn-secondary p-1"
                                  title={note.is_pinned ? "Desfijar" : "Fijar nota"}
                                >
                                  <Pin className={`w-3.5 h-3.5 ${note.is_pinned ? "text-[#F59E0B]" : ""}`} />
                                </button>

                                {note.is_deleted ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRestoreNote(note.slug)}
                                    className="console-btn-secondary p-1 text-emerald-400"
                                    title="Restaurar de papelera"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteNote(note.slug, false)}
                                    className="console-btn-secondary p-1 hover:text-rose-400"
                                    title="Enviar a papelera"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BÓVEDA DE INTELIGENCIA */}
        {activeTab === "vault" && (
          <div className="console-card p-6 flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#F59E0B]" />
                  <span>Bóveda de Inteligencia y Datos Extraídos</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Análisis global heurístico y algorítmico de credenciales, tarjetas Luhn y proxies.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allCardsText = globalScan.cards.map((c) => `${c.slug}: ${c.digits}|${c.exp || ""}|${c.cvv || ""}`).join("\n");
                    handleCopy(allCardsText, "all-vault-cards");
                  }}
                  className="console-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Copiar Tarjetas</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const allPwds = activeNotes.filter((n) => n.password_plain).map((n) => `/${n.slug} -> ${n.password_plain}`).join("\n");
                    handleCopy(allPwds, "all-vault-pwds");
                  }}
                  className="console-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-rose-400" />
                  <span>Copiar Claves</span>
                </button>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#0D0E10] border border-white/[0.08] rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setVaultTab("note_locks")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  vaultTab === "note_locks" ? "bg-white/[0.1] text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Claves de Notas ({activeNotes.filter((n) => n.password_plain).length})
              </button>
              <button
                type="button"
                onClick={() => setVaultTab("cards")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  vaultTab === "cards" ? "bg-white/[0.1] text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Tarjetas ({globalScan.cards.length})
              </button>
              <button
                type="button"
                onClick={() => setVaultTab("text_passwords")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  vaultTab === "text_passwords" ? "bg-white/[0.1] text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Contraseñas en Texto ({globalScan.passwords.length})
              </button>
              <button
                type="button"
                onClick={() => setVaultTab("users")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  vaultTab === "users" ? "bg-white/[0.1] text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Usuarios & Correos ({globalScan.users.length})
              </button>
              <button
                type="button"
                onClick={() => setVaultTab("proxies")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  vaultTab === "proxies" ? "bg-white/[0.1] text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Proxies ({globalScan.proxies.length})
              </button>
            </div>

            {/* Vault Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {vaultTab === "note_locks" &&
                activeNotes.filter((n) => n.password_plain).map((n) => (
                  <div key={n.slug} className="console-well p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0 pr-2">
                      <span className="font-mono-code font-bold text-white text-xs block truncate">
                        /{n.slug}
                      </span>
                      <span className="font-mono-code text-xs text-[#F59E0B] font-semibold block truncate">
                        {n.password_plain}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(n.password_plain, `vlt-pwd-${n.slug}`)}
                      className="console-btn-secondary px-2.5 py-1 text-xs shrink-0"
                    >
                      {copiedId === `vlt-pwd-${n.slug}` ? "Copiada" : "Copiar"}
                    </button>
                  </div>
                ))}

              {vaultTab === "cards" &&
                globalScan.cards.map((c, idx) => (
                  <div key={idx} className="console-well p-3 flex items-center justify-between gap-2 font-mono-code text-xs">
                    <div>
                      <div className="text-white font-medium">{c.formatted}</div>
                      <div className="text-[10px] text-zinc-400">
                        {c.brand} · Exp: {c.exp || "—"} · CVV: {c.cvv || "—"} ·{" "}
                        <span className={c.isValid ? "text-emerald-400" : "text-rose-400"}>
                          {c.isValid ? "Luhn OK" : "Inválida"}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500">Nota: /{c.slug}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(`${c.digits}|${c.exp || ""}|${c.cvv || ""}`, `vlt-c-${idx}`)}
                      className="console-btn-secondary px-2.5 py-1 text-xs shrink-0"
                    >
                      Copiar
                    </button>
                  </div>
                ))}

              {vaultTab === "text_passwords" &&
                globalScan.passwords.map((p, idx) => (
                  <div key={idx} className="console-well p-3 flex items-center justify-between gap-2 font-mono-code text-xs">
                    <div className="truncate pr-2">
                      <span className="text-zinc-400">{p.full}</span>
                      <div className="text-[10px] text-zinc-500">Nota: /{p.slug}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(p.value, `vlt-tp-${idx}`)}
                      className="console-btn-secondary px-2.5 py-1 text-xs shrink-0"
                    >
                      Copiar
                    </button>
                  </div>
                ))}

              {vaultTab === "users" &&
                globalScan.users.map((u, idx) => (
                  <div key={idx} className="console-well p-3 flex items-center justify-between gap-2 font-mono-code text-xs">
                    <div className="truncate pr-2">
                      <span className="text-white">{u.value}</span>
                      <div className="text-[10px] text-zinc-500">Nota: /{u.slug}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(u.value, `vlt-u-${idx}`)}
                      className="console-btn-secondary px-2.5 py-1 text-xs shrink-0"
                    >
                      Copiar
                    </button>
                  </div>
                ))}

              {vaultTab === "proxies" &&
                globalScan.proxies.map((pr, idx) => (
                  <div key={idx} className="console-well p-3 flex items-center justify-between gap-2 font-mono-code text-xs">
                    <span className="text-purple-300 truncate pr-2">{pr.raw}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(pr.raw, `vlt-pr-${idx}`)}
                      className="console-btn-secondary px-2.5 py-1 text-xs shrink-0"
                    >
                      Copiar
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 3: ÓRDENES OXAPAY */}
        {activeTab === "payments" && (
          <div className="console-card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Órdenes de Pago OxaPay</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Transacciones cripto para desbloqueo de notas protegidas.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Invoice ID</th>
                    <th className="py-2.5 px-3">Slug Nota</th>
                    <th className="py-2.5 px-3">Monto</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-zinc-500">
                        No hay órdenes de pago registradas.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-3 font-mono-code text-white font-medium">
                          {p.invoice_id}
                        </td>
                        <td className="py-3 px-3 font-mono-code text-[#F59E0B]">
                          /{p.note_slug}
                        </td>
                        <td className="py-3 px-3 font-mono-code text-white font-semibold">
                          ${p.amount} USD
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`console-badge ${
                              p.status === "paid"
                                ? "console-badge-emerald"
                                : p.status === "pending"
                                ? "console-badge-amber"
                                : "console-badge-rose"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-zinc-400 font-mono-code text-[11px]">
                          {new Date(p.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {p.status === "pending" && (
                            <button
                              type="button"
                              onClick={() => handleApprovePayment(p.id)}
                              className="console-btn-primary px-2.5 py-1 text-xs mr-1"
                            >
                              Aprobar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeletePayment(p.id)}
                            className="console-btn-danger p-1"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: MENSAJES & DMCA */}
        {activeTab === "messages" && (
          <div className="console-card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Mensajes de Contacto & Solicitudes DMCA</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Formularios recibidos a través de /contacto y /reportar-abuso.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="console-well p-10 text-center text-zinc-500 text-xs">
                  Bandeja de entrada vacía.
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="console-well p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-mono-code">
                        <span className="font-bold text-white">{m.name || "Anónimo"}</span>
                        <span className="text-zinc-500">&lt;{m.email}&gt;</span>
                        {m.note_slug && (
                          <span className="text-[#F59E0B]">Nota: /{m.note_slug}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-[11px] font-mono-code">
                          {new Date(m.created_at).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(m.id)}
                          className="console-btn-danger p-1"
                          title="Eliminar mensaje"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-300 font-mono-code whitespace-pre-wrap bg-[#111113] p-2.5 rounded-lg border border-white/[0.04]">
                      {m.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: AUDITORÍA & LOGS */}
        {activeTab === "logs" && (
          <div className="console-card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#F59E0B]" />
                  <span>Historial de Auditoría & Eventos de Seguridad</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Registro cronológico de accesos, modificaciones de notas y desbloqueos.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClearLogs}
                className="console-btn-danger px-3 py-1.5 text-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar Historial</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {logs.length === 0 ? (
                <div className="console-well p-10 text-center text-zinc-500 text-xs">
                  Sin eventos registrados.
                </div>
              ) : (
                logs.map((l) => (
                  <div key={l.id} className="console-well p-3 flex items-start justify-between gap-3 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2 font-mono-code">
                        <span className="font-semibold text-white">{l.action}</span>
                        {l.note_slug && <span className="text-[#F59E0B]">/{l.note_slug}</span>}
                      </div>
                      <span className="text-zinc-300">{l.details}</span>
                      <span className="text-[10px] text-zinc-500 font-mono-code">IP: {l.ip}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono-code shrink-0">
                      {new Date(l.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 6: CONFIGURACIÓN DEL SERVIDOR */}
        {activeTab === "settings" && (
          <form method="post" onSubmit={handleSaveSettings} className="console-card p-6 flex flex-col gap-5">
            <div className="border-b border-white/[0.08] pb-4">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span>Configuración Global del Servidor Go</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Variables persistentes de negocio, monetización y seguridad de Notepad.do.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="console-well p-4 flex flex-col gap-2">
                <label htmlFor="set-price" className="text-xs font-semibold text-zinc-300">
                  Precio de Desbloqueo OxaPay (USD)
                </label>
                <input
                  id="set-price"
                  type="number"
                  value={settings.unlock_price_usd}
                  onChange={(e) => setSettings({ ...settings, unlock_price_usd: e.target.value })}
                  className="console-input p-2.5 text-xs text-white font-mono-code"
                />
                <span className="text-[11px] text-zinc-500">
                  Importe que el usuario abona para eliminar la contraseña de una nota.
                </span>
              </div>

              <div className="console-well p-4 flex flex-col gap-2">
                <label htmlFor="set-banner" className="text-xs font-semibold text-zinc-300">
                  Anuncio Global del Sitio
                </label>
                <input
                  id="set-banner"
                  type="text"
                  value={settings.site_announcement}
                  onChange={(e) => setSettings({ ...settings, site_announcement: e.target.value })}
                  placeholder="Mensaje de mantenimiento o aviso superior..."
                  className="console-input p-2.5 text-xs text-white"
                />
                <span className="text-[11px] text-zinc-500">
                  Se muestra en una barra superior en todo el frontend cuando no está vacío.
                </span>
              </div>

              <div className="console-well p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Importador Scraper (notepad.pw)</div>
                  <div className="text-[11px] text-zinc-500">Permite importar notas automáticamente del dominio legado.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.scraper_enabled === "true"}
                  onChange={(e) => setSettings({ ...settings, scraper_enabled: e.target.checked ? "true" : "false" })}
                  className="w-4 h-4 rounded accent-[#F59E0B]"
                />
              </div>

              <div className="console-well p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Publicidad Google AdSense (Estado General)</div>
                  <div className="text-[11px] text-zinc-500">Habilita o pausa globalmente la carga de anuncios en Notepad.do.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.adsense_enabled === "true"}
                  onChange={(e) => setSettings({ ...settings, adsense_enabled: e.target.checked ? "true" : "false" })}
                  className="w-4 h-4 rounded accent-[#F59E0B]"
                />
              </div>
            </div>

            {/* GOOGLE ADSENSE MONETIZATION CONFIGURATION */}
            <div className="border-t border-white/[0.08] pt-5 mt-1 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#F59E0B] tracking-tight flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Credenciales de Monetización Google AdSense</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Cuando tengas tu cuenta de AdSense aprobada, pega aquí tu ID de Editor (`ca-pub-...`). El servidor actualizará `/ads.txt` y activará el script oficial automáticamente sin tocar código.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="console-well p-4 flex flex-col gap-2">
                  <label htmlFor="set-adsense-client" className="text-xs font-semibold text-zinc-300">
                    ID de Editor AdSense (Client ID)
                  </label>
                  <input
                    id="set-adsense-client"
                    type="text"
                    value={settings.adsense_client_id || ""}
                    onChange={(e) => setSettings({ ...settings, adsense_client_id: e.target.value.trim() })}
                    placeholder="ca-pub-0000000000000000"
                    className="console-input p-2.5 text-xs text-white font-mono-code"
                  />
                  <span className="text-[11px] text-zinc-500">
                    Ej: `ca-pub-1234567890123456`. Se inyecta en `&lt;head&gt;` y en `/ads.txt`.
                  </span>
                </div>

                <div className="console-well p-4 flex flex-col gap-2">
                  <label htmlFor="set-adsense-top" className="text-xs font-semibold text-zinc-300">
                    Slot ID Banner Superior (Opcional)
                  </label>
                  <input
                    id="set-adsense-top"
                    type="text"
                    value={settings.adsense_slot_top || ""}
                    onChange={(e) => setSettings({ ...settings, adsense_slot_top: e.target.value.trim() })}
                    placeholder="Ej: 1234567890"
                    className="console-input p-2.5 text-xs text-white font-mono-code"
                  />
                  <span className="text-[11px] text-zinc-500">
                    ID numérico del bloque 728x90 / Responsive superior.
                  </span>
                </div>

                <div className="console-well p-4 flex flex-col gap-2">
                  <label htmlFor="set-adsense-bottom" className="text-xs font-semibold text-zinc-300">
                    Slot ID Banner Inferior (Opcional)
                  </label>
                  <input
                    id="set-adsense-bottom"
                    type="text"
                    value={settings.adsense_slot_bottom || ""}
                    onChange={(e) => setSettings({ ...settings, adsense_slot_bottom: e.target.value.trim() })}
                    placeholder="Ej: 9876543210"
                    className="console-input p-2.5 text-xs text-white font-mono-code"
                  />
                  <span className="text-[11px] text-zinc-500">
                    ID numérico del bloque 728x90 / Responsive inferior.
                  </span>
                </div>
              </div>

              <div className="console-well p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Anuncios Automáticos de AdSense (Auto Ads)</div>
                  <div className="text-[11px] text-zinc-500">
                    Carga el script global `adsbygoogle.js` para la verificación del sitio y anuncios automáticos de Google.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.adsense_auto_ads !== "false"}
                  onChange={(e) => setSettings({ ...settings, adsense_auto_ads: e.target.checked ? "true" : "false" })}
                  className="w-4 h-4 rounded accent-[#F59E0B]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="submit"
                disabled={actionLoading}
                className="console-btn-primary px-5 py-2 text-xs flex items-center gap-1.5"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Settings className="w-3.5 h-3.5" />}
                <span>Guardar Configuración</span>
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Modals */}
      <CreateNoteModal
        isOpen={createModalOpen}
        initialMode={createModalMode}
        onClose={() => setCreateModalOpen(false)}
        onCreateNote={handleCreateNote}
        onScrapeImport={handleScrapeImport}
        loading={actionLoading}
      />

      <PasswordModal
        note={passwordModalNote}
        onClose={() => setPasswordModalNote(null)}
        onSavePassword={handleSetNotePassword}
        onUnlockNote={handleUnlockNote}
        loading={actionLoading}
      />

      <NoteInspectorModal
        note={inspectingNote}
        onClose={() => setInspectingNote(null)}
        onSaveNote={handleSaveInspectedNote}
        onDeleteNote={handleDeleteNote}
        onRestoreNote={handleRestoreNote}
        loading={actionLoading}
      />
    </div>
  );
}
