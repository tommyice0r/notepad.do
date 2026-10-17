import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import Editor from "./components/Editor";
import Admin from "./components/Admin";
import CookieConsent from "./components/CookieConsent";

// AdSense Compliance & Landing Pages
import Landing from "./pages/Landing";
import About from "./pages/About";
import Faq from "./pages/Faq";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import Contact from "./pages/Contact";
import Dmca from "./pages/Dmca";

// Generator for short note URLs
function generateRandomSlug(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Redirect helper for creating a new note
function NewNoteRedirect() {
  const slug = generateRandomSlug();
  return <Navigate to={`/${slug}`} replace />;
}

// AdSense Banner Component (Top & Bottom Leaderboard 728x90 / responsive)
export function AdBanner({ position = "top" }) {
  return (
    <div className="w-full flex flex-col items-center justify-center my-1 select-none">
      <div className="w-full max-w-[728px] h-[75px] sm:h-[90px] bg-[#141416]/80 border border-white/[0.08] rounded-xl flex flex-col items-center justify-center text-center px-4 relative overflow-hidden group shadow-sm">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 font-manrope">
          Publicidad · Google AdSense ({position === "top" ? "Superior" : "Inferior"})
        </span>
        <span className="text-xs text-gray-400 mt-0.5 font-manrope">
          Espacio publicitario optimizado (728x90 Leaderboard / Responsive)
        </span>
        <div className="text-[10px] text-gray-600 font-mono-code mt-0.5">
          [ ins.adsbygoogle slot ]
        </div>
      </div>
    </div>
  );
}

// Editor Note Page with Top & Bottom AdSense Banners (notepad.pw style)
function EditorPage() {
  return (
    <div className="min-h-screen bg-[#060607] text-[#EDEDED] font-manrope flex flex-col justify-between p-2 sm:p-4 md:p-6">
      {/* 1. TOP ADSENSE BANNER (NO NAVBAR) */}
      <AdBanner position="top" />

      {/* 2. CENTRAL NOTEPAD CONTAINER */}
      <main className="w-full max-w-[1300px] mx-auto flex-1 flex flex-col my-2">
        <Editor />
      </main>

      {/* 3. BOTTOM ADSENSE BANNER */}
      <AdBanner position="bottom" />

      {/* Minimal Footer */}
      <footer className="w-full max-w-[1300px] mx-auto pt-3 pb-1 text-center text-[11px] text-gray-500 flex flex-wrap items-center justify-between px-2 gap-2 border-t border-white/[0.04]">
        <span>Notepad.do — El bloc de notas rápido en la nube</span>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
          <Link to="/nueva" className="hover:text-gray-300 transition-colors">Nuevo</Link>
          <span>·</span>
          <Link to="/info" className="hover:text-gray-300 transition-colors">Info</Link>
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
          <Link to="/contacto" className="hover:text-gray-300 transition-colors">Contacto</Link>
          <span>·</span>
          <Link to="/admin" className="hover:text-gray-300 transition-colors">Admin</Link>
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
        <Link to="/" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">
          ← Volver a Notepad.do
        </Link>
        <Link to="/nueva" className="pf-btn-primary px-3 py-1 text-xs font-bold">
          Abrir nuevo bloc
        </Link>
      </header>
      <main className="w-full max-w-[1200px] mx-auto flex-1 flex flex-col">
        <Admin />
      </main>
      <footer className="w-full max-w-[1200px] mx-auto pt-6 text-center text-xs text-gray-500">
        © 2026 Notepad.do — Panel de Administración
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
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
        <Route path="/:slug" element={<EditorPage />} />
      </Routes>

      {/* Global AdSense / GDPR Cookie Consent Banner */}
      <CookieConsent />
    </Router>
  );
}
