import LegalLayout from "../components/LegalLayout";
import { openCookiePreferences } from "../components/CookieConsent";
import { Shield } from "lucide-react";

export default function Cookies() {
  return (
    <LegalLayout
      title="Política de Cookies"
      subtitle="Explicación detallada de cómo utilizamos cookies y tecnologías similares para garantizar el funcionamiento del sitio y la visualización de publicidad."
      lastUpdated="17 de octubre de 2026"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">1. ¿Qué son las cookies?</h2>
        <p>
          Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo (ordenador, tableta o teléfono móvil) cuando los visitas. Se utilizan ampliamente para hacer que las páginas funcionen de manera más eficiente, recordar tus preferencias visuales y proporcionar información analítica y publicitaria a los operadores del sitio.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">2. Tipos de Cookies que Utilizamos</h2>
        <div className="grid grid-cols-1 gap-4 mt-2">
          
          <div className="p-4 rounded-xl bg-[#1B1B1E]/60 border border-white/[0.08]">
            <h3 className="font-bold text-white text-sm mb-1">A. Cookies Técnicas y Almacenamiento Local Esencial</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Son indispensables para que puedas navegar por la plataforma y utilizar sus funciones, como recordar tu tema visual, el tamaño de fuente en el bloc de notas o el estado de tu consentimiento de privacidad. Sin ellas, el servicio no puede recordar tus ajustes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#1B1B1E]/60 border border-white/[0.08]">
            <h3 className="font-bold text-[#FF9F0A] text-sm mb-1">B. Cookies Publicitarias de Google AdSense</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Google AdSense utiliza cookies publicitarias para ofrecer anuncios relevantes a los usuarios y limitar el número de veces que se muestra un mismo anuncio. Estas cookies se gestionan respetando tus preferencias mediante Google Consent Mode v2.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#1B1B1E]/60 border border-white/[0.08]">
            <h3 className="font-bold text-white text-sm mb-1">C. Cookies de Rendimiento y Analítica</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Nos permiten medir el rendimiento y la estabilidad de la aplicación de manera agregada y anónima para optimizar la velocidad de sincronización de las notas.
            </p>
          </div>

        </div>
      </section>

      <section className="space-y-3 bg-[#141416] p-5 rounded-xl border border-[#FF9F0A]/30">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#FF9F0A]" />
          <span>3. Gestionar tu Consentimiento en Notepad.do</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-300">
          Puedes modificar o revocar tu consentimiento sobre el uso de cookies publicitarias en Notepad.do en cualquier momento haciendo clic en el siguiente botón:
        </p>
        <div className="pt-1">
          <button
            type="button"
            onClick={openCookiePreferences}
            className="pf-btn-primary px-4 py-2 text-xs font-bold font-manrope"
          >
            Abrir panel de preferencias de cookies
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">4. Cómo Administrar Cookies en tu Navegador</h2>
        <p>
          También puedes configurar tu navegador web para que rechace todas las cookies o bloquee las cookies de terceros:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-300 text-xs sm:text-sm">
          <li><strong>Google Chrome:</strong> Configuración &gt; Privacidad y seguridad &gt; Cookies y otros datos de sitios.</li>
          <li><strong>Mozilla Firefox:</strong> Ajustes &gt; Privacidad y seguridad &gt; Cookies y datos del sitio.</li>
          <li><strong>Apple Safari:</strong> Ajustes &gt; Privacidad &gt; Bloquear todas las cookies.</li>
          <li><strong>Microsoft Edge:</strong> Configuración &gt; Cookies y permisos del sitio.</li>
        </ul>
      </section>

      <section className="space-y-3 bg-[#1B1B1E]/60 p-5 rounded-xl border border-white/[0.08]">
        <h2 className="text-lg font-bold text-[#FF9F0A]">5. Inhabilitación Directa de Anuncios Personalizados</h2>
        <p>
          Para inhabilitar específicamente los anuncios personalizados basados en cookies de Google y otros proveedores adheridos a los estándares internacionales, puedes utilizar los siguientes enlaces oficiales:
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noreferrer"
            className="pf-btn-secondary px-3.5 py-2 text-xs font-bold"
          >
            Google Ads Settings
          </a>
          <a
            href="https://optout.aboutads.info/"
            target="_blank"
            rel="noreferrer"
            className="pf-btn-secondary px-3.5 py-2 text-xs font-bold"
          >
            AboutAds Choices (EE. UU.)
          </a>
          <a
            href="https://www.youronlinechoices.eu/"
            target="_blank"
            rel="noreferrer"
            className="pf-btn-secondary px-3.5 py-2 text-xs font-bold"
          >
            Your Online Choices (Europa)
          </a>
        </div>
      </section>
    </LegalLayout>
  );
}
