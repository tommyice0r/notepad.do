import { useState, useEffect, useRef, useMemo } from "react";
import api, { PUBLIC_SITE_ORIGIN } from "../utils/api";
import { detectNotePatterns, autoFormatContent } from "../utils/patternScanner";
import {
  FileText, Lock, Unlock, KeyRound, Copy, Check, Save,
  Trash2, ExternalLink, Sparkles, Pin, Eye, Activity,
  CreditCard, User, Globe, Shield, X, RefreshCw, Download
} from "lucide-react";

export default function NoteInspectorModal({
  note,
  onClose,
  onSaveNote,
  onDeleteNote,
  onRestoreNote,
  loading
}) {
  const dialogRef = useRef(null);
  const [activeSubTab, setActiveSubTab] = useState("editor"); // "editor" | "patterns" | "history"
  const [editSlug, setEditSlug] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [editPinned, setEditPinned] = useState(false);
  const [editAdminNotes, setEditAdminNotes] = useState("");

  const [historyData, setHistoryData] = useState({ payments: [], logs: [] });
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && note && !dialog.open) {
      dialog.showModal();
    }
    if (note) {
      setEditSlug(note.slug || "");
      setEditContent(note.content || "");
      setEditPassword(note.password_plain || "");
      setPasswordTouched(false);
      setEditPinned(Boolean(note.is_pinned));
      setEditAdminNotes(note.admin_notes || "");
      setActiveSubTab("editor");

      // Fetch note payment & audit history
      api.get(`/admin/notes/${encodeURIComponent(note.slug)}`)
        .then((res) => {
          setHistoryData({
            payments: res.data.payments || [],
            logs: res.data.logs || []
          });
        })
        .catch(() => {});
    }
  }, [note]);

  const patterns = useMemo(() => detectNotePatterns(editContent, editSlug), [editContent, editSlug]);

  if (!note) return null;

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text || "");
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([editContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notepad-do-${editSlug}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAutoFormat = () => {
    setEditContent(autoFormatContent(editContent));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveNote(note.slug, {
      new_slug: editSlug.trim(),
      content: editContent,
      password: editPassword.trim(),
      update_password: passwordTouched,
      is_pinned: editPinned,
      admin_notes: editAdminNotes
    });
  };

  const handleClearPassword = () => {
    setEditPassword("");
    setPasswordTouched(true);
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="inspector-dialog-title"
      className="console-dialog w-full max-w-4xl m-auto text-[#F4F4F5]"
    >
      <div className="p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="inspector-dialog-title" className="text-base font-bold text-white tracking-tight">
                  Inspector: <span className="text-[#F59E0B] font-mono-code">/{note.slug}</span>
                </h3>
                {note.is_deleted && (
                  <span className="console-badge console-badge-rose">En Papelera</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-zinc-400 font-mono-code mt-0.5">
                <span>Vistas: {note.views_count || 0}</span>
                <span>·</span>
                <span>IP: {note.last_ip || "N/A"}</span>
                <span>·</span>
                <span>Tamaño: {(editContent.length || 0).toLocaleString()} bytes</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`${PUBLIC_SITE_ORIGIN}/${note.slug}`}
              target="_blank"
              rel="noreferrer"
              className="console-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              <span>Abrir Nota</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </a>
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="console-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Descargar .txt</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar inspector"
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#09090B] border border-white/[0.06] rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveSubTab("editor")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === "editor"
                ? "bg-white/[0.1] text-white shadow-sm border border-white/[0.1]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Contenido & Clave</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("patterns")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === "patterns"
                ? "bg-white/[0.1] text-white shadow-sm border border-white/[0.1]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Hallazgos ({patterns.totalFindings})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("history")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === "history"
                ? "bg-white/[0.1] text-white shadow-sm border border-white/[0.1]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Pagos & Logs</span>
          </button>
        </div>

        {activeSubTab === "editor" && (
          <form method="post" onSubmit={handleSubmit} className="space-y-4">
            {/* Slug, Password, Pin */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Slug */}
              <div className="console-well p-3 flex flex-col gap-1">
                <label htmlFor="insp-slug" className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Slug / URL
                </label>
                <div className="flex items-center bg-[#111113] border border-white/[0.08] rounded-lg px-2.5 py-1.5">
                  <span className="text-zinc-500 font-mono-code text-xs mr-1">/</span>
                  <input
                    id="insp-slug"
                    name="slug"
                    type="text"
                    required
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    className="w-full bg-transparent text-xs text-[#F59E0B] font-semibold font-mono-code focus:outline-none"
                  />
                </div>
              </div>

              {/* Password of the Note */}
              <div className="console-well p-3 flex flex-col gap-1 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="insp-pwd" className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Contraseña de la Nota</span>
                  </label>
                  <div>
                    {note.has_password ? (
                      <span className="console-badge console-badge-rose text-[10px]">
                        Protegida
                      </span>
                    ) : (
                      <span className="console-badge console-badge-emerald text-[10px]">
                        Pública
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    id="insp-pwd"
                    name="password"
                    type="text"
                    value={editPassword}
                    onChange={(e) => {
                      setEditPassword(e.target.value);
                      setPasswordTouched(true);
                    }}
                    placeholder={
                      note.is_bcrypt_only && !passwordTouched
                        ? "Hash Bcrypt activo (escribe nueva clave para actualizar)"
                        : "Sin contraseña..."
                    }
                    className="flex-1 min-w-[160px] bg-[#111113] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white font-mono-code focus:border-[#F59E0B] focus:outline-none"
                  />

                  {editPassword && (
                    <button
                      type="button"
                      onClick={() => copyText(editPassword, "insp-pwd-copy")}
                      className="console-btn-secondary px-2.5 py-1.5 text-xs flex items-center gap-1"
                    >
                      {copiedId === "insp-pwd-copy" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copiar</span>
                    </button>
                  )}

                  {(note.has_password || editPassword) && (
                    <button
                      type="button"
                      onClick={handleClearPassword}
                      className="console-btn-danger px-2.5 py-1.5 text-xs flex items-center gap-1"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Desbloquear</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="insp-content" className="text-xs font-semibold text-zinc-300">
                  Contenido ({editContent.split("\n").length} líneas)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoFormat}
                    className="console-btn-secondary px-2.5 py-1 text-xs flex items-center gap-1 text-[#F59E0B]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Formato</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(editContent, "insp-content-copy")}
                    className="console-btn-secondary px-2.5 py-1 text-xs flex items-center gap-1"
                  >
                    {copiedId === "insp-content-copy" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === "insp-content-copy" ? "Copiado" : "Copiar"}</span>
                  </button>
                </div>
              </div>

              <textarea
                id="insp-content"
                name="content"
                rows={11}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Nota vacía..."
                className="w-full bg-[#09090B] border border-white/[0.08] rounded-xl p-3.5 text-xs text-zinc-200 font-mono-code leading-relaxed focus:border-[#F59E0B] focus:outline-none"
              />
            </div>

            {/* Admin Notes & Pin */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center console-well p-3">
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label htmlFor="insp-admin-notes" className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Nota Interna del Administrador
                </label>
                <input
                  id="insp-admin-notes"
                  name="admin_notes"
                  type="text"
                  value={editAdminNotes}
                  onChange={(e) => setEditAdminNotes(e.target.value)}
                  placeholder="Comentarios internos..."
                  className="w-full bg-[#111113] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white focus:border-[#F59E0B] focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none pt-4">
                <input
                  type="checkbox"
                  checked={editPinned}
                  onChange={(e) => setEditPinned(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#F59E0B]"
                />
                <Pin className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span className="text-xs font-semibold text-zinc-200">
                  Fijar Nota
                </span>
              </label>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/[0.08]">
              <div>
                {note.is_deleted ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onRestoreNote(note.slug)}
                      className="console-btn-secondary px-3 py-2 text-xs"
                    >
                      Restaurar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteNote(note.slug, true)}
                      className="console-btn-danger px-3 py-2 text-xs flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Definitivamente</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onDeleteNote(note.slug, false)}
                    className="console-btn-danger px-3 py-2 text-xs flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Enviar a Papelera</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="console-btn-secondary px-3.5 py-2 text-xs"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="console-btn-primary px-4 py-2 text-xs flex items-center gap-1.5"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {activeSubTab === "patterns" && (
          <div className="space-y-4">
            {patterns.totalFindings === 0 ? (
              <div className="console-well p-10 text-center text-zinc-500 text-xs">
                No se detectaron tarjetas, contraseñas, proxies ni claves en el texto de esta nota.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Cards */}
                {patterns.cards.length > 0 && (
                  <div className="console-well p-3.5 space-y-2">
                    <div className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" />
                      <span>Tarjetas ({patterns.cards.length})</span>
                    </div>
                    {patterns.cards.map((c, idx) => (
                      <div key={idx} className="bg-[#111113] border border-white/[0.06] rounded-lg p-2.5 flex items-center justify-between gap-2 font-mono-code text-xs">
                        <div>
                          <div className="text-white font-medium">{c.formatted}</div>
                          <div className="text-[10px] text-zinc-400">
                            {c.brand} · Exp: {c.exp || "N/A"} · CVV: {c.cvv || "N/A"} ·{" "}
                            <span className={c.isValid ? "text-emerald-400" : "text-rose-400"}>
                              {c.isValid ? "Luhn Válido" : "Luhn Inválido"}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyText(`${c.digits}|${c.exp || ""}|${c.cvv || ""}`, `card-${idx}`)}
                          className="console-btn-secondary px-2.5 py-1 text-[11px]"
                        >
                          {copiedId === `card-${idx}` ? "Copiado" : "Copiar"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* In-text Passwords */}
                {patterns.passwords.length > 0 && (
                  <div className="console-well p-3.5 space-y-2">
                    <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4" />
                      <span>Contraseñas en Texto ({patterns.passwords.length})</span>
                    </div>
                    {patterns.passwords.map((p, idx) => (
                      <div key={idx} className="bg-[#111113] border border-white/[0.06] rounded-lg p-2.5 flex items-center justify-between gap-2 font-mono-code text-xs">
                        <div className="truncate pr-2">
                          <span className="text-zinc-400">{p.full}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyText(p.value, `pwd-${idx}`)}
                          className="console-btn-secondary px-2.5 py-1 text-[11px] shrink-0"
                        >
                          {copiedId === `pwd-${idx}` ? "Copiada" : "Copiar"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Users & Emails */}
                {patterns.users.length > 0 && (
                  <div className="console-well p-3.5 space-y-2">
                    <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      <span>Usuarios & Correos ({patterns.users.length})</span>
                    </div>
                    {patterns.users.map((u, idx) => (
                      <div key={idx} className="bg-[#111113] border border-white/[0.06] rounded-lg p-2.5 flex items-center justify-between gap-2 font-mono-code text-xs">
                        <span className="text-white truncate">{u.value}</span>
                        <button
                          type="button"
                          onClick={() => copyText(u.value, `usr-${idx}`)}
                          className="console-btn-secondary px-2.5 py-1 text-[11px]"
                        >
                          {copiedId === `usr-${idx}` ? "Copiado" : "Copiar"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Proxies, Crypto & Keys */}
                {(patterns.proxies.length > 0 || patterns.crypto.length > 0 || patterns.keys.length > 0) && (
                  <div className="console-well p-3.5 space-y-2">
                    <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="w-4 h-4" />
                      <span>Proxies, Crypto & Claves</span>
                    </div>
                    {patterns.proxies.map((pr, idx) => (
                      <div key={`pr-${idx}`} className="bg-[#111113] border border-white/[0.06] rounded-lg p-2 flex items-center justify-between font-mono-code text-xs">
                        <span className="text-purple-300 truncate">Proxy: {pr.raw}</span>
                        <button type="button" onClick={() => copyText(pr.raw, `pr-${idx}`)} className="console-btn-secondary px-2 py-0.5 text-[11px]">Copiar</button>
                      </div>
                    ))}
                    {patterns.crypto.map((cr, idx) => (
                      <div key={`cr-${idx}`} className="bg-[#111113] border border-white/[0.06] rounded-lg p-2 flex items-center justify-between font-mono-code text-xs">
                        <span className="text-amber-300 truncate">{cr.badge}: {cr.address}</span>
                        <button type="button" onClick={() => copyText(cr.address, `cr-${idx}`)} className="console-btn-secondary px-2 py-0.5 text-[11px]">Copiar</button>
                      </div>
                    ))}
                    {patterns.keys.map((k, idx) => (
                      <div key={`k-${idx}`} className="bg-[#111113] border border-white/[0.06] rounded-lg p-2 flex items-center justify-between font-mono-code text-xs">
                        <span className="text-sky-300 truncate">{k.type}: {k.key}</span>
                        <button type="button" onClick={() => copyText(k.key, `k-${idx}`)} className="console-btn-secondary px-2 py-0.5 text-[11px]">Copiar</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeSubTab === "history" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="console-well p-4 space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Órdenes OxaPay ({historyData.payments.length})
              </h4>
              {historyData.payments.length === 0 ? (
                <p className="text-xs text-zinc-500 py-3">Sin pagos registrados para esta nota.</p>
              ) : (
                historyData.payments.map((p) => (
                  <div key={p.id} className="bg-[#111113] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between text-xs font-mono-code">
                    <div>
                      <div className="text-white font-medium">{p.invoice_id}</div>
                      <div className="text-[11px] text-zinc-400">${p.amount} USD · {new Date(p.created_at).toLocaleString()}</div>
                    </div>
                    <span className={`console-badge ${p.status === "paid" ? "console-badge-emerald" : "console-badge-amber"}`}>
                      {p.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="console-well p-4 space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Historial de Seguridad ({historyData.logs.length})
              </h4>
              {historyData.logs.length === 0 ? (
                <p className="text-xs text-zinc-500 py-3">Sin registros de auditoría para esta nota.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {historyData.logs.map((l) => (
                    <div key={l.id} className="bg-[#111113] border border-white/[0.06] rounded-xl p-2.5 text-xs">
                      <div className="flex items-center justify-between font-mono-code text-[11px]">
                        <span className="text-[#F59E0B] font-semibold">{l.action}</span>
                        <span className="text-zinc-500">{new Date(l.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-zinc-300 mt-1">{l.details}</div>
                      <div className="text-[10px] text-zinc-500 font-mono-code mt-0.5">IP: {l.ip}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
