import { useState, useEffect, useRef } from "react";
import {
  KeyRound, Lock, Unlock, Copy, Check, Eye, EyeOff,
  X, ShieldAlert, Sparkles, RefreshCw
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
      closedby="any"
      onClose={onClose}
      aria-labelledby="pwd-dialog-title"
      className="pf-dialog w-full max-w-lg m-auto text-[#EDEDED] font-manrope"
    >
      <div className="p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 flex items-center justify-center text-[#FF9F0A]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 id="pwd-dialog-title" className="text-lg font-extrabold text-white tracking-tight">
                Gestión de Contraseña
              </h3>
              <p className="text-xs text-gray-400 font-mono-code">
                Nota: <span className="text-[#FF9F0A] font-semibold">/{note.slug}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Password Status Box */}
        <div className="pf-well p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
              Estado Actual de Protección
            </span>
            {note.has_password ? (
              <span className="pf-pill pf-pill-danger">
                <Lock className="w-3 h-3" />
                Protegida con Clave
              </span>
            ) : (
              <span className="pf-pill pf-pill-ok">
                <Unlock className="w-3 h-3" />
                Pública (Sin Contraseña)
              </span>
            )}
          </div>

          {note.has_password && (
            <div className="mt-1 space-y-2">
              <div className="flex items-center justify-between bg-[#141416] border border-white/[0.08] rounded-xl px-3.5 py-2.5">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                    Contraseña en Texto Plano
                  </span>
                  {note.password_plain ? (
                    <span className="text-sm font-bold text-[#FF9F0A] font-mono-code break-all">
                      {note.password_plain}
                    </span>
                  ) : (
                    <span className="text-xs text-amber-300/90 italic">
                      Hash Bcrypt antiguo (asigna una nueva clave abajo para verla en texto plano)
                    </span>
                  )}
                </div>
                {note.password_plain && (
                  <button
                    type="button"
                    onClick={() => handleCopy(note.password_plain)}
                    className="pf-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#30D158]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copiada" : "Copiar"}</span>
                  </button>
                )}
              </div>

              {note.password_hash && (
                <div className="text-[11px] text-gray-500 font-mono-code break-all bg-black/30 px-3 py-2 rounded-lg border border-white/[0.04]">
                  <span className="text-gray-400 font-semibold">Hash DB: </span>
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
              <label htmlFor="note-new-password" className="text-xs font-bold text-gray-300">
                {note.has_password ? "Cambiar Contraseña de la Nota" : "Establecer Nueva Contraseña"}
              </label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-[11px] font-bold text-[#FF9F0A] hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Generar clave segura
              </button>
            </div>

            <div className="relative flex items-center">
              <input
                id="note-new-password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Escribe la contraseña para esta nota..."
                aria-describedby="pwd-help-text"
                className="w-full bg-[#0E0E11] border border-white/[0.1] rounded-xl pl-4 pr-20 py-3 text-sm text-white font-mono-code focus:border-[#FF9F0A]"
              />
              <button
                type="button"
                aria-pressed={showPassword}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1.5 text-gray-400 hover:text-white rounded-lg"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span id="pwd-help-text" className="text-[11px] text-gray-500">
              Se guardará tanto en texto plano (visible para el Admin) como en hash Bcrypt para el bloqueo público.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.08]">
            {note.has_password ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => onUnlockNote(note.slug)}
                className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-[#30D158] border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1.5 transition-colors"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Quitar Contraseña (Desbloquear)</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="pf-btn-secondary px-4 py-2.5 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !newPassword.trim()}
                className="pf-btn-primary px-5 py-2.5 text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                <span>Guardar Contraseña</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </dialog>
  );
}
