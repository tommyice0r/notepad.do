/**
 * Notepad.do - Theme & Wallpaper Customization Manager
 * Persists 100% in client-side localStorage to prevent server saturation.
 */

export const THEME_PRESETS = [
  {
    id: "default",
    name: "Obsidiana ProxiesFood",
    desc: "Estilo minimalista oscuro nativo",
    preview: "#060607",
    url: null,
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk City",
    desc: "Luces de neón y asfalto nocturno",
    preview: "#0f172a",
    url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "space",
    name: "Espacio Profundo",
    desc: "Nebulosa cósmica y estrellas",
    preview: "#030712",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "lofi",
    name: "Lo-Fi Study Mood",
    desc: "Ambiente cálido y relajante",
    preview: "#1c1917",
    url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "matrix",
    name: "Matrix Hacker",
    desc: "Código digital y terminal hacker",
    preview: "#022c22",
    url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "coffee",
    name: "Café Minimalista",
    desc: "Tonos madera y luz acogedora",
    preview: "#291b12",
    url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "mountain",
    name: "Montaña Nocturna",
    desc: "Siluetas alpinas bajo las estrellas",
    preview: "#0f172a",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1600&auto=format&fit=crop",
  },
];

export const ACCENT_COLORS = [
  { id: "orange", name: "Naranja ProxiesFood", color: "#FF9F0A" },
  { id: "cyan", name: "Cian Cyberpunk", color: "#00F0FF" },
  { id: "emerald", name: "Verde Esmeralda", color: "#30D158" },
  { id: "purple", name: "Púrpura Neón", color: "#A855F7" },
  { id: "red", name: "Rojo Carmesí", color: "#FF453A" },
  { id: "white", name: "Blanco Minimal", color: "#FFFFFF" },
];

export const FONT_OPTIONS = [
  { id: "IBM Plex Mono", name: "IBM Plex Mono (Hacker / Código)", css: "'IBM Plex Mono', monospace" },
  { id: "Manrope", name: "Manrope (Moderno & Limpio)", css: "'Manrope', sans-serif" },
  { id: "Courier Prime", name: "Courier Prime (Máquina de escribir)", css: "'Courier Prime', monospace" },
  { id: "monospace", name: "Monospace Puro", css: "ui-monospace, monospace" },
  { id: "sans-serif", name: "Sistema Sans", css: "system-ui, sans-serif" },
];

export const DEFAULT_THEME = {
  backgroundType: "preset", // 'preset' | 'url' | 'upload' | 'default'
  presetId: "default",
  customImageUrl: "",
  uploadedImage: "",
  bgBlur: 6,
  bgDarkness: 0.65,
  panelOpacity: 0.92,
  fontFamily: "IBM Plex Mono",
  accentColor: "#FF9F0A",
};

const STORAGE_KEY = "notepad_custom_theme_v2";

// Load theme from localStorage
export function loadSavedTheme() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_THEME, ...parsed };
    }
  } catch (e) {
    console.error("Error cargando tema de localStorage:", e);
  }
  return DEFAULT_THEME;
}

// Save theme to localStorage
export function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  } catch (e) {
    console.error("Error guardando tema en localStorage:", e);
  }
}

// Get active background image URL
export function getActiveBackgroundUrl(theme) {
  if (theme.backgroundType === "upload" && theme.uploadedImage) {
    return theme.uploadedImage;
  }
  if (theme.backgroundType === "url" && theme.customImageUrl) {
    return theme.customImageUrl;
  }
  if (theme.backgroundType === "preset" && theme.presetId !== "default") {
    const preset = THEME_PRESETS.find(p => p.id === theme.presetId);
    return preset ? preset.url : null;
  }
  return null;
}
