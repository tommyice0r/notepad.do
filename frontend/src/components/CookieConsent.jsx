import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, X } from "lucide-react";

export function openCookiePreferences() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("notepad:open-cookie-consent"));
  }
}

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleOpen = () => setShow(true);
    window.addEventListener("notepad:open-cookie-consent", handleOpen);

    let timer = null;
    try {
      const consent = localStorage.getItem("notepad_cookie_consent");
      if (!consent) {
        timer = setTimeout(() => setShow(true), 1000);
      }
    } catch (e) {}

    return () => {
      window.removeEventListener("notepad:open-cookie-consent", handleOpen);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const applyGoogleConsent = (granted) => {
    try {
      if (typeof window !== "undefined") {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.requestNonPersonalizedAds = granted ? 0 : 1;
        if (typeof window.gtag === "function") {
          window.gtag("consent", "update", {
            ad_storage: granted ? "granted" : "denied",
            ad_user_data: granted ? "granted" : "denied",
            ad_personalization: granted ? "granted" : "denied",
            analytics_storage: granted ? "granted" : "denied",
          });
        }
      }
    } catch (e) {}
  };

  const acceptAll = () => {
    try {
      localStorage.setItem("notepad_cookie_consent", "accepted");
    } catch (e) {}
    applyGoogleConsent(true);
    setShow(false);
  };

  const acceptEssential = () => {
    try {
      localStorage.setItem("notepad_cookie_consent", "essential_only");
    } catch (e) {}
    applyGoogleConsent(false);
    setShow(false);
  };

  if (!show) return null;

  return (
    <aside
      aria-label="Aviso de privacidad y cookies"
      className="fixed bottom-2.5 sm:bottom-4 left-2.5 right-2.5 sm:left-auto sm:right-6 sm:max-w-md z-50 pf-panel p-3.5 sm:p-5 shadow-2xl border border-white/[0.1] bg-[#141416]/95 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start gap-2.5 sm:gap-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 flex items-center justify-center text-[#FF9F0A] shrink-0 mt-0.5">
          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h2 className="text-[11px] sm:text-xs font-bold text-white uppercase tracking-wider font-manrope truncate">
              Privacidad y Cookies
            </h2>
            <button
              onClick={acceptEssential}
              title="Rechazar opcionales y cerrar"
              className="text-gray-500 hover:text-white p-0.5 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] sm:text-xs text-gray-300 leading-relaxed">
            Utilizamos almacenamiento local esencial y cookies publicitarias de proveedores como <strong>Google AdSense</strong> para financiar este servicio gratuito conforme al RGPD y CCPA.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-white/[0.06]">
            <button
              onClick={acceptAll}
              className="flex-1 sm:flex-none pf-btn-primary px-3 py-1.5 text-xs font-bold font-manrope text-center"
            >
              Aceptar todas
            </button>
            <button
              onClick={acceptEssential}
              className="flex-1 sm:flex-none pf-btn-secondary px-3 py-1.5 text-xs font-bold text-center"
            >
              Solo esenciales
            </button>
            <Link
              to="/cookies"
              onClick={() => setShow(false)}
              className="w-full sm:w-auto text-center text-[11px] text-gray-400 hover:text-[#FF9F0A] underline sm:ml-auto transition-colors pt-0.5 sm:pt-0"
            >
              Política de cookies
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
