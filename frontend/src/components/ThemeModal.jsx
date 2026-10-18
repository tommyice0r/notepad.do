import { useState, useEffect } from "react";
import { 
  X, Image as ImageIcon, Sliders, Type, 
  Palette, Upload, RefreshCw, Check, Sparkles, 
  AlertCircle, Film, Link2, Trash2, CheckCircle2 
} from "lucide-react";
import { 
  THEME_PRESETS, ACCENT_COLORS, FONT_OPTIONS, 
  DEFAULT_THEME, getActiveBackgroundUrl,
  saveUploadedWallpaperBlob, getUploadedWallpaperBlob, deleteUploadedWallpaperBlob
} from "../utils/themeManager";

const QUICK_GIF_LINKS = [
  { name: "Cyberpunk Rain", url: "https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif" },
  { name: "Lo-Fi Study", url: "https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif" },
  { name: "Matrix Code", url: "https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif" },
  { name: "Synthwave 80s", url: "https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif" },
  { name: "Pixel Sunset", url: "https://media.giphy.com/media/l0HlTy9x8FZo0XO1i/giphy.gif" },
  { name: "Espacio Warp", url: "https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif" },
];

export default function ThemeModal({ theme, onUpdateTheme, onClose }) {
  const [activeTab, setActiveTab] = useState("wallpapers"); // 'wallpapers' | 'glass' | 'fonts'
  const [wallpaperFilter, setWallpaperFilter] = useState("all"); // 'all' | 'gif' | 'photo'
  const [urlInput, setUrlInput] = useState(theme.customImageUrl || "");
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState("");

  // Load active blob preview if current background is user upload
  useEffect(() => {
    let localUrl = null;
    let isMounted = true;

    async function loadUploadPreview() {
      if (theme.backgroundType === "upload") {
        if (theme.uploadedImage) {
          if (isMounted) setUploadedPreviewUrl(theme.uploadedImage);
          return;
        }
        const blob = await getUploadedWallpaperBlob();
        if (blob && isMounted) {
          localUrl = URL.createObjectURL(blob);
          setUploadedPreviewUrl(localUrl);
        }
      } else {
        if (isMounted) setUploadedPreviewUrl("");
      }
    }

    loadUploadPreview();

    return () => {
      isMounted = false;
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [theme.backgroundType, theme.hasUploadedBlob, theme.uploadedImage]);

  const handleSelectPreset = (presetId) => {
    const preset = THEME_PRESETS.find(p => p.id === presetId);
    onUpdateTheme({
      ...theme,
      backgroundType: "preset",
      presetId,
      isGif: preset ? preset.isGif : false,
    });
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    const isGifUrl = trimmed.toLowerCase().includes(".gif") || trimmed.includes("giphy.com");
    onUpdateTheme({
      ...theme,
      backgroundType: "url",
      customImageUrl: trimmed,
      isGif: isGifUrl,
    });
  };

  const handleQuickUrl = (quickUrl) => {
    setUrlInput(quickUrl);
    const isGifUrl = quickUrl.toLowerCase().includes(".gif") || quickUrl.includes("giphy.com");
    onUpdateTheme({
      ...theme,
      backgroundType: "url",
      customImageUrl: quickUrl,
      isGif: isGifUrl,
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isGif = file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
    const isImage = file.type.startsWith("image/");

    if (!isImage && !isGif) {
      setUploadError("Por favor selecciona un archivo de imagen o GIF válido (.gif, .png, .jpg, .webp).");
      return;
    }

    // Support up to 15MB via IndexedDB
    if (file.size > 15 * 1024 * 1024) {
      setUploadError("El archivo no debe exceder los 15MB.");
      return;
    }

    setUploadError("");
    setIsUploading(true);

    try {
      const saved = await saveUploadedWallpaperBlob(file);
      if (!saved) {
        throw new Error("No se pudo escribir en el almacenamiento del navegador");
      }

      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + " MB";

      onUpdateTheme({
        ...theme,
        backgroundType: "upload",
        uploadedImage: "", // keep localStorage clean
        hasUploadedBlob: true,
        uploadedFileName: file.name,
        uploadedFileSize: sizeStr,
        isGif: isGif,
        presetId: null,
      });
    } catch (err) {
      console.error("Error al guardar fondo:", err);
      setUploadError("Error guardando el archivo en el navegador: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveUploaded = async () => {
    await deleteUploadedWallpaperBlob();
    setUploadedPreviewUrl("");
    onUpdateTheme({
      ...theme,
      backgroundType: "preset",
      presetId: "default",
      hasUploadedBlob: false,
      uploadedImage: "",
      uploadedFileName: "",
      uploadedFileSize: "",
      isGif: false,
    });
  };

  const handleReset = () => {
    deleteUploadedWallpaperBlob();
    onUpdateTheme(DEFAULT_THEME);
    setUrlInput("");
    setUploadError("");
    setUploadedPreviewUrl("");
  };

  const filteredPresets = THEME_PRESETS.filter(p => {
    if (wallpaperFilter === "all") return true;
    if (wallpaperFilter === "gif") return p.isGif;
    if (wallpaperFilter === "photo") return !p.isGif && p.url !== null;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-5">
      <div className="w-full max-w-2xl pf-panel shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] border border-white/[0.12] bg-[#141416]/95 backdrop-blur-2xl">
        
        {/* Header */}
        <div className="px-3.5 sm:px-5 py-3 sm:py-4 border-b border-white/[0.08] flex items-center justify-between gap-2 bg-[#18181B]/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 flex items-center justify-center text-[#FF9F0A] shrink-0">
              <Palette className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-white font-manrope truncate">
                Personalización, Fondos & GIFs
              </h2>
              <p className="text-[11px] text-gray-400 truncate">
                Soporte de GIFs animados fluidos, fotos HD y almacenamiento local.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 border-b border-white/[0.06] bg-[#0E0E11]/60 text-xs font-bold font-manrope overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("wallpapers")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 whitespace-nowrap ${
              activeTab === "wallpapers"
                ? "bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/30"
                : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Film className="w-3.5 h-3.5 shrink-0" />
            <span>Fondos & GIFs</span>
          </button>

          <button
            onClick={() => setActiveTab("glass")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 whitespace-nowrap ${
              activeTab === "glass"
                ? "bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/30"
                : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span>Vidrio & Desenfoque</span>
          </button>

          <button
            onClick={() => setActiveTab("fonts")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 whitespace-nowrap ${
              activeTab === "fonts"
                ? "bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/30"
                : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Type className="w-3.5 h-3.5 shrink-0" />
            <span>Tipografía & Color</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 space-y-5 text-sm text-gray-300">
          
          {/* TAB 1: WALLPAPERS & GIFS */}
          {activeTab === "wallpapers" && (
            <div className="space-y-5">
              
              {/* Presets Header with Sub-filters */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 font-manrope">
                    Colección de Fondos & GIFs
                  </span>

                  <div className="flex items-center gap-1 bg-[#0E0E11] p-1 rounded-lg border border-white/[0.06] text-[11px] font-manrope overflow-x-auto no-scrollbar">
                    <button
                      onClick={() => setWallpaperFilter("all")}
                      className={`px-2.5 py-1 rounded-md transition-colors shrink-0 whitespace-nowrap ${
                        wallpaperFilter === "all" ? "bg-white/[0.12] text-white font-bold" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setWallpaperFilter("gif")}
                      className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors shrink-0 whitespace-nowrap ${
                        wallpaperFilter === "gif" ? "bg-[#FF9F0A]/20 text-[#FF9F0A] font-bold border border-[#FF9F0A]/30" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <Film className="w-3 h-3 shrink-0" />
                      <span>GIFs Animados</span>
                    </button>
                    <button
                      onClick={() => setWallpaperFilter("photo")}
                      className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors shrink-0 whitespace-nowrap ${
                        wallpaperFilter === "photo" ? "bg-white/[0.12] text-white font-bold" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <ImageIcon className="w-3 h-3 shrink-0" />
                      <span>Fotos HD</span>
                    </button>
                  </div>
                </div>

                {/* Preset Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5">
                  {filteredPresets.map((p) => {
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
                        <div className="absolute inset-0 bg-black/55 group-hover:bg-black/35 transition-colors"></div>
                        
                        {/* Top Bar inside card */}
                        <div className="relative z-10 flex items-center justify-between w-full">
                          <span className="text-[11px] font-bold text-white font-manrope drop-shadow-md truncate pr-1">
                            {p.name}
                          </span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#FF9F0A] text-black flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>

                        {/* Bottom Tag */}
                        <div className="relative z-10 flex items-center justify-between gap-1 w-full">
                          <span className="text-[9px] text-gray-300 drop-shadow line-clamp-1">
                            {p.desc}
                          </span>
                          {p.isGif && (
                            <span className="px-1 py-0.2 rounded bg-[#FF9F0A]/20 border border-[#FF9F0A]/40 text-[#FF9F0A] text-[8px] font-extrabold uppercase shrink-0">
                              GIF
                            </span>
                          )}
                          {!p.isGif && p.url && (
                            <span className="px-1 py-0.2 rounded bg-white/10 border border-white/20 text-gray-300 text-[8px] font-bold uppercase shrink-0">
                              HD
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Direct URL Section with Quick GIF Chips */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#0E0E11] border border-white/[0.08] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 font-manrope">
                    <Link2 className="w-3.5 h-3.5 text-[#FF9F0A] shrink-0" />
                    <span>Pegar URL directa (GIF animado o imagen)</span>
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono-code">
                    Giphy / Tenor / Imgur / Direct .gif
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    placeholder="https://media.giphy.com/.../giphy.gif"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 min-w-0 bg-[#141416] border border-white/[0.08] rounded-xl px-3 py-2 text-base sm:text-xs text-white placeholder-gray-500 font-mono-code outline-none focus:border-[#FF9F0A]"
                  />
                  <button
                    onClick={handleApplyUrl}
                    className="pf-btn-primary px-4 py-2 text-xs font-bold font-manrope shrink-0"
                  >
                    Aplicar
                  </button>
                </div>

                {/* Quick GIF preset pills */}
                <div>
                  <span className="text-[10px] text-gray-400 block mb-1.5 font-manrope font-semibold">
                    Atajos rápidos de GIFs animados:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_GIF_LINKS.map((q) => (
                      <button
                        key={q.name}
                        onClick={() => handleQuickUrl(q.url)}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-[#FF9F0A]/15 border border-white/[0.08] hover:border-[#FF9F0A]/30 text-[10px] text-gray-300 hover:text-[#FF9F0A] font-mono-code transition-colors flex items-center gap-1"
                      >
                        <Film className="w-2.5 h-2.5 opacity-70 shrink-0" />
                        <span>{q.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upload Local Image or Animated GIF */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#0E0E11] border border-white/[0.08] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 font-manrope">
                    <Upload className="w-3.5 h-3.5 text-[#FF9F0A] shrink-0" />
                    <span>Subir archivo GIF o foto desde tu equipo</span>
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono-code">
                    IndexedDB (Hasta 15 MB)
                  </span>
                </div>

                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Los GIFs o imágenes se almacenan exclusivamente en el almacenamiento local de tu navegador sin saturar el servidor backend.
                </p>

                {/* Upload Active Card if user uploaded file */}
                {theme.backgroundType === "upload" && uploadedPreviewUrl && (
                  <div className="p-3 rounded-xl bg-[#141416] border border-[#FF9F0A]/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div 
                        className="w-12 h-12 rounded-lg bg-cover bg-center border border-white/20 shrink-0"
                        style={{ backgroundImage: `url(${uploadedPreviewUrl})` }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#30D158] shrink-0" />
                          <span className="text-xs font-bold text-white font-manrope truncate">
                            {theme.uploadedFileName || "Archivo subido activo"}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono-code block truncate">
                          {theme.isGif ? "GIF Animado" : "Imagen HD"} • {theme.uploadedFileSize || "Local IndexedDB"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleRemoveUploaded}
                      className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[#FF453A] border border-red-500/20 text-xs font-bold font-manrope flex items-center gap-1.5 transition-colors shrink-0"
                      title="Eliminar fondo personalizado"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Quitar</span>
                    </button>
                  </div>
                )}

                <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/[0.15] hover:border-[#FF9F0A]/50 bg-[#141416] hover:bg-[#1B1B1E] cursor-pointer transition-all text-xs font-bold text-gray-300 hover:text-white text-center">
                  <Upload className="w-4 h-4 text-[#FF9F0A] shrink-0" />
                  <span>
                    {isUploading ? "Guardando en el navegador..." : "Seleccionar archivo GIF o Imagen (máx 15 MB)"}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.gif"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>

                {uploadError && (
                  <p className="text-xs text-[#FF6961] font-semibold flex items-center gap-1.5 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{uploadError}</span>
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
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>0px (Total nitidez para GIFs animados)</span>
                  <span>20px (Efecto difuminado ambiental)</span>
                </div>
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
                  Ajusta qué tan visible es el fondo o GIF animado a través de la tarjeta de escritura.
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
                  Oscurece la imagen o animación para garantizar que las letras blancas siempre tengan 100% de legibilidad.
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
        <div className="px-3.5 sm:px-5 py-3 sm:py-3.5 border-t border-white/[0.08] bg-[#18181B]/80 flex items-center justify-between gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span>Restablecer</span>
          </button>

          <button
            onClick={onClose}
            className="pf-btn-primary px-4 sm:px-5 py-2 text-xs font-bold font-manrope shrink-0"
          >
            Listo y Guardar
          </button>
        </div>

      </div>
    </div>
  );
}
