import { useState, useEffect, useRef, useMemo } from "react";
import api, { PUBLIC_SITE_ORIGIN } from "../utils/api";
import { detectNotePatterns, autoFormatContent } from "../utils/patternScanner";
import {
  FileText, Lock, Unlock, KeyRound, Copy, Check, Save,
  Trash2, ExternalLink, Sparkles, Pin, Eye, Activity,
  CreditCard, User, Globe, Shield, DollarSign, X, RefreshCw, Download
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
      closedby="any"
      onClose={onClose}
      aria-labelledby="inspector-dialog-title"
      className="pf-dialog w-full max-w-5xl m-auto text-[#EDEDED] font-manrope"
    >
      <div className="p-6 flex flex-col gap-5 max-h-[88vh] overflow-y-auto">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 flex items-center justify-center text-[#FF9F0A]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="inspector-dialog-title" className="text-lg font-extrabold text-white tracking-tight">
                  Inspector & Editor Master: <span className="text-[#FF9F0A] font-mono-code">/{note.slug}</span>
                </h3>
                {note.is_deleted && (
                  <span className="pf-pill pf-pill-danger">En Papelera</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 font-mono-code mt-0.5">
                <span>ID: {note.id?.slice(0, 8)}...</span>
                <span>·</span>
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
              className="pf-btn-secondary px-3 py-2 text-xs flex items-center gap-1.5"
            >
              <span>Abrir Pública</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </a>
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="pf-btn-secondary px-3 py-2 text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#FF9F0A]" />
              <span>.TXT</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar inspector"
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-3">
          <button
            type="button"
            onClick={() => setActiveSubTab("editor")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              activeSubTab === "editor"
                ? "bg-[#FF9F0A] text-black shadow"
                : "bg-[#1B1B1E] text-gray-300 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Contenido, Slug & Contraseña</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("patterns")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              activeSubTab === "patterns"
                ? "bg-[#FF9F0A] text-black shadow"
                : "bg-[#1B1B1E] text-gray-300 hover:text-white"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Datos Extraídos en esta Nota ({patterns.totalFindings})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("history")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              activeSubTab === "history"
                ? "bg-[#FF9F0A] text-black shadow"
                : "bg-[#1B1B1E] text-gray-300 hover:text-white"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Pagos ({historyData.payments.length}) & Auditoría ({historyData.logs.length})</span>
          </button>
        </div>

        {activeSubTab === "editor" && (
          <form method="post" onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Slug, Password, Pin */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Slug */}
              <div className="pf-well p-3.5 flex flex-col gap-1.5">
                <label htmlFor="insp-slug" className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                  Slug / URL de la Nota
                </label>
                <div className="flex items-center bg-[#141416] border border-white/[0.08] rounded-xl px-3 py-2">
                  <span className="text-gray-500 font-mono-code text-xs mr-1">/</span>
                  <input
                    id="insp-slug"
                    name="slug"
                    type="text"
                    required
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm text-[#FF9F0A] font-bold font-mono-code focus:outline-none"
                  />
                </div>
              </div>

              {/* Password of the Note */}
              <div className="pf-well p-3.5 flex flex-col gap-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="insp-pwd" className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#FF9F0A]" />
                    <span>Contraseña de Bloqueo de la Nota</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {note.has_password ? (
                      <span className="text-[10px] font-extrabold text-[#FF6961] uppercase">
                        Protegida {note.password_plain ? `(Clave: ${note.password_plain})` : "(Hash Bcrypt)"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold text-[#30D158] uppercase">
                        Pública (Sin clave)
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
                        ? "Hash Bcrypt activo — escribe nueva clave para reemplazarla"
                        : "Sin contraseña (escribe aquí para bloquear o cambiar clave)..."
                    }
                    className="flex-1 min-w-[200px] bg-[#141416] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white font-mono-code focus:border-[#FF9F0A]"
                  />

                  {editPassword && (
                    <button
                      type="button"
                      onClick={() => copyText(editPassword, "insp-pwd-copy")}
                      className="pf-btn-secondary px-3 py-2 text-xs flex items-center gap-1.5"
                    >
                      {copiedId === "insp-pwd-copy" ? <Check className="w-3.5 h-3.5 text-[#30D158]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copiar Clave</span>
                    </button>
                  )}

                  {(note.has_password || editPassword) && (
                    <button
                      type="button"
                      onClick={handleClearPassword}
                      className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-[#30D158] border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Quitar Clave</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="insp-content" className="text-xs font-extrabold text-gray-300">
                  Contenido Completo de la Nota ({editContent.split("\n").length} líneas)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoFormat}
                    className="pf-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 text-[#FF9F0A]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Formatear</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(editContent, "insp-content-copy")}
                    className="pf-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
                  >
                    {copiedId === "insp-content-copy" ? <Check className="w-3.5 h-3.5 text-[#30D158]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === "insp-content-copy" ? "Copiado" : "Copiar Todo"}</span>
                  </button>
                </div>
              </div>

              <textarea
                id="insp-content"
                name="content"
                rows={13}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Esta nota está vacía..."
                className="w-full bg-[#09090B] border border-white/[0.1] rounded-2xl p-4 text-xs sm:text-sm text-[#EDEDED] font-mono-code leading-relaxed focus:border-[#FF9F0A]"
              />
            </div>

            {/* Admin Notes & Pin */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pf-well p-3.5">
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label htmlFor="insp-admin-notes" className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                  Anotación Interna del Administrador (Solo visible en Admin)
                </label>
                <input
                  id="insp-admin-notes"
                  name="admin_notes"
                  type="text"
                  value={editAdminNotes}
                  onChange={(e) => setEditAdminNotes(e.target.value)}
                  placeholder="Añade comentarios privados sobre esta nota..."
                  className="w-full bg-[#141416] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editPinned}
                  onChange={(e) => setEditPinned(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#FF9F0A]"
                />
                <Pin className="w-4 h-4 text-[#FF9F0A]" />
                <span className="text-xs font-extrabold text-white">
                  Fijar Nota (Destacada)
                </span>
              </label>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.08]">
              <div className="flex items-center gap-2">
                {note.is_deleted ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onRestoreNote(note.slug)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-[#30D158] border border-emerald-500/30 text-xs font-extrabold"
                    >
                      Restaurar de Papelera
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteNote(note.slug, true)}
                      className="px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-[#FF6961] border border-red-500/30 text-xs font-extrabold flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Definitivamente</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => onDeleteNote(note.slug, false)}
                    className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-[#FF6961] border border-red-500/25 text-xs font-extrabold flex items-center gap-1.5"
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
                  className="pf-btn-secondary px-4 py-2.5 text-xs font-bold"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="pf-btn-primary px-6 py-2.5 text-xs font-extrabold flex items-center gap-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Guardar Todos los Cambios</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {activeSubTab === "patterns" && (
          <div className="space-y-4">
            {patterns.totalFindings === 0 ? (
              <div className="pf-well p-10 text-center text-gray-500 text-xs">
                No se detectaron tarjetas, contraseñas en texto, proxies ni claves en el cuerpo de esta nota.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cards */}
                {patterns.cards.length > 0 && (
                  <div className="pf-well p-4 space-y-2.5">
                    <div className="text-xs font-extrabold text-[#FF9F0A] uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" />
                      <span>Tarjetas Detectadas ({patterns.cards.length})</span>
                    </div>
                    {patterns.cards.map((c, idx) => (
                      <div key={idx} className="bg-[#141416] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between gap-2 font-mono-code text-xs">
                        <div>
                          <div className="text-white font-bold">{c.formatted}</div>
                          <div className="text-[11px] text-gray-400">
                            {c.brand} · Exp: {c.exp || "N/A"} · CVV: {c.cvv || "N/A"} ·{" "}
                            <span className={c.isValid ? "text-[#30D158]" : "text-[#FF6961]"}>
                              {c.isValid ? "Luhn Válido" : "Luhn Inválido"}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyText(`${c.digits}|${c.exp || ""}|${c.cvv || ""}`, `card-${idx}`)}
                          className="pf-btn-secondary px-2.5 py-1.5 text-[11px]"
                        >
                          {copiedId === `card-${idx}` ? "Copiado" : "Copiar"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* In-text Passwords */}
                {patterns.passwords.length > 0 && (
                  <div className="pf-well p-4 space-y-2.5">
                    <div className="text-xs font-extrabold text-[#FF6961] uppercase tracking-wider flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4" />
                      <span>Contraseñas en Texto ({patterns.passwords.length})</span>
                    </div>
                    {patterns.passwords.map((p, idx) => (
                      <div key={idx} className="bg-[#141416] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between gap-2 font-mono-code text-xs">
                        <div className="truncate">
                          <span className="text-gray-400">{p.full}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyText(p.value, `pwd-${idx}`)}
                          className="pf-btn-secondary px-2.5 py-1.5 text-[11px] shrink-0"
                        >
                          {copiedId === `pwd-${idx}` ? "Copiada" : "Copiar"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Users & Emails */}
                {patterns.users.length > 0 && (
                  <div className="pf-well p-4 space-y-2.5">
                    <div className="text-xs font-extrabold text-[#30D158] uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      <span>Usuarios & Correos ({patterns.users.length})</span>
                    </div>
                    {patterns.users.map((u, idx) => (
                      <div key={idx} className="bg-[#141416] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between gap-2 font-mono-code text-xs">
                        <span className="text-white truncate">{u.value}</span>
                        <button
                          type="button"
                          onClick={() => copyText(u.value, `usr-${idx}`)}
                          className="pf-btn-secondary px-2.5 py-1.5 text-[11px]"
                        >
                          {copiedId === `usr-${idx}` ? "Copiado" : "Copiar"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Proxies, Crypto & Keys */}
                {(patterns.proxies.length > 0 || patterns.crypto.length > 0 || patterns.keys.length > 0) && (
                  <div className="pf-well p-4 space-y-2.5">
                    <div className="text-xs font-extrabold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="w-4 h-4" />
                      <span>Proxies, Crypto & API Keys</span>
                    </div>
                    {patterns.proxies.map((pr, idx) => (
                      <div key={`pr-${idx}`} className="bg-[#141416] border border-white/[0.06] rounded-xl p-2.5 flex items-center justify-between font-mono-code text-xs">
                        <span className="text-purple-300 truncate">Proxy: {pr.raw}</span>
                        <button type="button" onClick={() => copyText(pr.raw, `pr-${idx}`)} className="pf-btn-secondary px-2 py-1 text-[11px]">Copiar</button>
                      </div>
                    ))}
                    {patterns.crypto.map((cr, idx) => (
                      <div key={`cr-${idx}`} className="bg-[#141416] border border-white/[0.06] rounded-xl p-2.5 flex items-center justify-between font-mono-code text-xs">
                        <span className="text-amber-300 truncate">{cr.badge}: {cr.address}</span>
                        <button type="button" onClick={() => copyText(cr.address, `cr-${idx}`)} className="pf-btn-secondary px-2 py-1 text-[11px]">Copiar</button>
                      </div>
                    ))}
                    {patterns.keys.map((k, idx) => (
                      <div key={`k-${idx}`} className="bg-[#141416] border border-white/[0.06] rounded-xl p-2.5 flex items-center justify-between font-mono-code text-xs">
                        <span className="text-sky-300 truncate">{k.type}: {k.key}</span>
                        <button type="button" onClick={() => copyText(k.key, `k-${idx}`)} className="pf-btn-secondary px-2 py-1 text-[11px]">Copiar</button>
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
            <div className="pf-well p-4 space-y-2.5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                Órdenes de Pago de esta Nota ({historyData.payments.length})
              </h4>
              {historyData.payments.length === 0 ? (
                <p className="text-xs text-gray-500 py-4">Sin órdenes de pago generadas.</p>
              ) : (
                historyData.payments.map((p) => (
                  <div key={p.id} className="bg-[#141416] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between text-xs font-mono-code">
                    <div>
                      <div className="text-white font-bold">{p.invoice_id}</div>
                      <div className="text-[11px] text-gray-400">${p.amount} USD · {new Date(p.created_at).toLocaleString()}</div>
                    </div>
                    <span className={`pf-pill ${p.status === "paid" ? "pf-pill-ok" : "pf-pill-warm"}`}>
                      {p.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pf-well p-4 space-y-2.5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                Eventos de Seguridad Recientes ({historyData.logs.length})
              </h4>
              {historyData.logs.length === 0 ? (
                <p className="text-xs text-gray-500 py-4">Sin registros de auditoría para esta nota.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {historyData.logs.map((l) => (
                    <div key={l.id} className="bg-[#141416] border border-white/[0.06] rounded-xl p-2.5 text-xs">
                      <div className="flex items-center justify-between font-mono-code text-[11px]">
                        <span className="text-[#FF9F0A] font-bold">{l.action}</span>
                        <span className="text-gray-500">{new Date(l.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-gray-300 mt-1">{l.details}</div>
                      <div className="text-[10px] text-gray-500 font-mono-code mt-0.5">IP: {l.ip}</div>
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
