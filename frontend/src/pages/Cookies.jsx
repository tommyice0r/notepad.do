import LegalLayout from "../components/LegalLayout";

export default function Cookies() {
  return (
    <LegalLayout
      title="Política de Cookies"
      subtitle="Explicación detallada de cómo utilizamos cookies y tecnologías similares para garantizar el funcionamiento del sitio y la visualización de publicidad."
      lastUpdated="14 de octubre de 2026"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">1. ¿Qué son las cookies?</h2>
        <p>
          Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo (ordenador, tableta o teléfono móvil) cuando los visitas. Se utilizan ampliamente para hacer que las páginas funcionen de manera más eficiente, así como para proporcionar información analítica y publicitaria a los operadores del sitio.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">2. Tipos de Cookies que Utilizamos</h2>
        <div className="grid grid-cols-1 gap-4 mt-2">
          
          <div className="p-4 rounded-xl bg-[#1B1B1E]/60 border border-white/[0.08]">
            <h3 className="font-bold text-white text-sm mb-1">A. Cookies Técnicas y Esenciales</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Son indispensables para que puedas navegar por la plataforma y utilizar sus funciones, como recordar tus preferencias de tamaño de fuente en el bloc de notas o el estado de confirmación de avisos legales. Sin estas cookies, el servicio no puede funcionar correctamente.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#1B1B1E]/60 border border-white/[0.08]">
            <h3 className="font-bold text-[#FF9F0A] text-sm mb-1">B. Cookies Publicitarias de Google AdSense</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Google AdSense utiliza cookies (como la cookie de DoubleClick) para ofrecer anuncios más relevantes a los usuarios y limitar el número de veces que se muestra un mismo anuncio. Estas cookies rastrean patrones de navegación a través de diferentes sitios web para crear perfiles de interés anónimos.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#1B1B1E]/60 border border-white/[0.08]">
            <h3 className="font-bold text-white text-sm mb-1">C. Cookies de Rendimiento y Analítica</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Nos permiten medir el tráfico y la interacción de los usuarios de manera agregada y anónima para optimizar la velocidad de carga de las notas y la arquitectura de nuestros servidores en Go.
            </p>
          </div>

        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">3. Cómo Administrar y Desactivar Cookies</h2>
        <p>
          Puedes configurar tu navegador web para que rechace todas las cookies, bloquee las cookies de terceros o te avise cada vez que se envíe una cookie a tu ordenador:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-300 text-xs sm:text-sm">
          <li><strong>Google Chrome:</strong> Configuración &gt; Privacidad y seguridad &gt; Cookies y otros datos de sitios.</li>
          <li><strong>Mozilla Firefox:</strong> Opciones &gt; Privacidad y seguridad &gt; Cookies y datos del sitio.</li>
          <li><strong>Apple Safari:</strong> Preferencias &gt; Privacidad &gt; Bloquear todas las cookies.</li>
          <li><strong>Microsoft Edge:</strong> Configuración &gt; Permisos del sitio &gt; Cookies y datos almacenados.</li>
        </ul>
      </section>

      <section className="space-y-3 bg-[#1B1B1E]/60 p-5 rounded-xl border border-white/[0.08]">
        <h2 className="text-lg font-bold text-[#FF9F0A]">4. Inhabilitación Directa de Anuncios Personalizados</h2>
        <p>
          Para inhabilitar específicamente los anuncios personalizados basados en cookies de Google y otros proveedores adheridos a los estándares de la industria, puedes utilizar los siguientes enlaces directos:
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
