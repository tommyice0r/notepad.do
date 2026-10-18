import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import { 
  Plus, Lock, Unlock, Copy, Check, Share2, 
  Download, ZoomIn, ZoomOut, Hash, Send, 
  KeyRound, AlertTriangle, AlertCircle, X, 
  Sparkles, FileEdit, Activity, ExternalLink,
  CreditCard, Eye, EyeOff, ShieldCheck, CheckCheck,
  ChevronDown, ChevronUp, Globe, Terminal, Shield,
  Palette, Calculator, Equal, Link2
} from "lucide-react";
import {
  detectAllPatterns,
  autoFormatNotepadContent,
  generateSafeOverlayHtml,
  formatCardNumber,
  maskCardNumber
} from "../utils/patternDetector";
import {
  calculateExcelSum,
  evaluateInlineMath,
  appendTotalSummary
} from "../utils/mathEngine";
import ThemeModal from "./ThemeModal";
import {
  loadSavedTheme,
  saveTheme,
  getActiveBackgroundUrl,
  getUploadedWallpaperBlob,
  DEFAULT_THEME
} from "../utils/themeManager";

function generateRandomSlug(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function Editor({ unlockPrice = 500, onStatusChange }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Migration state
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);
  const [migratedContent, setMigratedContent] = useState("");
  
  // Security & Lock state
  const [isLocked, setIsLocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [showLockModal, setShowLockModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Editor Preferences
  const [fontSize, setFontSize] = useState(15);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Theme & Customization (100% saved in localStorage)
  const [theme, setTheme] = useState(loadSavedTheme);
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Privacy & Pattern Inspector states
  const [privacyMode, setPrivacyMode] = useState(false);
  const [showInspector, setShowInspector] = useState(true);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [revealedCards, setRevealedCards] = useState({});
  const [revealedCvv, setRevealedCvv] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const textareaRef = useRef(null);
  const overlayRef = useRef(null);

  // Pattern detection memoized
  const patterns = useMemo(() => detectAllPatterns(content), [content]);

  // Excel-like Math memoized
  const mathResult = useMemo(() => calculateExcelSum(content), [content]);

  // Active Wallpaper / GIF Background URL (supports Presets, Direct URLs & IndexedDB blobs)
  const [activeBgUrl, setActiveBgUrl] = useState(() => getActiveBackgroundUrl(theme) || "");

  useEffect(() => {
    let objectUrl = null;
    let isCancelled = false;

    async function resolveActiveBackground() {
      if (theme.backgroundType === "preset") {
        const syncUrl = getActiveBackgroundUrl(theme);
        if (!isCancelled) setActiveBgUrl(syncUrl || "");
        return;
      }
      if (theme.backgroundType === "url") {
        if (!isCancelled) setActiveBgUrl(theme.customImageUrl || "");
        return;
      }
      if (theme.backgroundType === "upload") {
        try {
          const blob = await getUploadedWallpaperBlob();
          if (blob && !isCancelled) {
            objectUrl = URL.createObjectURL(blob);
            setActiveBgUrl(objectUrl);
            return;
          }
        } catch (e) {
          console.warn("Error resolviendo wallpaper de IndexedDB:", e);
        }
        if (theme.uploadedImage && !isCancelled) {
          setActiveBgUrl(theme.uploadedImage);
          return;
        }
      }
      if (!isCancelled) setActiveBgUrl("");
    }

    resolveActiveBackground();

    return () => {
      isCancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [theme]);

  const [unlockedPassword, setUnlockedPassword] = useState("");

  // Notify parent page about editor lock/loading state for AdSense placement compliance
  useEffect(() => {
    if (typeof onStatusChange === "function") {
      onStatusChange({
        loading,
        isLocked,
        hasContent: content.trim().length > 0,
      });
    }
  }, [loading, isLocked, content, onStatusChange]);

  // Fetch note from backend (DB check -> scraper fallback)
  useEffect(() => {
    setLoading(true);
    setIsLocked(false);
    setShowMigrationPrompt(false);
    setUnlockError("");
    api.get(`/notes/${slug}`)
      .then(response => {
        if (response.data.requires_password) {
          setIsLocked(true);
          setLoading(false);
          return;
        }

        if (response.data.suggest_migration) {
          setMigratedContent(response.data.content);
          setShowMigrationPrompt(true);
        } else {
          setContent(response.data.content || "");
        }
      })
      .catch(error => {
        console.error("Error al cargar la nota:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  // Synchronize scroll between textarea and overlay
  const handleScroll = () => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Toast notification helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Update theme helper
  const handleUpdateTheme = (newTheme) => {
    setTheme(newTheme);
    saveTheme(newTheme);
  };

  // Specific copy helper with button feedback
  const handleCopySpecific = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Migration accept/reject
  const handleMigration = (accept) => {
    if (accept) {
      setContent(migratedContent);
      saveNote(migratedContent);
    }
    setShowMigrationPrompt(false);
  };

  // Autosave API call with password header support
  const saveNote = (newContent) => {
    setSaving(true);
    const headers = unlockedPassword ? { "X-Note-Password": unlockedPassword } : {};
    api.post(`/notes/${slug}`, {
      content: newContent,
      password: unlockedPassword
    }, { headers })
    .catch(err => {
      console.error("Error guardando:", err);
    })
    .finally(() => {
      setTimeout(() => setSaving(false), 300);
    });
  };

  // Debounced auto-save on content change
  useEffect(() => {
    if (!loading && !showMigrationPrompt && !isLocked) {
      const delayDebounceFn = setTimeout(() => {
        if (content !== "") {
          saveNote(content);
        }
      }, 700);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [content]);

  // Clean copy of entire notepad content
  const handleCopyAll = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Telegram share
  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('Nota compartida en Notepad.do:')}`;
    window.open(url, "_blank");
  };

  // New Note button action
  const handleNewNote = () => {
    const newSlug = generateRandomSlug();
    navigate(`/${newSlug}`);
  };

  // Insert Excel-like Total summary
  const handleInsertTotal = () => {
    const updated = appendTotalSummary(content);
    setContent(updated);
    saveNote(updated);
    showToast("¡Total insertado al final de la nota!");
  };

  // Lock note with password
  const confirmLock = () => {
    if (!newPassword.trim()) return;
    api.post(`/notes/${slug}/lock`, { password: newPassword })
      .then(() => {
        setUnlockedPassword(newPassword);
        setIsLocked(false);
        setShowLockModal(false);
        showToast("Nota bloqueada con contraseña segura");
      })
      .catch((err) => {
        alert(err.response?.data?.error || "No se pudo proteger la nota.");
      });
  };

  // Verify password to unlock
  const handleVerifyPassword = () => {
    setUnlockError("");
    api.post(`/notes/${slug}/verify`, { password: passwordInput })
      .then(res => {
        setContent(res.data.content);
        setUnlockedPassword(passwordInput);
        setIsLocked(false);
      })
      .catch(err => {
        setUnlockError(err.response?.data?.error || "Contraseña incorrecta. Inténtalo de nuevo.");
      });
  };

  // OxaPay $500 BTC unlock invoice
  const handleUnlockPay = () => {
    api.post(`/notes/${slug}/unlock-pay`)
      .then(res => {
        if (res.data.payLink) {
          window.location.href = res.data.payLink;
        } else {
          alert("No se pudo generar la factura de pago.");
        }
      })
      .catch(() => {
        alert("El servicio de pago no se encuentra disponible temporalmente.");
      });
  };

  // Download note as plain text
  const handleDownload = (ext) => {
    const filename = `${slug}.${ext}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Smart organizer for credentials, cards, URLs, proxies, JSON, and math
  const handleAutoOrganize = () => {
    if (!content.trim()) return;
    // 1. Solve inline math like "50 * 4 + 20 = "
    let formatted = evaluateInlineMath(content);
    // 2. Format cards, credentials, URLs, proxies, JSON
    formatted = autoFormatNotepadContent(formatted);
    setContent(formatted);
    saveNote(formatted);
    showToast("¡Nota organizada y cálculos resueltos!");
  };

  // Statistics
  const linesCount = content ? content.split("\n").length : 1;
  const wordsCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charsCount = content.length;

  const totalDetections = 
    patterns.counts.cards + 
    patterns.counts.passwords + 
    patterns.counts.urls + 
    patterns.counts.proxies + 
    patterns.counts.crypto +
    (mathResult ? 1 : 0);

  // Font CSS family
  const activeFontFamily = 
    theme.fontFamily === "Manrope" ? "'Manrope', sans-serif" :
    theme.fontFamily === "Courier Prime" ? "'Courier Prime', monospace" :
    theme.fontFamily === "monospace" ? "ui-monospace, monospace" :
    theme.fontFamily === "sans-serif" ? "system-ui, sans-serif" :
    "'IBM Plex Mono', monospace";

  // Loading indicator
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3 min-h-[500px] pf-panel">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF9F0A] border-t-transparent animate-spin"></div>
        <p className="text-xs font-semibold text-gray-400 font-manrope">Cargando nota...</p>
      </div>
    );
  }

  // Locked Note View
  if (isLocked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 pf-panel my-auto w-full min-h-[500px]">
        <div className="w-16 h-16 rounded-2xl bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 flex items-center justify-center text-[#FF9F0A] mb-5 shadow-[0_4px_16px_rgba(255,159,10,0.15)]">
          <KeyRound className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div className="text-center mb-6">
          <span className="pf-pill pf-pill-warm mb-2">Acceso restringido</span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2 font-manrope">
            Nota protegida con clave
          </h2>
          <p className="text-xs text-gray-400 max-w-md leading-relaxed">
            Esta nota tiene una contraseña configurada por su autor. Introduce la clave para acceder a su contenido.
          </p>
        </div>

        <div className="w-full max-w-md space-y-3 mb-6">
          <div className="flex gap-2">
            <input 
              type="password"
              placeholder="Escribe la contraseña..."
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleVerifyPassword()}
              className="flex-1 bg-[#0E0E11] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#FF9F0A] font-mono-code"
            />
            <button
              onClick={handleVerifyPassword}
              className="pf-btn-primary px-5 py-2.5 text-sm font-manrope active:scale-95"
            >
              Desbloquear
            </button>
          </div>
          {unlockError && (
            <p className="text-xs text-[#FF6961] font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {unlockError}
            </p>
          )}
        </div>

        {/* Administrative Access Recovery */}
        <div className="w-full max-w-md bg-[#0E0E11] border border-white/[0.08] rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-white font-bold text-xs font-manrope">
              <AlertTriangle className="w-4 h-4 text-[#FF9F0A]" />
              <span>¿Olvidaste la clave de acceso?</span>
            </div>
            <span className="text-[10px] font-mono-code text-[#FF9F0A] uppercase tracking-wider">Soporte Automático</span>
          </div>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Si eres el titular y necesitas restablecer el acceso sin la clave original, puedes solicitar la liberación administrativa automatizada de la nota (<strong>${unlockPrice} USD</strong>).
          </p>
          <button
            onClick={handleUnlockPay}
            className="w-full py-2.5 rounded-xl bg-[#1B1B1E] hover:bg-[#25252A] text-[#FF9F0A] border border-[#FF9F0A]/30 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            <Unlock className="w-4 h-4 text-[#FF9F0A]" />
            <span>Solicitar desbloqueo automático (${unlockPrice} USD)</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full w-full relative">

      {/* 0. CUSTOM WALLPAPER / ANIMATED GIF BACKGROUND LAYER */}
      {activeBgUrl && (
        <div 
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat transition-all duration-500"
          style={{
            backgroundImage: `url(${activeBgUrl})`,
            filter: theme.bgBlur > 0 ? `blur(${theme.bgBlur}px)` : "none",
            transform: theme.bgBlur > 0 ? "scale(1.04)" : "scale(1.0)",
          }}
        />
      )}

      {/* Dark tint overlay for contrast and 100% legibility */}
      {activeBgUrl && (
        <div 
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300"
          style={{
            backgroundColor: `rgba(6, 6, 7, ${theme.bgDarkness})`,
          }}
        />
      )}

      {/* Main Notepad Glass Container */}
      <div 
        className="flex flex-col flex-1 h-full w-full pf-panel overflow-hidden shadow-2xl relative z-10 transition-colors duration-300"
        style={{
          backgroundColor: `rgba(20, 20, 22, ${theme.panelOpacity})`,
          backdropFilter: theme.panelOpacity < 1 ? "blur(18px)" : "none",
        }}
      >

        {/* Toast Alert */}
        {toastMessage && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#FF9F0A] text-black font-extrabold text-xs rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
            <Sparkles className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Migration Notice Banner if detected from notepad.pw */}
        {showMigrationPrompt && (
          <div className="p-3.5 bg-[#FF9F0A]/10 border-b border-[#FF9F0A]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-white">
              <Sparkles className="w-4 h-4 text-[#FF9F0A] shrink-0" />
              <span>Nota encontrada en <strong className="font-mono-code">notepad.pw/{slug}</strong>. ¿Deseas conservarla en Notepad.do?</span>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleMigration(true)}
                className="pf-btn-primary px-3 py-1 text-xs"
              >
                Guardar nota
              </button>
              <button
                onClick={() => handleMigration(false)}
                className="pf-btn-secondary px-2.5 py-1 text-xs"
              >
                Descartar
              </button>
            </div>
          </div>
        )}

        {/* 1. TOP TOOLBAR INSIDE CARD */}
        <div className="px-4 py-3 border-b border-white/[0.08] bg-[#141416]/90 backdrop-blur-md flex items-center justify-between gap-3">
          
          {/* Left: Notepad Brand Logo */}
          <div className="flex items-center gap-2.5">
            <Link to="/" className="flex items-center gap-2 group">
              <div 
                className="w-7 h-7 rounded-lg border flex items-center justify-center transition-colors"
                style={{ 
                  backgroundColor: `${theme.accentColor}26`, 
                  borderColor: `${theme.accentColor}4D`,
                  color: theme.accentColor
                }}
              >
                <FileEdit className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white group-hover:opacity-90 transition-colors font-manrope">
                notepad<span style={{ color: theme.accentColor }}>.do</span>
              </span>
            </Link>

            {/* Autosave status pill */}
            <div className="ml-2">
              {saving ? (
                <span className="pf-pill pf-pill-warm text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF9F0A] animate-pulse"></span>
                  <span className="hidden sm:inline">Guardando...</span>
                </span>
              ) : (
                <span className="pf-pill pf-pill-ok text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#30D158]"></span>
                  <span className="hidden sm:inline">Guardado</span>
                </span>
              )}
            </div>
          </div>

          {/* Right: Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Custom Theme & Background Button */}
            <button
              onClick={() => setShowThemeModal(true)}
              title="Personalizar fondos, vidrio y tipografías (guardado en tu navegador)"
              className="w-8 h-8 rounded-lg bg-[#1B1B1E] hover:bg-[#25252A] border border-white/[0.08] text-gray-300 hover:text-white flex items-center justify-center transition-all active:scale-95"
            >
              <Palette className="w-4 h-4 text-[#FF9F0A]" />
            </button>

            {/* Privacy Mode Toggle */}
            <button
              onClick={() => {
                setPrivacyMode(!privacyMode);
                showToast(!privacyMode ? "Modo Privacidad activado (datos ocultos)" : "Modo Privacidad desactivado");
              }}
              title={privacyMode ? "Desactivar modo privacidad" : "Activar modo privacidad (ocultar datos sensibles)"}
              className={`w-8 h-8 rounded-lg border transition-all flex items-center justify-center ${
                privacyMode 
                  ? "bg-[#FF9F0A]/20 text-[#FF9F0A] border-[#FF9F0A]/40 shadow-sm" 
                  : "bg-[#1B1B1E] hover:bg-[#25252A] border-white/[0.08] text-gray-400 hover:text-white"
              }`}
            >
              {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* + New Note Button */}
            <button
              onClick={handleNewNote}
              title="Crear nueva nota"
              className="w-8 h-8 rounded-lg bg-[#1B1B1E] hover:bg-[#25252A] border border-white/[0.08] text-gray-300 hover:text-white flex items-center justify-center transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-[#FF9F0A]" />
            </button>

            {/* Password Lock Button */}
            <button
              onClick={() => setShowLockModal(true)}
              title="Proteger nota con contraseña"
              className="w-8 h-8 rounded-lg bg-[#1B1B1E] hover:bg-[#25252A] border border-white/[0.08] text-gray-300 hover:text-[#FF6961] flex items-center justify-center transition-all active:scale-95"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* Copy Button */}
            <button
              onClick={handleCopyAll}
              title="Copiar todo el contenido"
              className={`flex items-center gap-1 px-3 h-8 rounded-lg text-xs font-bold transition-all ${
                copied
                  ? "bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/40"
                  : "pf-btn-primary"
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? "¡Copiado!" : "Copiar"}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={() => setShowShareModal(true)}
              title="Compartir enlace o código QR"
              className="w-8 h-8 rounded-lg bg-[#1B1B1E] hover:bg-[#25252A] border border-white/[0.08] text-gray-300 hover:text-white flex items-center justify-center transition-all"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Download Text */}
            <button
              onClick={() => handleDownload("txt")}
              title="Descargar archivo .txt"
              className="w-8 h-8 rounded-lg bg-[#1B1B1E] hover:bg-[#25252A] border border-white/[0.08] text-gray-300 hover:text-white hidden sm:flex items-center justify-center transition-all"
            >
              <Download className="w-4 h-4" />
            </button>

          </div>

        </div>

        {/* 2. MAIN EXPANSIVE TEXTAREA CANVAS */}
        <div 
          onClick={() => textareaRef.current?.focus()}
          className="flex-1 w-full flex flex-row min-h-[500px] lg:min-h-[580px] relative bg-transparent cursor-text self-stretch"
        >
          {/* Line Numbers Gutter */}
          {showLineNumbers && (
            <div 
              className="w-10 sm:w-12 bg-black/30 border-r border-white/[0.06] select-none py-6 px-1 flex flex-col text-right text-gray-600 text-xs shrink-0 overflow-hidden leading-[1.7]"
              style={{ fontFamily: activeFontFamily }}
            >
              {Array.from({ length: Math.max(linesCount, 24) }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
          )}

          {/* Text Area & Zero-Shift Overlay */}
          <div className="relative flex-1 w-full h-full min-h-[500px] lg:min-h-[580px] flex flex-col">
            
            {/* Syntax Highlight Overlay */}
            <div 
              ref={overlayRef}
              aria-hidden="true"
              className="absolute inset-0 p-6 leading-[1.7] text-transparent pointer-events-none whitespace-pre-wrap break-words overflow-auto z-10"
              style={{ 
                fontSize: `${fontSize}px`,
                fontFamily: activeFontFamily
              }}
              dangerouslySetInnerHTML={{ __html: generateSafeOverlayHtml(content) }}
            />

            {/* Native Textarea */}
            <textarea
              ref={textareaRef}
              autoFocus
              onScroll={handleScroll}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ 
                fontSize: `${fontSize}px`,
                fontFamily: activeFontFamily
              }}
              className={`w-full flex-1 min-h-[500px] lg:min-h-[580px] p-6 bg-transparent leading-[1.7] resize-none outline-none z-20 placeholder-gray-600 overflow-auto selection:bg-[#FF9F0A]/30 selection:text-white ${
                privacyMode ? "blur-[3.5px] hover:blur-none transition-all duration-200 text-[#EDEDED]" : "text-[#EDEDED]"
              }`}
              placeholder="Empieza a escribir aquí... Todo se guarda automáticamente en la nube al instante.

Funciones inteligentes integradas:
- Sumas tipo Excel: Escribe una lista de importes ($45, $120.50, $30) y presiona 'Insertar Total'
- Calculadora en línea: Escribe '150 * 4 + 20 =' y presiona 'Organizar' para resolver el resultado
- Limpieza de enlaces y formato JSON: Pega URLs con parámetros o bloques JSON para darles formato limpio
- Protección con clave: Haz clic en el icono del candado para proteger tu documento"
              spellCheck="false"
            />

          </div>

        </div>

        {/* 3. SMART PATTERN & EXCEL-SUM INSPECTOR DOCK */}
        {totalDetections > 0 && (
          <section aria-label="Detector de Datos, Cálculos y Credenciales" className="border-t border-white/[0.08] bg-[#0E0E11]/95 backdrop-blur-xl">
            
            {/* Inspector Header Toggle */}
            <div className="px-4 py-2 flex items-center justify-between gap-3 text-xs border-b border-white/[0.04]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#FF9F0A] flex items-center gap-1.5 font-manrope">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Datos y Cálculos ({totalDetections}):</span>
                </span>

                {mathResult && (
                  <span className="pf-pill bg-emerald-500/15 text-[#30D158] border border-emerald-500/30 text-[10px] py-0.5 px-2 font-bold font-mono-code">
                    ∑ {mathResult.currency}{mathResult.sum.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                  </span>
                )}
                {patterns.counts.cards > 0 && (
                  <span className="pf-pill bg-amber-500/10 text-[#FF9F0A] border border-amber-500/25 text-[10px] py-0.5 px-2 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    <span>{patterns.counts.cards} tarjeta(s)</span>
                  </span>
                )}
                {patterns.counts.passwords > 0 && (
                  <span className="pf-pill bg-red-500/10 text-[#FF6961] border border-red-500/25 text-[10px] py-0.5 px-2 flex items-center gap-1">
                    <KeyRound className="w-3 h-3" />
                    <span>{patterns.counts.passwords} clave(s)</span>
                  </span>
                )}
                {patterns.counts.urls > 0 && (
                  <span className="pf-pill bg-blue-500/10 text-[#38BDF8] border border-blue-500/25 text-[10px] py-0.5 px-2 flex items-center gap-1">
                    <Link2 className="w-3 h-3" />
                    <span>{patterns.counts.urls} enlace(s)</span>
                  </span>
                )}
                {patterns.counts.proxies > 0 && (
                  <span className="pf-pill bg-purple-500/10 text-[#C084FC] border border-purple-500/25 text-[10px] py-0.5 px-2 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    <span>{patterns.counts.proxies} proxy(s)</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoOrganize}
                  className="pf-btn-primary flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold"
                  title="Dar formato automático a tarjetas, contraseñas, URLs y resolver cálculos"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Auto-Formato & Sumas</span>
                </button>

                <button
                  onClick={() => setShowInspector(!showInspector)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                  title={showInspector ? "Minimizar panel" : "Expandir panel"}
                >
                  {showInspector ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Inspector Body Details */}
            {showInspector && (
              <div className="p-3 sm:p-4 space-y-3 max-h-[240px] overflow-y-auto">
                
                {/* Excel-like Math Sum Box */}
                {mathResult && (
                  <div className="p-3 rounded-xl bg-[#141416] border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#30D158] shrink-0">
                        <Calculator className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-sm font-mono-code">
                            Suma Total: {mathResult.currency}{mathResult.sum.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-gray-300 text-[10px] font-mono-code">
                            {mathResult.count} valores
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono-code mt-0.5">
                          Promedio: {mathResult.currency}{mathResult.avg.toLocaleString("es-ES", { minimumFractionDigits: 2 })} · Rango: {mathResult.currency}{mathResult.min} — {mathResult.currency}{mathResult.max}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleInsertTotal}
                        className="flex-1 sm:flex-none pf-btn-primary px-3 py-1.5 text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95"
                        title="Insertar bloque de Total al final del documento"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Insertar Total</span>
                      </button>

                      <button
                        onClick={() => handleCopySpecific(`${mathResult.currency}${mathResult.sum}`, "sum-total")}
                        className="px-2.5 py-1.5 rounded-lg bg-[#1B1B1E] hover:bg-[#25252A] text-gray-300 hover:text-white text-[11px] font-bold flex items-center gap-1"
                        title="Copiar solo el monto de la suma"
                      >
                        {copiedKey === "sum-total" ? <Check className="w-3.5 h-3.5 text-[#30D158]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copiar suma</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Detected Cards Grid */}
                {patterns.cards.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block">
                      Tarjetas de Pago
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {patterns.cards.map((card, idx) => {
                        const isRevealed = revealedCards[idx];
                        const isCvvRevealed = revealedCvv[idx];
                        return (
                          <div 
                            key={idx}
                            className="p-3 rounded-xl bg-[#141416] border border-white/[0.08] flex flex-col justify-between gap-2 text-xs relative group hover:border-[#FF9F0A]/40 transition-all shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded-md bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/30 text-[10px] font-extrabold tracking-wide uppercase">
                                {card.brand}
                              </span>
                              {card.isValid ? (
                                <span className="text-[10px] text-[#30D158] font-bold flex items-center gap-1">
                                  <CheckCheck className="w-3 h-3" />
                                  <span>Luhn OK</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-yellow-400 font-semibold">
                                  Sin validar
                                </span>
                              )}
                            </div>

                            {/* Card Number */}
                            <div className="flex items-center justify-between font-mono-code text-sm font-bold text-white tracking-wider my-0.5">
                              <span>{isRevealed ? card.formatted : card.masked}</span>
                              <button
                                onClick={() => setRevealedCards({ ...revealedCards, [idx]: !isRevealed })}
                                title={isRevealed ? "Ocultar número" : "Ver número completo"}
                                className="text-gray-500 hover:text-white p-1"
                              >
                                {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            {/* Exp & CVV */}
                            <div className="flex items-center justify-between text-[11px] text-gray-400 border-t border-white/[0.06] pt-1.5">
                              <span>Vence: <strong className="text-gray-200">{card.exp || "—"}</strong></span>
                              <span>
                                CVV: <strong className="text-gray-200 font-mono-code">{isCvvRevealed ? (card.cvv || "—") : "•••"}</strong>
                                {card.cvv && (
                                  <button
                                    onClick={() => setRevealedCvv({ ...revealedCvv, [idx]: !isCvvRevealed })}
                                    className="ml-1 text-gray-500 hover:text-white inline-block align-middle"
                                  >
                                    {isCvvRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </button>
                                )}
                              </span>
                            </div>

                            {/* Card Copy Actions */}
                            <div className="flex items-center gap-1.5 pt-1">
                              <button
                                onClick={() => handleCopySpecific(card.digits, `card-num-${idx}`)}
                                className="flex-1 py-1 rounded-lg bg-[#1B1B1E] hover:bg-[#25252A] text-gray-300 hover:text-white text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
                              >
                                {copiedKey === `card-num-${idx}` ? <Check className="w-3 h-3 text-[#30D158]" /> : <Copy className="w-3 h-3" />}
                                <span>Copiar Nº</span>
                              </button>
                              <button
                                onClick={() => {
                                  const fullCardText = `Tarjeta: ${card.formatted} | Vence: ${card.exp || "N/A"} | CVV: ${card.cvv || "N/A"} | ${card.brand}`;
                                  handleCopySpecific(fullCardText, `card-all-${idx}`);
                                }}
                                className="flex-1 py-1 rounded-lg bg-[#1B1B1E] hover:bg-[#25252A] text-[#FF9F0A] hover:text-white text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
                              >
                                {copiedKey === `card-all-${idx}` ? <Check className="w-3 h-3 text-[#30D158]" /> : <Copy className="w-3 h-3" />}
                                <span>Copiar todo</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Detected Passwords & Accounts */}
                {patterns.passwords.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block">
                      Contraseñas Detectadas
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {patterns.passwords.map((pwd, idx) => {
                        const isRevealed = revealedPasswords[idx];
                        return (
                          <div 
                            key={idx}
                            className="px-3 py-2 rounded-xl bg-[#141416] border border-white/[0.08] flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                              <span className="text-red-400 font-bold font-mono-code text-[11px] shrink-0 flex items-center gap-1">
                                <KeyRound className="w-3 h-3" />
                                <span>{pwd.full.split(/[:=]/)[0]}:</span>
                              </span>
                              <span className="font-mono-code text-white text-[11px] truncate">
                                {privacyMode || !isRevealed ? "••••••••" : pwd.value}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => setRevealedPasswords({ ...revealedPasswords, [idx]: !isRevealed })}
                                title={isRevealed ? "Ocultar" : "Mostrar"}
                                className="p-1 text-gray-400 hover:text-white"
                              >
                                {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleCopySpecific(pwd.value, `pwd-${idx}`)}
                                title="Copiar contraseña"
                                className="p-1 text-gray-400 hover:text-[#30D158]"
                              >
                                {copiedKey === `pwd-${idx}` ? <Check className="w-3.5 h-3.5 text-[#30D158]" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Detected URLs */}
                {patterns.urls.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block">
                      Enlaces Web
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {patterns.urls.map((urlObj, idx) => (
                        <div 
                          key={idx}
                          className="px-3 py-2 rounded-xl bg-[#141416] border border-white/[0.08] flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="overflow-hidden flex-1">
                            <span className="text-[11px] text-[#38BDF8] font-mono-code truncate block">
                              {urlObj.clean}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => window.open(urlObj.clean, "_blank")}
                              title="Abrir enlace en pestaña nueva"
                              className="p-1 text-gray-400 hover:text-white flex items-center gap-1 text-[11px]"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-[#38BDF8]" />
                            </button>
                            <button
                              onClick={() => handleCopySpecific(urlObj.clean, `url-${idx}`)}
                              title="Copiar enlace limpio"
                              className="p-1 text-gray-400 hover:text-white"
                            >
                              {copiedKey === `url-${idx}` ? <Check className="w-3.5 h-3.5 text-[#30D158]" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Proxies & Crypto Quick Row */}
                {(patterns.proxies.length > 0 || patterns.crypto.length > 0) && (
                  <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-white/[0.04]">
                    {patterns.proxies.length > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-purple-400 font-bold flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5" />
                          <span>{patterns.proxies.length} proxy(s)</span>
                        </span>
                        <button
                          onClick={() => {
                            const proxyText = patterns.proxies.map(p => p.raw).join("\n");
                            handleCopySpecific(proxyText, "proxies-all");
                          }}
                          className="px-2 py-0.5 rounded bg-[#1B1B1E] hover:bg-[#25252A] text-gray-300 text-[10px] font-bold"
                        >
                          {copiedKey === "proxies-all" ? "¡Copiados!" : "Copiar todos"}
                        </button>
                      </div>
                    )}

                    {patterns.crypto.map((c, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs bg-[#141416] px-2 py-1 rounded-lg border border-white/[0.06]">
                        <span className="text-yellow-400 font-bold text-[10px]">{c.badge}:</span>
                        <span className="font-mono-code text-[10px] text-gray-300 max-w-[120px] truncate">{c.address}</span>
                        <button
                          onClick={() => handleCopySpecific(c.address, `crypto-${idx}`)}
                          className="p-0.5 text-gray-400 hover:text-white"
                        >
                          {copiedKey === `crypto-${idx}` ? <Check className="w-3 h-3 text-[#30D158]" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

          </section>
        )}

        {/* 4. BOTTOM FOOTER TOOLBAR */}
        <div className="px-4 py-2.5 border-t border-white/[0.08] bg-[#141416]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Left: Editable Link & Share Link pill & Math Pill & Auto-Organize */}
          <div className="flex items-center flex-wrap gap-2">
            <div 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                showToast("Enlace copiado al portapapeles");
              }}
              title="Haz clic para copiar el enlace de esta nota"
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1B1B1E] hover:bg-[#25252A] border border-white/[0.08] text-gray-300 hover:text-white cursor-pointer transition-colors font-mono-code text-[11px]"
            >
              <span className="text-gray-500">Enlace:</span>
              <span className="text-[#FF9F0A]">/{slug}</span>
            </div>

            <button
              onClick={() => setShowShareModal(true)}
              className="px-2.5 py-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.05] transition-colors text-[11px] font-semibold font-manrope"
            >
              Compartir
            </button>

            {/* Quick Math Pill (if numbers detected) */}
            {mathResult && (
              <button
                onClick={handleInsertTotal}
                title="Haz clic para insertar la suma total al final de la nota"
                className="pf-pill bg-emerald-500/15 text-[#30D158] border border-emerald-500/30 hover:bg-emerald-500/25 text-[10px] transition-colors cursor-pointer"
              >
                ∑ {mathResult.currency}{mathResult.sum.toLocaleString("es-ES", { minimumFractionDigits: 2 })} ({mathResult.count})
              </button>
            )}

            {/* Auto-Organize button */}
            <button
              onClick={handleAutoOrganize}
              title="Organizar credenciales, tarjetas, URLs, proxies, JSON y resolver cálculos"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1B1B1E] hover:bg-[#25252A] border border-white/[0.08] text-gray-300 hover:text-[#FF9F0A] text-[11px] font-semibold transition-colors font-manrope"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF9F0A]" />
              <span>Organizar</span>
            </button>
          </div>

          {/* Right: Word counters, font zoom, and line numbers toggle */}
          <div className="flex items-center gap-3 text-gray-400 text-[11px]">
            <div className="hidden sm:flex items-center gap-2 font-mono-code text-gray-500">
              <span>{linesCount}L</span>
              <span>·</span>
              <span>{wordsCount}W</span>
              <span>·</span>
              <span>{charsCount}C</span>
            </div>

            {/* Zoom controls */}
            <div className="flex items-center bg-[#1B1B1E] border border-white/[0.08] rounded-lg p-0.5">
              <button
                onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                title="Reducir fuente"
                className="p-1 text-gray-400 hover:text-white"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-mono-code text-[10px] text-gray-400">{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                title="Aumentar fuente"
                className="p-1 text-gray-400 hover:text-white"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Line Numbers Toggle */}
            <button
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              title={showLineNumbers ? "Ocultar números de línea" : "Mostrar números de línea"}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                showLineNumbers
                  ? "bg-white/[0.08] text-white border-white/[0.15]"
                  : "text-gray-500 border-transparent hover:bg-white/[0.05]"
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* Theme Customization Modal */}
      {showThemeModal && (
        <ThemeModal 
          theme={theme}
          onUpdateTheme={handleUpdateTheme}
          onClose={() => setShowThemeModal(false)}
        />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm pf-panel p-6 shadow-2xl relative">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1.5 font-manrope">Compartir nota</h3>
            <p className="text-xs text-gray-400 mb-5 leading-relaxed">
              Cualquiera que tenga este enlace podrá ver y editar la nota.
            </p>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text"
                  readOnly
                  value={window.location.href}
                  className="flex-1 bg-[#0E0E11] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-gray-300 font-mono-code outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    showToast("Enlace copiado");
                  }}
                  className="pf-btn-primary px-3 py-2 text-xs font-bold font-manrope"
                >
                  Copiar
                </button>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(window.location.href)}&color=EDEDED&bgcolor=060607`}
                  alt="QR Code"
                  className="w-32 h-32 rounded-lg border border-white/[0.08]"
                />
                <span className="text-[11px] text-gray-400 mt-2 font-mono-code">Escanea para abrir en el móvil</span>
              </div>

              {/* Telegram Button */}
              <button
                onClick={handleTelegramShare}
                className="w-full py-2.5 rounded-xl bg-[#229ED9]/15 hover:bg-[#229ED9]/25 text-[#229ED9] border border-[#229ED9]/30 text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Enviar por Telegram</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lock Password Modal */}
      {showLockModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm pf-panel p-6 shadow-2xl relative">
            <button
              onClick={() => setShowLockModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-[#FF6961] mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5 font-manrope">Proteger con Contraseña</h3>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Configura una contraseña para restringir el acceso a esta nota.
            </p>

            <div className="space-y-3">
              <input 
                type="password"
                placeholder="Nueva contraseña..."
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && confirmLock()}
                className="w-full bg-[#0E0E11] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#FF9F0A] font-mono-code"
              />
              <button
                onClick={confirmLock}
                className="w-full pf-btn-primary py-2.5 text-sm font-manrope active:scale-95"
              >
                Guardar y Proteger
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
