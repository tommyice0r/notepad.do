import { Link, useLocation } from "react-router-dom";
import { Plus, ArrowLeft, Shield, FileText, HelpCircle, Mail, AlertTriangle, BookOpen } from "lucide-react";
import { openCookiePreferences } from "./CookieConsent";
import BrandLogo from "./BrandLogo";

export default function LegalLayout({ title, subtitle, lastUpdated, children }) {
  const location = useLocation();

  const links = [
    { to: "/guias", label: "Guías y tutoriales", icon: BookOpen },
    { to: "/acerca-de", label: "Acerca de nosotros", icon: BookOpen },
    { to: "/faq", label: "Preguntas frecuentes", icon: HelpCircle },
    { to: "/privacidad", label: "Política de privacidad", icon: Shield },
    { to: "/terminos", label: "Términos del servicio", icon: FileText },
    { to: "/cookies", label: "Política de cookies", icon: Shield },
    { to: "/contacto", label: "Contacto y soporte", icon: Mail },
    { to: "/reportar-abuso", label: "Reportar abuso / DMCA", icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-[#060607] text-[#EDEDED] font-manrope flex flex-col justify-between p-3 sm:p-5 md:p-8">
      
      {/* Top Header */}
      <header className="w-full max-w-[1200px] mx-auto flex items-center justify-between py-4 border-b border-white/[0.08] mb-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <BrandLogo size="md" />
          <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-[#FF9F0A] transition-colors">
            Notepad<span className="text-[#FF9F0A]">.do</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/info"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white bg-[#141416] hover:bg-[#1B1B1E] border border-white/[0.08] transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inicio e información</span>
          </Link>

          <Link
            to="/nueva"
            className="pf-btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Abrir bloc</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-[1200px] mx-auto flex-1 flex flex-col md:flex-row gap-4 md:gap-6 mb-8">
        
        {/* Left Sidebar Navigation (Horizontal pill strip on mobile, sticky vertical sidebar on desktop) */}
        <aside className="w-full md:w-[260px] shrink-0">
          <div className="pf-panel p-2.5 md:p-3 md:sticky md:top-6">
            <span className="hidden md:block px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
              Documentación y Legal
            </span>
            <nav className="flex md:flex-col gap-1.5 md:gap-1 overflow-x-auto no-scrollbar md:mt-1">
              {links.map((item) => {
                const Icon = item.icon;
                const active =
                  location.pathname === item.to ||
                  (item.to === "/guias" && location.pathname.startsWith("/guias/"));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                      active
                        ? "bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/30 shadow-sm"
                        : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right Article Container */}
        <article className="flex-1 pf-panel p-4 sm:p-6 md:p-10 text-sm leading-relaxed text-gray-300">
          <header className="border-b border-white/[0.08] pb-4 sm:pb-6 mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight font-manrope">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                {subtitle}
              </p>
            )}
            {lastUpdated && (
              <span className="inline-block mt-3 text-[11px] font-mono-code text-gray-500">
                Última actualización: {lastUpdated}
              </span>
            )}
          </header>

          <div className="space-y-6 prose-invert">
            {children}
          </div>
        </article>

      </main>

      {/* Footer */}
      <footer className="w-full max-w-[1200px] mx-auto pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-3">
        <span>© 2026 Notepad.do — Todos los derechos reservados.</span>
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/privacidad" className="hover:text-gray-300 transition-colors">Privacidad</Link>
          <Link to="/terminos" className="hover:text-gray-300 transition-colors">Términos</Link>
          <Link to="/cookies" className="hover:text-gray-300 transition-colors">Cookies</Link>
          <button
            type="button"
            onClick={openCookiePreferences}
            className="hover:text-[#FF9F0A] transition-colors cursor-pointer"
          >
            Preferencias de cookies
          </button>
          <Link to="/reportar-abuso" className="hover:text-gray-300 transition-colors">Reportar abuso</Link>
          <Link to="/contacto" className="hover:text-gray-300 transition-colors">Contacto</Link>
        </div>
      </footer>

    </div>
  );
}
