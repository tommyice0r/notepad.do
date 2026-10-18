/**
 * Notepad.do - Theme, Wallpaper & GIF Background Manager
 * Supports:
 * - High-FPS Animated GIFs (Presets, Direct URLs, Local File Uploads)
 * - Ultra-HD Static Wallpapers (Presets & Custom)
 * - Local storage optimization with IndexedDB to support large animated GIFs (up to 15MB)
 *   without exhausting browser localStorage quotas.
 */

export const THEME_PRESETS = [
  {
    id: "default",
    name: "Obsidiana ProxiesFood",
    desc: "Estilo minimalista oscuro nativo",
    preview: "#060607",
    url: null,
    isGif: false,
    category: "minimal",
  },
  // Animated GIF Presets (Smooth 60fps ambient backgrounds)
  {
    id: "gif-cyberpunk",
    name: "Cyberpunk Rain",
    desc: "Lluvia de neón en metrópolis nocturna",
    preview: "#0b0f19",
    url: "https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif",
    isGif: true,
    category: "gif",
  },
  {
    id: "gif-lofi",
    name: "Lo-Fi Study Mood",
    desc: "Ambiente relajante y lluvia en la ventana",
    preview: "#17141f",
    url: "https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif",
    isGif: true,
    category: "gif",
  },
  {
    id: "gif-matrix",
    name: "Matrix Rain Code",
    desc: "Cascada de código terminal hacker",
    preview: "#021a0d",
    url: "https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif",
    isGif: true,
    category: "gif",
  },
  {
    id: "gif-synthwave",
    name: "Synthwave Grid",
    desc: "Carretera ochentera y atardecer retro",
    preview: "#22002b",
    url: "https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif",
    isGif: true,
    category: "gif",
  },
  {
    id: "gif-pixel",
    name: "Pixel Art Sunset",
    desc: "Estética 16-bit retro de cielo púrpura",
    preview: "#1d0f28",
    url: "https://media.giphy.com/media/l0HlTy9x8FZo0XO1i/giphy.gif",
    isGif: true,
    category: "gif",
  },
  {
    id: "gif-space",
    name: "Espacio Warp Speed",
    desc: "Viaje interestelar a velocidad luz",
    preview: "#000511",
    url: "https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif",
    isGif: true,
    category: "gif",
  },
  {
    id: "gif-fireplace",
    name: "Hoguera Invernal",
    desc: "Fuego reconfortante en la oscuridad",
    preview: "#1a0b06",
    url: "https://media.giphy.com/media/3ov9jZafE8UAC8hBgk/giphy.gif",
    isGif: true,
    category: "gif",
  },
  // Static HD Photography Presets
  {
    id: "cyberpunk",
    name: "Cyberpunk City HD",
    desc: "Luces de neón y asfalto nocturno",
    preview: "#0f172a",
    url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=1600&auto=format&fit=crop",
    isGif: false,
    category: "photo",
  },
  {
    id: "space",
    name: "Espacio Profundo HD",
    desc: "Nebulosa cósmica y estrellas",
    preview: "#030712",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1600&auto=format&fit=crop",
    isGif: false,
    category: "photo",
  },
  {
    id: "mountain",
    name: "Montaña Nocturna HD",
    desc: "Siluetas alpinas bajo las estrellas",
    preview: "#0f172a",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1600&auto=format&fit=crop",
    isGif: false,
    category: "photo",
  },
  {
    id: "coffee",
    name: "Café Minimalista HD",
    desc: "Tonos madera y luz cálida",
    preview: "#291b12",
    url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1600&auto=format&fit=crop",
    isGif: false,
    category: "photo",
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
  uploadedImage: "", // legacy fallback base64
  hasUploadedBlob: false,
  uploadedFileName: "",
  uploadedFileSize: "",
  isGif: false,
  bgBlur: 6,
  bgDarkness: 0.65,
  panelOpacity: 0.92,
  fontFamily: "IBM Plex Mono",
  accentColor: "#FF9F0A",
};

const STORAGE_KEY = "notepad_custom_theme_v2";

// --- IndexedDB Storage Engine for Large Files (GIFs up to 15MB) ---
const DB_NAME = "notepad_assets_db";
const STORE_NAME = "wallpapers";
const DB_VERSION = 1;

function openAssetsDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB no disponible"));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveUploadedWallpaperBlob(blobOrFile) {
  try {
    const db = await openAssetsDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const data = {
        id: "active_wallpaper",
        blob: blobOrFile,
        mimeType: blobOrFile.type || "image/gif",
        name: blobOrFile.name || "wallpaper.gif",
        updatedAt: Date.now(),
      };
      const req = store.put(data);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB save error:", err);
    return false;
  }
}

export async function getUploadedWallpaperBlob() {
  try {
    const db = await openAssetsDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get("active_wallpaper");
      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          resolve(req.result.blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB get error:", err);
    return null;
  }
}

export async function deleteUploadedWallpaperBlob() {
  try {
    const db = await openAssetsDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete("active_wallpaper");
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB delete error:", err);
    return false;
  }
}

// Load theme from localStorage
export function loadSavedTheme() {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return DEFAULT_THEME;
  }
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
    // Avoid saving large base64 strings in localStorage if blob is tracked
    const toSave = { ...theme };
    if (toSave.hasUploadedBlob && toSave.uploadedImage && toSave.uploadedImage.length > 500) {
      toSave.uploadedImage = ""; // Strip large base64 string to keep localStorage small
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error("Error guardando tema en localStorage:", e);
  }
}

// Synchronous helper for active background URL (presets & custom URLs)
export function getActiveBackgroundUrl(theme) {
  if (theme.backgroundType === "url" && theme.customImageUrl) {
    return theme.customImageUrl;
  }
  if (theme.backgroundType === "preset" && theme.presetId !== "default") {
    const preset = THEME_PRESETS.find(p => p.id === theme.presetId);
    return preset ? preset.url : null;
  }
  if (theme.backgroundType === "upload" && theme.uploadedImage) {
    return theme.uploadedImage;
  }
  return null;
}
