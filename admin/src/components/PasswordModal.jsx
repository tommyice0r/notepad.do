import { useState, useEffect, useRef } from "react";
import {
  KeyRound, Lock, Unlock, Copy, Check, Eye, EyeOff,
  X, Sparkles, RefreshCw
} from "lucide-react";

export default function PasswordModal({
  note,
  onClose,
  onSavePassword,
  onUnlockNote,
  loading
}) {
  const dialogRef = useRef(null);
  const [newPassword, setNewPassword] = useState(note?.password_plain || "");
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    setNewPassword(note?.password_plain || "");
  }, [note]);

  if (!note) return null;

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    let res = "";
    for (let i = 0; i < 12; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(res);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      onUnlockNote(note.slug);
    } else {
      onSavePassword(note.slug, newPassword.trim());
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="pwd-dialog-title"
      className="console-dialog w-full max-w-md m-auto text-[#F4F4F5]"
    >
      <div className="p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-white">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 id="pwd-dialog-title" className="text-base font-bold text-white tracking-tight">
                Gestión de Contraseña
              </h3>
              <p className="text-xs text-zinc-400 font-mono-code">
                Nota: <span className="text-[#F59E0B]">/{note.slug}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Password Status Box */}
        <div className="console-well p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Estado Actual
            </span>
            {note.has_password ? (
              <span className="console-badge console-badge-rose">
                <Lock className="w-3 h-3" />
                <span>Protegida con Clave</span>
              </span>
            ) : (
              <span className="console-badge console-badge-emerald">
                <Unlock className="w-3 h-3" />
                <span>Pública</span>
              </span>
            )}
          </div>

          {note.has_password && (
            <div className="mt-1 space-y-2">
              <div className="flex items-center justify-between bg-[#111113] border border-white/[0.08] rounded-xl px-3 py-2">
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                    Clave en Texto Plano
                  </span>
                  {note.password_plain ? (
                    <span className="text-xs font-semibold text-white font-mono-code break-all">
                      {note.password_plain}
                    </span>
                  ) : (
                    <span className="text-xs text-amber-400/80 italic">
                      Hash Bcrypt legado (asigna una nueva clave para guardarla en texto)
                    </span>
                  )}
                </div>
                {note.password_plain && (
                  <button
                    type="button"
                    onClick={() => handleCopy(note.password_plain)}
                    className="console-btn-secondary px-2.5 py-1 text-xs flex items-center gap-1.5 shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copiada" : "Copiar"}</span>
                  </button>
                )}
              </div>

              {note.password_hash && (
                <div className="text-[10px] text-zinc-500 font-mono-code break-all bg-[#09090B] px-3 py-2 rounded-lg border border-white/[0.04]">
                  <span className="text-zinc-400">Hash DB: </span>
                  {note.password_hash}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form to Set / Change Password */}
        <form method="post" onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="note-new-password" className="text-xs font-semibold text-zinc-300">
                {note.has_password ? "Nueva Contraseña" : "Establecer Contraseña"}
              </label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-[11px] font-semibold text-[#F59E0B] hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Generar segura
              </button>
            </div>

            <div className="relative flex items-center">
              <input
                id="note-new-password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Escribe la clave de la nota..."
                className="w-full bg-[#0D0E10] border border-white/[0.08] rounded-xl pl-3.5 pr-16 py-2.5 text-xs text-white font-mono-code focus:border-[#F59E0B] focus:outline-none"
              />
              <button
                type="button"
                aria-pressed={showPassword}
                aria-label={showPassword ? "Ocultar clave" : "Mostrar clave"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 p-1 text-zinc-400 hover:text-white rounded-md"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[11px] text-zinc-500">
              Se guarda en texto plano para el Admin y con hash criptográfico Bcrypt para la protección pública.
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.08]">
            {note.has_password ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => onUnlockNote(note.slug)}
                className="console-btn-danger px-3 py-2 text-xs flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Desbloquear</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="console-btn-secondary px-3.5 py-2 text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !newPassword.trim()}
                className="console-btn-primary px-4 py-2 text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                <span>Guardar Clave</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </dialog>
  );
}
