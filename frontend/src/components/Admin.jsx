import { useState, useEffect } from "react";
import api from "../utils/api";
import { 
  FileText, CheckCircle2, DollarSign, Search, 
  ExternalLink, Copy, Check, RefreshCw, Lock, Unlock, Globe, Shield,
  KeyRound, LogOut, AlertCircle, Trash2
} from "lucide-react";

export default function Admin() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem("notepad_admin_key") || localStorage.getItem("notepad_admin_key") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const [stats, setStats] = useState({ total_notes: 0, paid_unlocks: 0, protected_notes: 0, total_revenue: 0 });
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);

  const standaloneAdminUrl =
    typeof window !== "undefined" && window.location.port === "5173"
      ? "http://localhost:8080/admin/"
      : "/admin/";

  const fetchAdminData = (keyToUse) => {
    const key = keyToUse || adminKey;
    if (!key) return;

    setLoading(true);
    setLoginError("");

    Promise.all([
      api.get("/admin/stats", { headers: { "X-Admin-Key": key } }),
      api.get("/admin/notes", { headers: { "X-Admin-Key": key } })
    ])
    .then(([statsRes, notesRes]) => {
      setStats(statsRes.data);
      setNotes(notesRes.data);
      setIsAuthenticated(true);
      sessionStorage.setItem("notepad_admin_key", key);
      localStorage.setItem("notepad_admin_key", key);
      setAdminKey(key);
    })
    .catch(err => {
      if (err.response?.status === 401) {
        setLoginError("Clave de administrador incorrecta.");
        setIsAuthenticated(false);
      } else {
        setLoginError("Error de conexión con el servidor.");
      }
    })
    .finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    if (adminKey) {
      fetchAdminData(adminKey);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginInput.trim()) return;
    fetchAdminData(loginInput.trim());
  };

  const handleLogout = () => {
    sessionStorage.removeItem("notepad_admin_key");
    localStorage.removeItem("notepad_admin_key");
    setAdminKey("");
    setIsAuthenticated(false);
    setNotes([]);
    setLoginInput("");
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleUnlockNote = (slug) => {
    api.post(`/admin/notes/${encodeURIComponent(slug)}/password`, { password: "", unlock: true }, { headers: { "X-Admin-Key": adminKey } })
      .then(() => fetchAdminData());
  };

  const filteredNotes = notes.filter(n => {
    const q = searchTerm.toLowerCase();
    return (
      (n.slug || "").toLowerCase().includes(q) ||
      (n.content || "").toLowerCase().includes(q) ||
      (n.password_plain || "").toLowerCase().includes(q)
    );
  });

  if (!isAuthenticated) {
    return (
      <div className="flex-1 w-full max-w-md mx-auto my-auto flex flex-col items-center justify-center p-6 pf-panel">
        <div className="w-14 h-14 rounded-2xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 flex items-center justify-center text-[#FF9F0A] mb-4 shadow-[0_4px_16px_rgba(255,159,10,0.15)]">
          <Shield className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-extrabold text-white tracking-tight mb-1 font-manrope">
          Acceso de Administración
        </h2>
        <p className="text-xs text-gray-400 text-center mb-4 leading-relaxed">
          Introduce la clave maestra o abre el Panel de Administración independiente alojado en el servidor Go.
        </p>

        <a
          href={standaloneAdminUrl}
          className="w-full mb-4 pf-btn-secondary py-2.5 text-xs font-extrabold flex items-center justify-center gap-2 text-[#FF9F0A]"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Abrir Panel Master en Servidor Go (:8080/admin/)</span>
        </a>

        <form onSubmit={handleLogin} className="w-full space-y-3">
          <div>
            <input 
              type="password"
              placeholder="Introduce la clave de administrador..."
              value={loginInput}
              onChange={e => setLoginInput(e.target.value)}
              className="w-full bg-[#0E0E11] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#FF9F0A] font-mono-code"
              autoFocus
            />
          </div>

          {loginError && (
            <p className="text-xs text-[#FF6961] font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {loginError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full pf-btn-primary py-2.5 text-xs sm:text-sm font-bold font-manrope flex items-center justify-center gap-2 active:scale-95"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4" />
            )}
            <span>{loading ? "Verificando..." : "Ingresar al Panel"}</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col gap-6 text-[#EDEDED] font-manrope">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pf-panel p-6">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#FF9F0A] block mb-1">
            Centro de Control Master
          </span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Panel de Administración</h2>
          <p className="text-xs text-gray-400 mt-1">Control completo de notas, contraseñas en texto plano y métricas.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={standaloneAdminUrl}
            className="pf-btn-primary flex items-center gap-2 px-3.5 py-2 text-xs font-extrabold"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir Suite Completa (/admin/)</span>
          </a>

          <button
            onClick={() => fetchAdminData()}
            disabled={loading}
            className="pf-btn-secondary flex items-center gap-2 px-3.5 py-2 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#FF9F0A]" : ""}`} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={handleLogout}
            title="Cerrar sesión de administrador"
            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-[#FF6961] border border-red-500/20 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="pf-panel p-6 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
            <span className="font-extrabold text-[11px] uppercase tracking-wider text-gray-400">Total de notas</span>
            <FileText className="w-4 h-4 text-[#FF9F0A]" />
          </div>
          <div className="text-4xl font-extrabold text-white tracking-tight mb-1 font-manrope">
            {(stats.total_notes || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-gray-500 font-mono-code">
            {stats.protected_notes || 0} con contraseña
          </span>
        </div>

        <div className="pf-panel p-6 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
            <span className="font-extrabold text-[11px] uppercase tracking-wider text-gray-400">Desbloqueos pagados</span>
            <CheckCircle2 className="w-4 h-4 text-[#30D158]" />
          </div>
          <div className="text-4xl font-extrabold text-[#30D158] tracking-tight mb-1 font-manrope">
            {(stats.paid_unlocks || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-gray-500 font-mono-code">Vía Red Bitcoin</span>
        </div>

        <div className="pf-panel p-6 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
            <span className="font-extrabold text-[11px] uppercase tracking-wider text-gray-400">Ingresos acumulados</span>
            <DollarSign className="w-4 h-4 text-[#FF9F0A]" />
          </div>
          <div className="text-4xl font-extrabold text-white tracking-tight mb-1 font-manrope">
            ${(stats.total_revenue || (stats.paid_unlocks || 0) * 500).toLocaleString()} <span className="text-sm font-semibold text-gray-400">USD</span>
          </div>
          <span className="text-[11px] text-gray-500 font-mono-code">Tarifa de desbloqueo</span>
        </div>
      </div>

      {/* Notes & Passwords Table */}
      <div className="pf-panel overflow-hidden">
        <div className="p-5 border-b border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#1B1B1E]/40">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <FileText className="w-4 h-4 text-[#FF9F0A]" />
            <span>Todas las Notas y Contraseñas ({filteredNotes.length})</span>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Buscar por slug, contenido o contraseña..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#0E0E11] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF9F0A] font-mono-code transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#0E0E11] border-b border-white/[0.06] text-gray-400 font-bold uppercase text-[10px] tracking-wider font-manrope">
              <tr>
                <th className="px-6 py-3.5">Nota / Slug</th>
                <th className="px-6 py-3.5">Contraseña de la Nota</th>
                <th className="px-6 py-3.5">Contenido de la Nota</th>
                <th className="px-6 py-3.5">Última actualización</th>
                <th className="px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredNotes.map((note, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-mono-code">
                    <div className="flex items-center gap-2">
                      <span className="text-[#FF9F0A] font-bold">/{note.slug}</span>
                      <button
                        onClick={() => handleCopy(`${window.location.origin}/${note.slug}`, `slug-${note.slug}`)}
                        title="Copiar enlace"
                        className="text-gray-500 hover:text-white transition-colors"
                      >
                        {copiedKey === `slug-${note.slug}` ? (
                          <Check className="w-3.5 h-3.5 text-[#30D158]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-mono-code">
                    {note.has_password ? (
                      <div className="flex items-center gap-2">
                        <span className="pf-pill bg-red-500/10 text-[#FF6961] border border-red-500/25">
                          <Lock className="w-3 h-3" />
                          {note.password_plain || "Hash Bcrypt"}
                        </span>
                        {note.password_plain && (
                          <button
                            onClick={() => handleCopy(note.password_plain, `pwd-${note.slug}`)}
                            className="text-gray-400 hover:text-white"
                            title="Copiar contraseña"
                          >
                            {copiedKey === `pwd-${note.slug}` ? <Check className="w-3.5 h-3.5 text-[#30D158]" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <button
                          onClick={() => handleUnlockNote(note.slug)}
                          className="text-[11px] text-[#30D158] hover:underline flex items-center gap-1"
                        >
                          <Unlock className="w-3 h-3" />
                          Desbloquear
                        </button>
                      </div>
                    ) : (
                      <span className="pf-pill pf-pill-ok">
                        <Globe className="w-3 h-3" />
                        Pública
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-gray-300 text-xs font-mono-code max-w-xs truncate">
                    {note.content || note.preview || <span className="text-gray-600">Nota vacía</span>}
                  </td>

                  <td className="px-6 py-4 text-gray-400 text-xs font-mono-code">
                    {new Date(note.updated_at || note.created_at).toLocaleString()}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <a
                      href={`/${note.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="pf-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
                    >
                      <span>Abrir</span>
                      <ExternalLink className="w-3 h-3 text-gray-500" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
