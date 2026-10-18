import { useState, useEffect, useRef } from "react";
import {
  Plus, DownloadCloud, Sparkles, X, Lock, RefreshCw, Pin
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
      onClose={onClose}
      aria-labelledby="create-note-dialog-title"
      className="console-dialog w-full max-w-xl m-auto text-[#F4F4F5]"
    >
      <div className="p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-white">
              {mode === "import" ? <DownloadCloud className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h3 id="create-note-dialog-title" className="text-base font-bold text-white tracking-tight">
                {mode === "import" ? "Importar Nota desde notepad.pw" : "Crear Nueva Nota"}
              </h3>
              <p className="text-xs text-zinc-400">
                {mode === "import"
                  ? "Rescata el contenido remoto de notepad.pw y almacénalo en PostgreSQL."
                  : "Crea una nota con slug personalizado, contenido y contraseña opcional."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#09090B] border border-white/[0.06] rounded-xl">
          <button
            type="button"
            onClick={() => setMode("create")}
            className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              mode === "create" 
                ? "bg-white/[0.1] text-white shadow-sm border border-white/[0.1]" 
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Manual</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("import")}
            className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              mode === "import" 
                ? "bg-white/[0.1] text-white shadow-sm border border-white/[0.1]" 
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>Importar notepad.pw</span>
          </button>
        </div>

        <form method="post" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Slug */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="create-note-slug" className="text-xs font-semibold text-zinc-300">
                  Slug / Identificador *
                </label>
                {mode === "create" && (
                  <button
                    type="button"
                    onClick={generateRandomSlug}
                    className="text-[11px] font-semibold text-[#F59E0B] hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Generar
                  </button>
                )}
              </div>
              <div className="flex items-center bg-[#0D0E10] border border-white/[0.08] rounded-xl px-3 py-2 focus-within:border-[#F59E0B] transition-colors">
                <span className="text-zinc-500 font-mono-code text-xs mr-1">/</span>
                <input
                  id="create-note-slug"
                  name="slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="mi-nota"
                  className="w-full bg-transparent text-xs text-white font-mono-code focus:outline-none"
                />
              </div>
            </div>

            {/* Optional Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="create-note-pwd" className="text-xs font-semibold text-zinc-300">
                Contraseña (Opcional)
              </label>
              <div className="flex items-center bg-[#0D0E10] border border-white/[0.08] rounded-xl px-3 py-2 focus-within:border-[#F59E0B] transition-colors">
                <Lock className="w-3.5 h-3.5 text-zinc-500 mr-2 shrink-0" />
                <input
                  id="create-note-pwd"
                  name="password"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Dejar vacía para pública..."
                  className="w-full bg-transparent text-xs text-white font-mono-code focus:outline-none"
                />
              </div>
            </div>
          </div>

          {mode === "create" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="create-note-content" className="text-xs font-semibold text-zinc-300">
                  Contenido de la Nota
                </label>
                <textarea
                  id="create-note-content"
                  name="content"
                  rows={7}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escribe o pega el texto aquí..."
                  className="w-full bg-[#0D0E10] border border-white/[0.08] rounded-xl p-3 text-xs text-zinc-200 font-mono-code focus:border-[#F59E0B] focus:outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="create-admin-notes" className="text-xs font-semibold text-zinc-300">
                    Anotación Interna del Admin
                  </label>
                  <input
                    id="create-admin-notes"
                    name="admin_notes"
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Referencia o etiqueta privada..."
                    className="w-full bg-[#0D0E10] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:border-[#F59E0B] focus:outline-none"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none pt-4">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#F59E0B]"
                  />
                  <Pin className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span className="text-xs font-medium text-zinc-300">
                    Fijar nota arriba en el listado
                  </span>
                </label>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="console-btn-secondary px-3.5 py-2 text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !slug.trim()}
              className="console-btn-primary px-4 py-2 text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{mode === "import" ? "Extraer e Importar" : "Crear Nota"}</span>
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
