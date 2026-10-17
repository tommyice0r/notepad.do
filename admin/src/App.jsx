import { useState, useEffect } from "react";
import api, { getSavedAdminKey, saveAdminKey, clearAdminKey } from "./utils/api";
import { detectNotePatterns } from "./utils/patternScanner";
import CreateNoteModal from "./components/CreateNoteModal";
import PasswordModal from "./components/PasswordModal";
import {
  FileText, Shield, KeyRound, LogOut, RefreshCw, Search,
  Plus, Download, Lock, Unlock, Eye, Trash2, Pin, ExternalLink,
  Copy, Check, AlertCircle, DollarSign, Database
} from "lucide-react";

export default function App() {
  const [adminKey, setAdminKey] = useState(() => getSavedAdminKey());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const [stats, setStats] = useState({ total_notes: 0, paid_unlocks: 0 });
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedSlug, setCopiedSlug] = useState(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalMode, setCreateModalMode] = useState("create");
  const [selectedNoteForPwd, setSelectedNoteForPwd] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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
        saveAdminKey(key, true);
        setAdminKey(key);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setLoginError("Clave de administrador no válida.");
          setIsAuthenticated(false);
        } else {
          setLoginError("Error de conexión con el backend.");
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
    clearAdminKey();
    setAdminKey("");
    setIsAuthenticated(false);
    setNotes([]);
    setLoginInput("");
  };

  const handleCopy = (text, slug) => {
    navigator.clipboard.writeText(text);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 1800);
  };

  const handleCreateNote = async (data) => {
    setActionLoading(true);
    try {
      await api.post("/admin/notes", data);
      setCreateModalOpen(false);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || "Error al crear la nota");
    } finally {
      setActionLoading(false);
    }
  };

  const handleScrapeImport = async (data) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/notes/${data.slug}/scrape`, { password: data.password });
      setCreateModalOpen(false);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || "Error al importar nota desde notepad.pw");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePassword = async (slug, pwd) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/notes/${slug}/password`, { password: pwd });
      setSelectedNoteForPwd(null);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || "Error al actualizar contraseña");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlockNote = async (slug) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/notes/${slug}/unlock`);
      setSelectedNoteForPwd(null);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || "Error al desbloquear nota");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNote = async (slug) => {
    if (!window.confirm(`¿Estás seguro de eliminar la nota /${slug}?`)) return;
    try {
      await api.delete(`/admin/notes/${slug}`);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || "Error al eliminar nota");
    }
  };

  const handleExportDB = async () => {
    try {
      const res = await api.get("/admin/export");
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `notepad-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } catch (err) {
      alert("Error al exportar base de datos");
    }
  };

  const filteredNotes = notes.filter((n) => {
    const s = n.slug || "";
    const c = n.content || "";
    const p = n.password_plain || "";
    const q = searchTerm.toLowerCase();
    return s.toLowerCase().includes(q) || c.toLowerCase().includes(q) || p.toLowerCase().includes(q);
  });

  // Login View
  if (!isAuthenticated) {
    return (
      <div className="flex-1 w-full min-h-screen flex items-center justify-center p-4 bg-[#060607]">
        <div className="w-full max-w-md bg-[#141416] border border-white/[0.08] rounded-2xl p-6 sm:p-8 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 flex items-center justify-center text-[#FF9F0A] mb-4 shadow-[0_4px_16px_rgba(255,159,10,0.15)]">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight mb-1 font-manrope">
            Notepad.do Master Admin
          </h2>
          <p className="text-xs text-gray-400 text-center mb-6 leading-relaxed font-manrope">
            Panel restringido. Ingresa tu clave maestra de administración.
          </p>

          <form onSubmit={handleLogin} className="w-full space-y-3 font-manrope">
            <input
              type="password"
              placeholder="Introduce clave de administración..."
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              className="w-full bg-[#0E0E11] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#FF9F0A] font-mono-code"
              autoFocus
            />

            {loginError && (
              <p className="text-xs text-[#FF6961] font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF9F0A] hover:bg-[#FF7B00] text-black font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              <span>{loading ? "Verificando..." : "Ingresar"}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060607] text-[#EDEDED] font-manrope p-4 sm:p-6 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Navbar */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#141416] border border-white/[0.08] p-5 rounded-2xl">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#FF9F0A] block mb-1">
            Centro de Control
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Notepad.do Master Admin
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setCreateModalMode("create");
              setCreateModalOpen(true);
            }}
            className="bg-[#FF9F0A] hover:bg-[#FF7B00] text-black font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nota</span>
          </button>

          <button
            onClick={() => {
              setCreateModalMode("import");
              setCreateModalOpen(true);
            }}
            className="bg-[#1B1B1E] hover:bg-[#252529] text-white border border-white/[0.08] font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#FF9F0A]" />
            <span>Importar de notepad.pw</span>
          </button>

          <button
            onClick={handleExportDB}
            className="bg-[#1B1B1E] hover:bg-[#252529] text-white border border-white/[0.08] font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all"
            title="Exportar base de datos en JSON"
          >
            <Database className="w-3.5 h-3.5 text-[#30D158]" />
            <span>Exportar BD</span>
          </button>

          <button
            onClick={() => fetchAdminData()}
            disabled={loading}
            className="p-2 rounded-xl bg-[#1B1B1E] hover:bg-[#252529] border border-white/[0.08] text-gray-300"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#FF9F0A]" : ""}`} />
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-[#FF6961] border border-red-500/20"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#141416] border border-white/[0.08] p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span className="font-extrabold uppercase tracking-wider text-[11px]">Total Notas</span>
            <FileText className="w-4 h-4 text-[#FF9F0A]" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {stats.total_notes.toLocaleString()}
          </div>
        </div>

        <div className="bg-[#141416] border border-white/[0.08] p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span className="font-extrabold uppercase tracking-wider text-[11px]">Desbloqueos BTC</span>
            <Unlock className="w-4 h-4 text-[#30D158]" />
          </div>
          <div className="text-3xl font-extrabold text-[#30D158]">
            {stats.paid_unlocks.toLocaleString()}
          </div>
        </div>

        <div className="bg-[#141416] border border-white/[0.08] p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span className="font-extrabold uppercase tracking-wider text-[11px]">Ingresos ($500/nota)</span>
            <DollarSign className="w-4 h-4 text-[#FF9F0A]" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            ${(stats.paid_unlocks * 500).toLocaleString()} USD
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#141416] border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#1B1B1E]/40">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <FileText className="w-4 h-4 text-[#FF9F0A]" />
            <span>Notas ({filteredNotes.length})</span>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por slug, contenido o clave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0E0E11] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF9F0A] font-mono-code"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#0E0E11] border-b border-white/[0.06] text-gray-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Slug</th>
                <th className="px-5 py-3.5">Contraseña (Plano / Hash)</th>
                <th className="px-5 py-3.5">Vista Previa</th>
                <th className="px-5 py-3.5">Última Modificación</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredNotes.map((note) => {
                const patterns = detectNotePatterns(note.content, note.slug);
                return (
                  <tr key={note.slug} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 font-mono-code">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/${note.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#FF9F0A] hover:underline font-semibold"
                        >
                          /{note.slug}
                        </a>
                        <button
                          onClick={() => handleCopy(`${window.location.origin}/${note.slug}`, note.slug)}
                          className="text-gray-500 hover:text-white"
                          title="Copiar URL"
                        >
                          {copiedSlug === note.slug ? <Check className="w-3.5 h-3.5 text-[#30D158]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-mono-code">
                      {note.has_password ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-[#FF6961] border border-red-500/20 text-[11px]">
                            <Lock className="w-3 h-3" />
                            {note.password_plain ? (
                              <span className="font-bold">{note.password_plain}</span>
                            ) : (
                              <span className="italic text-gray-400">Bcrypt</span>
                            )}
                          </span>
                          <button
                            onClick={() => setSelectedNoteForPwd(note)}
                            className="p-1 rounded hover:bg-white/[0.06] text-gray-400 hover:text-white"
                            title="Editar contraseña"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/20 text-[11px]">
                          <Unlock className="w-3 h-3" /> Libre
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 font-mono-code text-gray-400 max-w-xs truncate">
                      {patterns.cards.length > 0 && (
                        <span className="mr-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          💳 {patterns.cards.length} tarjeta(s)
                        </span>
                      )}
                      {note.preview || note.content || <span className="text-gray-600">Nota vacía</span>}
                    </td>

                    <td className="px-5 py-3.5 text-gray-400 font-mono-code text-[11px]">
                      {new Date(note.updated_at || note.created_at).toLocaleString()}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setSelectedNoteForPwd(note)}
                          className="p-1.5 rounded hover:bg-white/[0.06] text-gray-400 hover:text-white"
                          title="Gestionar contraseña"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.slug)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-[#FF6961]"
                          title="Eliminar nota"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredNotes.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-gray-500">
                    No se encontraron notas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
        note={selectedNoteForPwd}
        onClose={() => setSelectedNoteForPwd(null)}
        onSavePassword={handleSavePassword}
        onUnlockNote={handleUnlockNote}
        loading={actionLoading}
      />
    </div>
  );
}
