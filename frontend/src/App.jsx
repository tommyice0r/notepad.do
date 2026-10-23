import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import api from "./utils/api";
import Editor from "./components/Editor";
import Admin from "./components/Admin";
import BrandLogo from "./components/BrandLogo";
import CookieConsent, { openCookiePreferences } from "./components/CookieConsent";
import { getSeoForPath, isPublicPublisherRoute } from "./utils/seoConfig";
import { createFreshSlug } from "./utils/noteSlug";

// AdSense Compliance, Editorial Guides & Landing Pages
import Landing from "./pages/Landing";
import About from "./pages/About";
import Faq from "./pages/Faq";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import Contact from "./pages/Contact";
import Dmca from "./pages/Dmca";
import { GuidesIndex, GuideArticle, GUIDES_DATA } from "./pages/Guides";

// Normalize and validate Google AdSense Publisher ID (ca-pub-XXXXXXXXXXXXXXXX)
function normalizeAdSenseClientId(rawClientId) {
  if (!rawClientId || typeof rawClientId !== "string") return "";
  const trimmed = rawClientId.trim();
  if (!trimmed || trimmed.includes("0000000000000000")) return "";
  const normalized = trimmed.startsWith("pub-") ? `ca-${trimmed}` : trimmed;
  return /^ca-pub-\d{10,20}$/.test(normalized) ? normalized : "";
}

// Redirect helper for creating a new note (/nueva) while preserving query params (e.g. UTM / gclid)
function NewNoteRedirect() {
  const location = useLocation();
  const [slug] = useState(createFreshSlug);
  return <Navigate to={`/${slug}${location.search || ""}`} replace />;
}

// Dynamic SEO, Canonical, Robots Meta & AdSense Route Guard
function RouteSeoManager({ appConfig }) {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const current = getSeoForPath(path);
    const isPublicRoute = isPublicPublisherRoute(path);

    document.title = current.title;

    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      descMeta.setAttribute("content", current.description);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", current.title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", current.description);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (current.canonical) {
      if (ogUrl) ogUrl.setAttribute("content", current.canonical);
    } else if (ogUrl) {
      ogUrl.remove();
    }

    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.setAttribute("name", "robots");
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute("content", current.robots);

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (current.canonical) {
      if (!canonicalLink) {
        canonicalLink = document.createElement("link");
        canonicalLink.setAttribute("rel", "canonical");
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute("href", current.canonical);
    } else if (canonicalLink) {
      canonicalLink.remove();
    }

    // Strictly restrict AdSense to verified publisher pages only (never on user note slugs /:slug or /admin)
    window.adsbygoogle = window.adsbygoogle || [];
    if (!isPublicRoute) {
      window.adsbygoogle.pauseAdRequests = 1;
      const existingScript = document.querySelector('script[data-adsense-script="true"]');
      if (existingScript) {
        existingScript.remove();
      }
      return;
    }

    window.adsbygoogle.pauseAdRequests = 0;
    const clientId = normalizeAdSenseClientId(appConfig?.adsense_client_id);
    if (!appConfig?.adsense_enabled || !clientId) return;

    let adsenseMeta = document.querySelector('meta[name="google-adsense-account"]');
    if (!adsenseMeta) {
      adsenseMeta = document.createElement("meta");
      adsenseMeta.setAttribute("name", "google-adsense-account");
      document.head.appendChild(adsenseMeta);
    }
    adsenseMeta.setAttribute("content", clientId);

    const existingScript = document.querySelector('script[data-adsense-script="true"]');
    if (!existingScript) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
      script.crossOrigin = "anonymous";
      script.setAttribute("data-adsense-script", "true");
      document.head.appendChild(script);
    }
  }, [location.pathname, appConfig?.adsense_enabled, appConfig?.adsense_client_id]);

  return null;
}

// Rich Editorial Documentation & Quick Guide rendered below the editor for users and AdSense crawlers
function EditorEditorialGuide() {
  return (
    <section
      aria-label="Guía de uso y documentación de Notepad.do"
      style={{ contentVisibility: "auto", containIntrinsicSize: "480px" }}
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
            to="/guias"
            className="flex-1 sm:flex-none text-center text-xs font-semibold px-3.5 py-2 rounded-lg bg-[#FF9F0A]/15 hover:bg-[#FF9F0A]/25 text-[#FF9F0A] border border-[#FF9F0A]/30 transition-colors"
          >
            Guías paso a paso
          </Link>
          <Link
            to="/info"
            className="flex-1 sm:flex-none text-center text-xs font-semibold px-3.5 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.08] transition-colors"
          >
            Características
          </Link>
          <Link
            to="/faq"
            className="flex-1 sm:flex-none text-center text-xs font-semibold px-3.5 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.08] transition-colors"
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
            Mientras escribes, el sistema sincroniza los cambios en la nube tras una breve pausa de 700 milisegundos y conserva una copia local de respaldo para evitar pérdidas por cortes de conexión.
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
            <span>3. Herramientas Técnicas y Privacidad</span>
          </h2>
          <p className="text-gray-400">
            Incluye transformación instantánea a MAYÚSCULAS, minúsculas, Título y Oración en la barra inferior, limpieza de listas duplicadas, alineación de tablas monoespaciadas, exportación a <code className="text-gray-200 font-mono-code">.txt</code> y bloqueo opcional por contraseña.
          </p>
        </article>
      </div>

      {/* Featured Practical Guides Strip */}
      <div className="py-4 border-b border-white/[0.07]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
            Guías prácticas y casos de uso
          </h3>
          <Link to="/guias" className="text-xs font-bold text-[#FF9F0A] hover:underline">
            Ver las {GUIDES_DATA.length} guías →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {GUIDES_DATA.map((g) => (
            <Link
              key={g.slug}
              to={`/guias/${g.slug}`}
              className="px-3.5 py-2.5 rounded-xl bg-black/25 hover:bg-white/[0.05] border border-white/[0.05] transition-colors flex flex-col gap-1"
            >
              <span className="text-[10px] font-bold text-[#FF9F0A]">{g.category}</span>
              <span className="text-xs font-bold text-gray-200 leading-snug">{g.shortTitle}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Practical Keyboard & Workflow Tips */}
      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-400">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="font-semibold text-gray-300">Consejos rápidos:</span>
          <span>• Usa <strong className="text-gray-200">Compartir</strong> para generar tu código QR.</span>
          <span>• Activa el <strong className="text-gray-200">Candado</strong> si deseas restringir el acceso a tu borrador.</span>
          <span>• Usa los botones <strong className="text-gray-200">↑AA / ↓aa / ↑Aa / •A.</strong> para transformar todo el bloc en 1 toque.</span>
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

// Editor Note Page
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

      {/* RICH EDITORIAL DOCUMENTATION */}
      {!editorStatus?.isLocked && <EditorEditorialGuide />}

      {/* Minimal Compliance Footer */}
      <footer className="w-full max-w-[1300px] mx-auto pt-3 pb-2 text-center text-[11px] text-gray-500 flex flex-col sm:flex-row items-center justify-between px-2 gap-2 border-t border-white/[0.04]">
        <span>© {new Date().getFullYear()} Notepad.do — El bloc de notas rápido en la nube</span>
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 sm:gap-3.5">
          <Link to="/nueva" className="hover:text-gray-300 transition-colors">Nuevo</Link>
          <span>·</span>
          <Link to="/guias" className="hover:text-gray-300 transition-colors">Guías</Link>
          <span>·</span>
          <Link to="/info" className="hover:text-gray-300 transition-colors">Características</Link>
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

export function AppContent() {
  const [appConfig, setAppConfig] = useState({
    adsense_enabled: true,
    adsense_client_id: "ca-pub-9577407700651547",
    adsense_slot_top: "",
    adsense_slot_bottom: "",
    adsense_auto_ads: true,
    unlock_price_usd: "2.00",
    site_announcement: "",
  });

  const [editorStatus, setEditorStatus] = useState({
    loading: false,
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
          setAppConfig((prev) => ({
            ...prev,
            ...res.data,
            adsense_client_id:
              res.data.adsense_client_id || prev.adsense_client_id || "ca-pub-9577407700651547",
          }));
        }
      })
      .catch(() => {
        // Keep safe defaults if backend is unreachable
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <RouteSeoManager appConfig={appConfig} />

      <Routes>
        {/* Root Home: instant notepad + editorial guide; visitors are moved to a fresh /:slug on load, crawlers stay at / */}
        <Route
          path="/"
          element={
            <EditorPage
              appConfig={appConfig}
              editorStatus={editorStatus}
              onEditorStatusChange={setEditorStatus}
            />
          }
        />

        {/* Informative Landing Page at /info */}
        <Route path="/info" element={<Landing />} />

        {/* Editorial Guides & Step-by-Step Tutorials */}
        <Route path="/guias" element={<GuidesIndex />} />
        <Route path="/guias/:guideSlug" element={<GuideArticle />} />

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

        {/* Note Editor View (Direct slug access: /mi-nota, /abc12345 — always noindex & no ads) */}
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
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
