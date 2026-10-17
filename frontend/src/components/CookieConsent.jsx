import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, X } from "lucide-react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("notepad_cookie_consent");
      if (!consent) {
        // Small delay so it animates in smoothly
        const timer = setTimeout(() => setShow(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch (e) {}
  }, []);

  const acceptAll = () => {
    try {
      localStorage.setItem("notepad_cookie_consent", "accepted");
    } catch (e) {}
    setShow(false);
  };

  const acceptEssential = () => {
    try {
      localStorage.setItem("notepad_cookie_consent", "essential_only");
    } catch (e) {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <aside
      aria-label="Aviso de cookies"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 pf-panel p-5 shadow-2xl border border-white/[0.1] bg-[#141416]/95 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 flex items-center justify-center text-[#FF9F0A] shrink-0 mt-0.5">
          <Shield className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider font-manrope">
              Aviso de Privacidad y Cookies
            </h2>
            <button
              onClick={acceptEssential}
              className="text-gray-500 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            Utilizamos cookies técnicas necesarias y cookies de proveedores como <strong>Google AdSense</strong> para financiar este servicio gratuito y personalizar anuncios.
          </p>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
            <button
              onClick={acceptAll}
              className="pf-btn-primary px-3.5 py-1.5 text-xs font-bold font-manrope"
            >
              Aceptar todas
            </button>
            <button
              onClick={acceptEssential}
              className="pf-btn-secondary px-3 py-1.5 text-xs font-bold"
            >
              Solo necesarias
            </button>
            <Link
              to="/cookies"
              className="text-[11px] text-gray-400 hover:text-[#FF9F0A] underline ml-auto transition-colors"
            >
              Más info
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
