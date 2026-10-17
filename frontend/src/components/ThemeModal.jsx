import { useState } from "react";
import { 
  X, Image as ImageIcon, Sliders, Type, 
  Palette, Upload, RefreshCw, Check, Sparkles, AlertCircle 
} from "lucide-react";
import { 
  THEME_PRESETS, ACCENT_COLORS, FONT_OPTIONS, 
  DEFAULT_THEME, getActiveBackgroundUrl 
} from "../utils/themeManager";

export default function ThemeModal({ theme, onUpdateTheme, onClose }) {
  const [activeTab, setActiveTab] = useState("wallpapers"); // 'wallpapers' | 'glass' | 'fonts'
  const [urlInput, setUrlInput] = useState(theme.customImageUrl || "");
  const [uploadError, setUploadError] = useState("");

  const handleSelectPreset = (presetId) => {
    onUpdateTheme({
      ...theme,
      backgroundType: "preset",
      presetId
    });
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    onUpdateTheme({
      ...theme,
      backgroundType: "url",
      customImageUrl: urlInput.trim()
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP).");
      return;
    }

    // Limit to 2.5MB so localStorage doesn't hit quota
    if (file.size > 2.5 * 1024 * 1024) {
      setUploadError("La imagen debe ser menor a 2.5MB para guardarse en localStorage.");
      return;
    }

    setUploadError("");
    const reader = new FileReader();
    reader.onload = () => {
      onUpdateTheme({
        ...theme,
        backgroundType: "upload",
        uploadedImage: reader.result
      });
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    onUpdateTheme(DEFAULT_THEME);
    setUrlInput("");
    setUploadError("");
  };

  const currentBgUrl = getActiveBackgroundUrl(theme);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-2xl pf-panel shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/[0.12] bg-[#141416]/95 backdrop-blur-2xl">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#18181B]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 flex items-center justify-center text-[#FF9F0A]">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white font-manrope">
                Personalización y Fondos
              </h2>
              <p className="text-[11px] text-gray-400">
                Guardado instantáneo en tu navegador (localStorage) sin sobrecargar el servidor.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/[0.06] bg-[#0E0E11]/60 text-xs font-bold font-manrope">
          <button
            onClick={() => setActiveTab("wallpapers")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "wallpapers"
                ? "bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/30"
                : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Fondos de Pantalla</span>
          </button>

          <button
            onClick={() => setActiveTab("glass")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "glass"
                ? "bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/30"
                : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Vidrio y Desenfoque</span>
          </button>

          <button
            onClick={() => setActiveTab("fonts")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "fonts"
                ? "bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/30"
                : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Tipografía y Color</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-sm text-gray-300">
          
          {/* TAB 1: WALLPAPERS */}
          {activeTab === "wallpapers" && (
            <div className="space-y-5">
              
              {/* Preset Wallpapers */}
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block mb-2.5 font-manrope">
                  Fondos Seleccionados (Colección HD)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {THEME_PRESETS.map((p) => {
                    const isSelected = theme.backgroundType === "preset" && theme.presetId === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPreset(p.id)}
                        className={`h-24 rounded-xl border relative overflow-hidden text-left p-2.5 flex flex-col justify-between group transition-all ${
                          isSelected
                            ? "border-[#FF9F0A] ring-2 ring-[#FF9F0A]/30 shadow-lg"
                            : "border-white/[0.08] hover:border-white/[0.25]"
                        }`}
                        style={{
                          backgroundImage: p.url ? `url(${p.url})` : "none",
                          backgroundColor: p.preview,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/35 transition-colors"></div>
                        <div className="relative z-10 flex items-center justify-between w-full">
                          <span className="text-[11px] font-bold text-white font-manrope drop-shadow-md">
                            {p.name}
                          </span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#FF9F0A] text-black flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <span className="relative z-10 text-[9px] text-gray-300 drop-shadow line-clamp-1">
                          {p.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image URL */}
              <div className="p-4 rounded-xl bg-[#0E0E11] border border-white/[0.08] space-y-2">
                <span className="text-xs font-bold text-white block font-manrope">
                  Usar imagen de internet (URL directa)
                </span>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Pega el enlace de cualquier fondo de Unsplash, Pinterest o Imgur:
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 bg-[#141416] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 font-mono-code outline-none focus:border-[#FF9F0A]"
                  />
                  <button
                    onClick={handleApplyUrl}
                    className="pf-btn-primary px-3.5 py-2 text-xs font-bold"
                  >
                    Aplicar
                  </button>
                </div>
              </div>

              {/* Upload Local Image */}
              <div className="p-4 rounded-xl bg-[#0E0E11] border border-white/[0.08] space-y-2">
                <span className="text-xs font-bold text-white block font-manrope">
                  Subir fondo desde tu dispositivo
                </span>
                <p className="text-[11px] text-gray-400">
                  La imagen se almacena exclusivamente en tu navegador (Base64 DataURL).
                </p>
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/[0.15] hover:border-[#FF9F0A]/50 bg-[#141416] hover:bg-[#1B1B1E] cursor-pointer transition-all text-xs font-bold text-gray-300 hover:text-white">
                  <Upload className="w-4 h-4 text-[#FF9F0A]" />
                  <span>Seleccionar imagen (máx 2.5 MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {uploadError && (
                  <p className="text-xs text-[#FF6961] font-semibold flex items-center gap-1.5 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {uploadError}
                  </p>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: GLASS & BLUR */}
          {activeTab === "glass" && (
            <div className="space-y-5">
              
              {/* Blur Slider */}
              <div className="p-4 rounded-xl bg-[#0E0E11] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white font-manrope">Desenfoque de fondo (Blur)</span>
                  <span className="font-mono-code text-[#FF9F0A]">{theme.bgBlur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={theme.bgBlur}
                  onChange={(e) => onUpdateTheme({ ...theme, bgBlur: parseInt(e.target.value, 10) })}
                  className="w-full accent-[#FF9F0A] cursor-pointer"
                />
                <p className="text-[11px] text-gray-400">
                  Añade un efecto de profundidad cinematográfico detrás de tu bloc de notas.
                </p>
              </div>

              {/* Panel Opacity Slider */}
              <div className="p-4 rounded-xl bg-[#0E0E11] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white font-manrope">Transparencia del Bloc (Glassmorphism)</span>
                  <span className="font-mono-code text-[#FF9F0A]">{Math.round(theme.panelOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="1.0"
                  step="0.05"
                  value={theme.panelOpacity}
                  onChange={(e) => onUpdateTheme({ ...theme, panelOpacity: parseFloat(e.target.value) })}
                  className="w-full accent-[#FF9F0A] cursor-pointer"
                />
                <p className="text-[11px] text-gray-400">
                  Ajusta qué tan visible es el fondo a través de la tarjeta de escritura.
                </p>
              </div>

              {/* Background Darkness Slider */}
              <div className="p-4 rounded-xl bg-[#0E0E11] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white font-manrope">Tinte Oscuro de Contraste</span>
                  <span className="font-mono-code text-[#FF9F0A]">{Math.round(theme.bgDarkness * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.9"
                  step="0.05"
                  value={theme.bgDarkness}
                  onChange={(e) => onUpdateTheme({ ...theme, bgDarkness: parseFloat(e.target.value) })}
                  className="w-full accent-[#FF9F0A] cursor-pointer"
                />
                <p className="text-[11px] text-gray-400">
                  Oscurece la imagen para garantizar que las letras blancas siempre tengan 100% de legibilidad.
                </p>
              </div>

            </div>
          )}

          {/* TAB 3: FONTS & ACCENT COLOR */}
          {activeTab === "fonts" && (
            <div className="space-y-5">
              
              {/* Font Family Selection */}
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block mb-2.5 font-manrope">
                  Tipografía del Editor
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FONT_OPTIONS.map((f) => {
                    const isSelected = theme.fontFamily === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => onUpdateTheme({ ...theme, fontFamily: f.id })}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? "bg-[#FF9F0A]/15 border-[#FF9F0A] text-white"
                            : "bg-[#0E0E11] border-white/[0.08] text-gray-400 hover:text-white hover:bg-[#141416]"
                        }`}
                      >
                        <div>
                          <span className="text-xs font-bold block" style={{ fontFamily: f.css }}>
                            {f.name}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono-code">
                            Ejemplo: Aa Bb 123 !@#
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#FF9F0A]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color Selection */}
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block mb-2.5 font-manrope">
                  Color de Acento
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ACCENT_COLORS.map((a) => {
                    const isSelected = theme.accentColor === a.color;
                    return (
                      <button
                        key={a.id}
                        onClick={() => onUpdateTheme({ ...theme, accentColor: a.color })}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-white/[0.08] border-white/[0.25] text-white"
                            : "bg-[#0E0E11] border-white/[0.06] text-gray-400 hover:text-white"
                        }`}
                      >
                        <span 
                          className="w-4 h-4 rounded-full shrink-0 shadow-sm border border-white/20"
                          style={{ backgroundColor: a.color }}
                        />
                        <span className="truncate">{a.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-white/[0.08] bg-[#18181B]/80 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer por defecto</span>
          </button>

          <button
            onClick={onClose}
            className="pf-btn-primary px-5 py-2 text-xs font-bold font-manrope"
          >
            Listo y Guardar
          </button>
        </div>

      </div>
    </div>
  );
}
