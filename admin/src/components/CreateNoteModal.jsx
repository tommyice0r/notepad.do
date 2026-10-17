import { useState, useEffect, useRef } from "react";
import {
  Plus, Globe, Lock, Sparkles, X, RefreshCw, DownloadCloud, Pin
} from "lucide-react";

export default function CreateNoteModal({
  isOpen,
  initialMode = "create", // "create" | "import"
  onClose,
  onCreateNote,
  onScrapeImport,
  loading
}) {
  const dialogRef = useRef(null);
  const [mode, setMode] = useState(initialMode);
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [password, setPassword] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const generateRandomSlug = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let res = "";
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSlug(res);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!slug.trim()) return;
    if (mode === "import") {
      onScrapeImport({ slug: slug.trim(), password: password.trim() });
    } else {
      onCreateNote({
        slug: slug.trim(),
        content,
        password: password.trim(),
        is_pinned: isPinned,
        admin_notes: adminNotes
      });
    }
  };

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      onClose={onClose}
      aria-labelledby="create-note-dialog-title"
      className="pf-dialog w-full max-w-2xl m-auto text-[#EDEDED] font-manrope"
    >
      <div className="p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 flex items-center justify-center text-[#FF9F0A]">
              {mode === "import" ? <DownloadCloud className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 id="create-note-dialog-title" className="text-lg font-extrabold text-white">
                {mode === "import" ? "Importar Nota desde notepad.pw" : "Crear Nueva Nota desde Admin"}
              </h3>
              <p className="text-xs text-gray-400">
                {mode === "import"
                  ? "Extrae automáticamente el contenido de notepad.pw/{slug} y guárdalo en Notepad.do"
                  : "Crea una nota con URL personalizada, contenido y contraseña opcional"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 pf-well">
          <button
            type="button"
            onClick={() => setMode("create")}
            className={`py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              mode === "create" ? "bg-[#FF9F0A] text-black shadow" : "text-gray-400 hover:text-white"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Nota Manual</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("import")}
            className={`py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              mode === "import" ? "bg-[#FF9F0A] text-black shadow" : "text-gray-400 hover:text-white"
            }`}
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>Importar de notepad.pw</span>
          </button>
        </div>

        <form method="post" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Slug */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="create-note-slug" className="text-xs font-bold text-gray-300">
                  Slug / Identificador URL *
                </label>
                {mode === "create" && (
                  <button
                    type="button"
                    onClick={generateRandomSlug}
                    className="text-[11px] font-bold text-[#FF9F0A] hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Aleatorio
                  </button>
                )}
              </div>
              <div className="flex items-center bg-[#0E0E11] border border-white/[0.1] rounded-xl px-3.5 py-2.5 focus-within:border-[#FF9F0A]">
                <span className="text-gray-500 font-mono-code text-xs mr-1">/</span>
                <input
                  id="create-note-slug"
                  name="slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="mi-nota-secreta"
                  className="w-full bg-transparent text-sm text-white font-mono-code focus:outline-none"
                />
              </div>
            </div>

            {/* Optional Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="create-note-pwd" className="text-xs font-bold text-gray-300">
                Contraseña de Bloqueo (Opcional)
              </label>
              <div className="flex items-center bg-[#0E0E11] border border-white/[0.1] rounded-xl px-3.5 py-2.5 focus-within:border-[#FF9F0A]">
                <Lock className="w-3.5 h-3.5 text-gray-500 mr-2 shrink-0" />
                <input
                  id="create-note-pwd"
                  name="password"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Dejar vacío para pública..."
                  className="w-full bg-transparent text-sm text-white font-mono-code focus:outline-none"
                />
              </div>
            </div>
          </div>

          {mode === "create" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="create-note-content" className="text-xs font-bold text-gray-300">
                  Contenido de la Nota
                </label>
                <textarea
                  id="create-note-content"
                  name="content"
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escribe o pega el contenido de la nota aquí..."
                  className="w-full bg-[#0E0E11] border border-white/[0.1] rounded-xl p-3.5 text-xs sm:text-sm text-white font-mono-code focus:border-[#FF9F0A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="create-admin-notes" className="text-xs font-bold text-gray-300">
                    Nota Interna del Admin (Privada)
                  </label>
                  <input
                    id="create-admin-notes"
                    name="admin_notes"
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Etiqueta o recordatorio interno..."
                    className="w-full bg-[#0E0E11] border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none pt-4">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#FF9F0A]"
                  />
                  <Pin className="w-3.5 h-3.5 text-[#FF9F0A]" />
                  <span className="text-xs font-bold text-gray-200">
                    Fijar nota arriba del listado (Pin)
                  </span>
                </label>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="pf-btn-secondary px-4 py-2.5 text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !slug.trim()}
              className="pf-btn-primary px-5 py-2.5 text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{mode === "import" ? "Extraer e Importar Nota" : "Crear Nota"}</span>
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
