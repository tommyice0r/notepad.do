import { useState, useEffect } from "react";
import api from "../utils/api";
import { 
  FileText, CheckCircle2, DollarSign, Search, 
  ExternalLink, Copy, Check, RefreshCw, Lock, Globe, Shield,
  KeyRound, LogOut, AlertCircle
} from "lucide-react";

export default function Admin() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem("notepad_admin_key") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const [stats, setStats] = useState({ total_notes: 0, paid_unlocks: 0 });
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedSlug, setCopiedSlug] = useState(null);

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
    setAdminKey("");
    setIsAuthenticated(false);
    setNotes([]);
    setLoginInput("");
  };

  const handleCopy = (slug) => {
    const fullUrl = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 1800);
  };

  const filteredNotes = notes.filter(n => {
    const s = n.slug || "";
    return s.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Admin Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex-1 w-full max-w-md mx-auto my-auto flex flex-col items-center justify-center p-6 pf-panel">
        <div className="w-14 h-14 rounded-2xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 flex items-center justify-center text-[#FF9F0A] mb-4 shadow-[0_4px_16px_rgba(255,159,10,0.15)]">
          <Shield className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-extrabold text-white tracking-tight mb-1 font-manrope">
          Acceso de Administración
        </h2>
        <p className="text-xs text-gray-400 text-center mb-5 leading-relaxed">
          Este panel está restringido exclusivamente a administradores autorizados de Notepad.do.
        </p>

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
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pf-panel p-6">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#FF9F0A] block mb-1">
            Centro de Control Protegido
          </span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Panel de Administración</h2>
          <p className="text-xs text-gray-400 mt-1">Métricas operativas seguras sin exposición de hashes ni claves privadas.</p>
        </div>

        <div className="flex items-center gap-2">
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
        
        {/* Metric 1 */}
        <div className="pf-panel p-6 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
            <span className="font-extrabold text-[11px] uppercase tracking-wider text-gray-400">Total de notas creadas</span>
            <FileText className="w-4 h-4 text-[#FF9F0A]" />
          </div>
          <div className="text-4xl font-extrabold text-white tracking-tight mb-1 font-manrope">
            {stats.total_notes.toLocaleString()}
          </div>
          <span className="text-[11px] text-gray-500 font-mono-code">Nodos almacenados en la red</span>
        </div>

        {/* Metric 2 */}
        <div className="pf-panel p-6 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
            <span className="font-extrabold text-[11px] uppercase tracking-wider text-gray-400">Desbloqueos pagados</span>
            <CheckCircle2 className="w-4 h-4 text-[#30D158]" />
          </div>
          <div className="text-4xl font-extrabold text-[#30D158] tracking-tight mb-1 font-manrope">
            {stats.paid_unlocks.toLocaleString()}
          </div>
          <span className="text-[11px] text-gray-500 font-mono-code">Vía Red Bitcoin</span>
        </div>

        {/* Metric 3 */}
        <div className="pf-panel p-6 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
            <span className="font-extrabold text-[11px] uppercase tracking-wider text-gray-400">Ingresos acumulados</span>
            <DollarSign className="w-4 h-4 text-[#FF9F0A]" />
          </div>
          <div className="text-4xl font-extrabold text-white tracking-tight mb-1 font-manrope">
            ${(stats.paid_unlocks * 500).toLocaleString()} <span className="text-sm font-semibold text-gray-400">USD</span>
          </div>
          <span className="text-[11px] text-gray-500 font-mono-code">Tarifa de rescate $500</span>
        </div>

      </div>

      {/* Notes Registry Table */}
      <div className="pf-panel overflow-hidden">
        
        {/* Table Filter Bar */}
        <div className="p-5 border-b border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#1B1B1E]/40">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <FileText className="w-4 h-4 text-[#FF9F0A]" />
            <span>Notas recientes ({filteredNotes.length})</span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Buscar por slug..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#0E0E11] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF9F0A] font-mono-code transition-all"
            />
          </div>
        </div>

        {/* Table Rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#0E0E11] border-b border-white/[0.06] text-gray-400 font-bold uppercase text-[10px] tracking-wider font-manrope">
              <tr>
                <th className="px-6 py-3.5">Enlace de la nota</th>
                <th className="px-6 py-3.5">Estado</th>
                <th className="px-6 py-3.5">Vista previa segura</th>
                <th className="px-6 py-3.5">Última actualización</th>
                <th className="px-6 py-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredNotes.map((note, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  
                  {/* Slug / Link */}
                  <td className="px-6 py-4 font-mono-code">
                    <div className="flex items-center gap-2">
                      <span className="text-[#FF9F0A] font-medium">/{note.slug}</span>
                      <button
                        onClick={() => handleCopy(note.slug)}
                        title="Copiar enlace"
                        className="text-gray-500 hover:text-white transition-colors"
                      >
                        {copiedSlug === note.slug ? (
                          <Check className="w-3.5 h-3.5 text-[#30D158]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {note.has_password ? (
                      <span className="pf-pill bg-red-500/10 text-[#FF6961] border border-red-500/25">
                        <Lock className="w-3 h-3" />
                        Protegida
                      </span>
                    ) : (
                      <span className="pf-pill pf-pill-ok">
                        <Globe className="w-3 h-3" />
                        Pública
                      </span>
                    )}
                  </td>

                  {/* Safe Preview */}
                  <td className="px-6 py-4 text-gray-400 text-xs font-mono-code max-w-xs truncate">
                    {note.has_password ? (
                      <span className="text-gray-500 italic">Contenido cifrado</span>
                    ) : (
                      note.preview || <span className="text-gray-600">Nota vacía</span>
                    )}
                  </td>

                  {/* Updated At */}
                  <td className="px-6 py-4 text-gray-400 text-xs font-mono-code">
                    {new Date(note.updated_at || note.created_at).toLocaleString()}
                  </td>

                  {/* Open Link */}
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

              {filteredNotes.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 font-manrope">
                    {searchTerm ? "No se encontraron notas con ese ID." : "No hay notas creadas aún."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
