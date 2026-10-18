import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import api from "./utils/api";
import Editor from "./components/Editor";
import Admin from "./components/Admin";
import BrandLogo from "./components/BrandLogo";
import CookieConsent, { openCookiePreferences } from "./components/CookieConsent";

// AdSense Compliance & Landing Pages
import Landing from "./pages/Landing";
import About from "./pages/About";
import Faq from "./pages/Faq";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import Contact from "./pages/Contact";
import Dmca from "./pages/Dmca";

// Normalize and validate Google AdSense Publisher ID (ca-pub-XXXXXXXXXXXXXXXX)
function normalizeAdSenseClientId(rawClientId) {
  if (!rawClientId || typeof rawClientId !== "string") return "";
  const trimmed = rawClientId.trim();
  if (!trimmed || trimmed.includes("0000000000000000")) return "";
  const normalized = trimmed.startsWith("pub-") ? `ca-${trimmed}` : trimmed;
  return /^ca-pub-\d{10,20}$/.test(normalized) ? normalized : "";
}

// Generator for short note URLs
function generateRandomSlug(length = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Redirect helper for creating a new note while preserving query params (e.g. UTM / gclid)
function NewNoteRedirect() {
  const location = useLocation();
  const slug = generateRandomSlug();
  return <Navigate to={`/${slug}${location.search || ""}`} replace />;
}

// Dynamic SEO & Robots Meta Manager per route
function RouteSeoManager({ isNoteLocked = false }) {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const seoMap = {
      "/info": {
        title: "Guía y Características — Notepad.do | Bloc de Notas Online y Calculadora",
        description:
          "Conoce todas las herramientas de Notepad.do: guardado automático en la nube, calculadora reactiva con variables, cifrado opcional y formatos de texto.",
        canonical: "https://notepad.do/info",
        robots: "index, follow",
      },
      "/acerca-de": {
        title: "Acerca de Nosotros — Notepad.do | Productividad y Desarrollo Web",
        description:
          "Conoce la misión, arquitectura técnica y equipo detrás de Notepad.do, el bloc de notas minimalista en la nube con cálculo en tiempo real.",
        canonical: "https://notepad.do/acerca-de",
        robots: "index, follow",
      },
      "/faq": {
        title: "Preguntas Frecuentes (FAQ) — Notepad.do",
        description:
          "Respuestas detalladas sobre cómo funciona Notepad.do, guardado en tiempo real, privacidad con contraseñas, cálculo matemático y límites de uso.",
        canonical: "https://notepad.do/faq",
        robots: "index, follow",
      },
      "/privacidad": {
        title: "Política de Privacidad — Notepad.do",
        description:
          "Política de tratamiento de datos, almacenamiento en la nube, uso de cookies publicitarias (Google AdSense) y derechos ARCO/RGPD en Notepad.do.",
        canonical: "https://notepad.do/privacidad",
        robots: "index, follow",
      },
      "/terminos": {
        title: "Términos y Condiciones de Uso — Notepad.do",
        description:
          "Condiciones legales de servicio, reglas de uso aceptable, propiedad intelectual y políticas de moderación de Notepad.do.",
        canonical: "https://notepad.do/terminos",
        robots: "index, follow",
      },
      "/cookies": {
        title: "Política de Cookies — Notepad.do",
        description:
          "Información transparente sobre el uso de almacenamiento técnico local y cookies de Google AdSense (Google Consent Mode v2) en Notepad.do.",
        canonical: "https://notepad.do/cookies",
        robots: "index, follow",
      },
      "/contacto": {
        title: "Contacto y Soporte Técnico — Notepad.do",
        description:
          "Ponte en contacto con el equipo de soporte técnico, administración y consultas legales de Notepad.do.",
        canonical: "https://notepad.do/contacto",
        robots: "index, follow",
      },
      "/reportar-abuso": {
        title: "Reportar Abuso o Infracción DMCA — Notepad.do",
        description:
          "Canal oficial para reportar enlaces que vulneren derechos de autor (DMCA) o nuestras políticas de uso aceptable.",
        canonical: "https://notepad.do/reportar-abuso",
        robots: "index, follow",
      },
      "/admin": {
        title: "Administración — Notepad.do",
        description: "Panel administrativo interno de Notepad.do.",
        canonical: "https://notepad.do/admin",
        robots: "noindex, nofollow",
      },
    };

    const current = seoMap[path] || {
      title: "Notepad.do — Bloc de Notas Online Rápido, Código y Calculadora",
      description:
        "Bloc de notas online gratuito y minimalista con guardado automático en la nube, calculadora integrada con variables y protección opcional por contraseña.",
      canonical: "https://notepad.do/",
      robots: isNoteLocked ? "noindex, nofollow" : "index, follow",
    };

    document.title = current.title;

    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      descMeta.setAttribute("content", current.description);
    }

    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.setAttribute("name", "robots");
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute("content", current.robots);

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", current.canonical);
  }, [location.pathname, isNoteLocked]);

  return null;
}

// Rich Editorial Documentation & Quick Guide rendered below the editor for users and AdSense crawlers
function EditorEditorialGuide() {
  return (
    <section
      aria-label="Guía de uso y documentación de Notepad.do"
      style={{ contentVisibility: "auto", containIntrinsicSize: "420px" }}
      className="w-full max-w-[1300px] mx-auto mt-5 sm:mt-8 mb-4 bg-[#101012]/90 border border-white/[0.07] rounded-2xl p-4 sm:p-7 text-gray-300 shadow-lg"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 sm:pb-5 border-b border-white/[0.07]">
        <div>
          <span className="inline-block text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#FF9F0A] bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 px-2.5 py-0.5 rounded-full mb-2">
            Guía de Productividad y Documentación
          </span>
          <h1 className="text-base sm:text-xl font-extrabold text-white tracking-tight leading-snug">
            Notepad.do — Bloc de Notas en la Nube, Editor de Código y Hoja de Cálculo Reactiva
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-3xl leading-relaxed">
            Escribe, guarda y comparte notas técnicas o borradores de trabajo al instante sin crear cuentas.
            Cada URL única funciona como un espacio sincronizado con herramientas de formato, cálculo matemático y cifrado opcional.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/info"
            className="flex-1 sm:flex-none text-center text-xs font-semibold px-3.5 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.08] transition-colors"
          >
            Ver guía completa
          </Link>
          <Link
            to="/faq"
            className="flex-1 sm:flex-none text-center text-xs font-semibold px-3.5 py-2 rounded-lg bg-[#FF9F0A]/15 hover:bg-[#FF9F0A]/25 text-[#FF9F0A] border border-[#FF9F0A]/30 transition-colors"
          >
            Preguntas frecuentes
          </Link>
        </div>
      </div>

      {/* 3-Column Feature & Tutorial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5 py-4 sm:py-5 border-b border-white/[0.07] text-xs sm:text-sm leading-relaxed">
        <article className="bg-black/30 border border-white/[0.05] rounded-xl p-3.5 sm:p-4">
          <h2 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF9F0A] shrink-0" />
            <span>1. URLs Directas y Guardado Automático</span>
          </h2>
          <p className="text-gray-400">
            Cada nota se identifica mediante su ruta en el navegador (por ejemplo, <code className="text-gray-200 font-mono-code">notepad.do/equipo-sprint</code>).
            Mientras escribes, el sistema sincroniza los cambios en la nube tras una breve pausa de 800 milisegundos y conserva una copia local de respaldo en tu navegador para evitar pérdidas por cortes de conexión.
          </p>
        </article>

        <article className="bg-black/30 border border-white/[0.05] rounded-xl p-3.5 sm:p-4">
          <h2 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span>2. Motor Matemático con Variables</span>
          </h2>
          <p className="text-gray-400">
            Combina texto libre con presupuestos o conversiones sin abrir una hoja de cálculo. Declara variables como{" "}
            <code className="text-gray-200 font-mono-code">servidor = 45</code>,{" "}
            <code className="text-gray-200 font-mono-code">licencias = 120</code> y evalúa fórmulas en líneas posteriores añadiendo el signo{" "}
            <code className="text-emerald-400 font-mono-code">=</code> al final (por ejemplo,{" "}
            <code className="text-gray-200 font-mono-code">servidor + licencias =</code>).
          </p>
        </article>

        <article className="bg-black/30 border border-white/[0.05] rounded-xl p-3.5 sm:p-4">
          <h2 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
            <span>3. Herramientas para Desarrolladores y Privacidad</span>
          </h2>
          <p className="text-gray-400">
            Incluye resaltado automático de fragmentos de código, limpieza rápida de listas (eliminar líneas vacías, ordenar alfabéticamente o quitar duplicados), exportación directa a archivo <code className="text-gray-200 font-mono-code">.txt</code> y protección opcional por contraseña verificada con hash criptográfico.
          </p>
        </article>
      </div>

      {/* Practical Keyboard & Workflow Tips */}
      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-400">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="font-semibold text-gray-300">Consejos rápidos:</span>
          <span>• Usa el botón <strong className="text-gray-200">Compartir</strong> para generar tu código QR.</span>
          <span>• Activa el <strong className="text-gray-200">Candado</strong> si deseas restringir el acceso a tu borrador.</span>
          <span>• Usa el estudio <strong className="text-gray-200">Aa</strong> para transformar mayúsculas o limpiar listas.</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-gray-400">
          <Link to="/acerca-de" className="hover:text-white underline underline-offset-4 transition-colors">
            Sobre el proyecto
          </Link>
          <span>·</span>
          <Link to="/privacidad" className="hover:text-white underline underline-offset-4 transition-colors">
            Seguridad y Privacidad
          </Link>
        </div>
      </div>
    </section>
  );
}

// Editor Note Page (Clean layout without manual banner slots until AdSense approval)
function EditorPage({ appConfig, editorStatus, onEditorStatusChange }) {
  return (
    <div className="min-h-dvh bg-[#060607] text-[#EDEDED] font-manrope flex flex-col justify-between p-1.5 sm:p-4 md:p-6">
      {/* Optional System Announcement Banner configured in Admin */}
      {appConfig?.site_announcement && (
        <div className="w-full max-w-[1300px] mx-auto mb-2 px-4 py-2 rounded-xl bg-[#FF9F0A]/10 border border-[#FF9F0A]/25 text-center text-xs font-medium text-[#FF9F0A]">
          {appConfig.site_announcement}
        </div>
      )}

      {/* CENTRAL NOTEPAD CONTAINER */}
      <main className="w-full max-w-[1300px] mx-auto flex-1 flex flex-col my-1 sm:my-2">
        <Editor
          unlockPrice={appConfig?.unlock_price_usd}
          onStatusChange={onEditorStatusChange}
        />
      </main>

      {/* RICH EDITORIAL DOCUMENTATION (Ensures high-value publisher content for users & AdSense reviewers) */}
      {!editorStatus?.isLocked && <EditorEditorialGuide />}

      {/* Minimal Compliance Footer */}
      <footer className="w-full max-w-[1300px] mx-auto pt-3 pb-2 text-center text-[11px] text-gray-500 flex flex-col sm:flex-row items-center justify-between px-2 gap-2 border-t border-white/[0.04]">
        <span>© {new Date().getFullYear()} Notepad.do — El bloc de notas rápido en la nube</span>
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 sm:gap-3.5">
          <Link to="/nueva" className="hover:text-gray-300 transition-colors">Nuevo</Link>
          <span>·</span>
          <Link to="/info" className="hover:text-gray-300 transition-colors">Guía</Link>
          <span>·</span>
          <Link to="/acerca-de" className="hover:text-gray-300 transition-colors">Acerca de</Link>
          <span>·</span>
          <Link to="/faq" className="hover:text-gray-300 transition-colors">FAQ</Link>
          <span>·</span>
          <Link to="/privacidad" className="hover:text-gray-300 transition-colors">Privacidad</Link>
          <span>·</span>
          <Link to="/terminos" className="hover:text-gray-300 transition-colors">Términos</Link>
          <span>·</span>
          <Link to="/cookies" className="hover:text-gray-300 transition-colors">Cookies</Link>
          <span>·</span>
          <button
            type="button"
            onClick={openCookiePreferences}
            className="hover:text-gray-300 transition-colors cursor-pointer"
          >
            Preferencias de cookies
          </button>
          <span>·</span>
          <Link to="/reportar-abuso" className="hover:text-gray-300 transition-colors">DMCA / Abuso</Link>
          <span>·</span>
          <Link to="/contacto" className="hover:text-gray-300 transition-colors">Contacto</Link>
        </div>
      </footer>
    </div>
  );
}

// Admin Page Wrapper
function AdminPage() {
  return (
    <div className="min-h-screen bg-[#060607] text-[#EDEDED] font-manrope flex flex-col justify-between p-3 sm:p-6">
      <header className="w-full max-w-[1200px] mx-auto pb-4 mb-4 border-b border-white/[0.08] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-white transition-colors group">
          <BrandLogo size="sm" />
          <span>← Volver a Notepad.do</span>
        </Link>
        <Link to="/nueva" className="pf-btn-primary px-3 py-1 text-xs font-bold">
          Abrir nuevo bloc
        </Link>
      </header>
      <main className="w-full max-w-[1200px] mx-auto flex-1 flex flex-col">
        <Admin />
      </main>
      <footer className="w-full max-w-[1200px] mx-auto pt-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Notepad.do — Panel de Administración
      </footer>
    </div>
  );
}

export default function App() {
  const [appConfig, setAppConfig] = useState({
    adsense_enabled: true,
    adsense_client_id: "",
    adsense_slot_top: "",
    adsense_slot_bottom: "",
    adsense_auto_ads: true,
    unlock_price_usd: "2.00",
    site_announcement: "",
  });

  const [editorStatus, setEditorStatus] = useState({
    loading: true,
    isLocked: false,
    hasContent: false,
  });

  // Load public configuration from backend (/api/config)
  useEffect(() => {
    let cancelled = false;
    api
      .get("/config")
      .then((res) => {
        if (!cancelled && res?.data && typeof res.data === "object") {
          setAppConfig((prev) => ({ ...prev, ...res.data }));
        }
      })
      .catch(() => {
        // Keep safe defaults if backend is unreachable
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Dynamically inject Google AdSense verification meta & script once a valid Publisher ID is configured
  useEffect(() => {
    const clientId = normalizeAdSenseClientId(appConfig?.adsense_client_id);
    if (!appConfig?.adsense_enabled || !clientId) return;

    // 1. Ensure <meta name="google-adsense-account" content="ca-pub-..."> exists
    let adsenseMeta = document.querySelector('meta[name="google-adsense-account"]');
    if (!adsenseMeta) {
      adsenseMeta = document.createElement("meta");
      adsenseMeta.setAttribute("name", "google-adsense-account");
      document.head.appendChild(adsenseMeta);
    }
    adsenseMeta.setAttribute("content", clientId);

    // 2. Ensure official adsbygoogle.js script is loaded
    const existingScript = document.querySelector('script[data-adsense-script="true"]');
    if (!existingScript) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
      script.crossOrigin = "anonymous";
      script.setAttribute("data-adsense-script", "true");
      document.head.appendChild(script);
    }
  }, [appConfig?.adsense_enabled, appConfig?.adsense_client_id]);

  return (
    <Router>
      <RouteSeoManager isNoteLocked={editorStatus.isLocked} />

      <Routes>
        {/* Direct notepad at Root (exactly like notepad.pw) */}
        <Route path="/" element={<NewNoteRedirect />} />

        {/* Informative Landing Page at /info for AdSense and visitors */}
        <Route path="/info" element={<Landing />} />

        {/* Note Generator */}
        <Route path="/nueva" element={<NewNoteRedirect />} />

        {/* AdSense Mandatory Compliance & Information Pages */}
        <Route path="/acerca-de" element={<About />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/privacidad" element={<Privacy />} />
        <Route path="/terminos" element={<Terms />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/contacto" element={<Contact />} />
        <Route path="/reportar-abuso" element={<Dmca />} />

        {/* Admin Dashboard */}
        <Route path="/admin" element={<AdminPage />} />

        {/* Note Editor View (Direct slug access: /mi-nota, /abc12345, etc.) */}
        <Route
          path="/:slug"
          element={
            <EditorPage
              appConfig={appConfig}
              editorStatus={editorStatus}
              onEditorStatusChange={setEditorStatus}
            />
          }
        />
      </Routes>

      {/* Global AdSense / GDPR Cookie Consent Banner */}
      <CookieConsent />
    </Router>
  );
}
