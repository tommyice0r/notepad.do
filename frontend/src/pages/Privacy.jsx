import { Link } from "react-router-dom";
import LegalLayout from "../components/LegalLayout";

export default function Privacy() {
  return (
    <LegalLayout
      title="Política de Privacidad"
      subtitle="Transparencia total sobre cómo recopilamos, protegemos y gestionamos la información de nuestros usuarios."
      lastUpdated="17 de octubre de 2026"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">1. Introducción y Compromiso</h2>
        <p>
          En <strong>Notepad.do</strong> respetamos profundamente tu derecho a la privacidad. Esta Política de Privacidad describe nuestras prácticas respecto a la recopilación, uso y divulgación de información cuando utilizas nuestro servicio de bloc de notas en línea accesible a través de <span className="font-mono-code text-[#FF9F0A]">https://notepad.do</span>.
        </p>
        <p>
          Al utilizar Notepad.do, aceptas las prácticas descritas en este documento. Si no estás de acuerdo con alguna de las cláusulas, te recomendamos discontinuar el uso del servicio.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">2. Información que Recopilamos</h2>
        <p>
          Notepad.do es una herramienta diseñada con el principio de mínima recopilación de datos:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-300">
          <li>
            <strong>Contenido de las notas:</strong> El texto que introduces en el bloc de notas se almacena en nuestros servidores de base de datos para permitirte acceder a él mediante la URL generada.
          </li>
          <li>
            <strong>Protección de notas con clave:</strong> Cuando decides proteger una nota con contraseña, procesamos y almacenamos credenciales de control de acceso y su hash criptográfico para restringir la visualización pública del enlace y permitir tareas de soporte y administración.
          </li>
          <li>
            <strong>Datos de navegación estándar:</strong> Recopilamos automáticamente información técnica estándar, como dirección IP, tipo de navegador, sistema operativo y marcas de tiempo, con propósitos de seguridad, auditoría antifraude y prevención de ataques de denegación de servicio (DDoS).
          </li>
          <li>
            <strong>No requerimos registro personal:</strong> No solicitamos tu nombre, correo electrónico personal ni número de teléfono para utilizar el bloc de notas.
          </li>
        </ul>
      </section>

      <section className="space-y-3 bg-[#1B1B1E]/60 p-5 rounded-xl border border-white/[0.08]">
        <h2 className="text-lg font-bold text-[#FF9F0A]">3. Publicidad y Cookies de Google AdSense (Divulgación Obligatoria)</h2>
        <p>
          Notepad.do utiliza el servicio publicitario <strong>Google AdSense</strong> para financiar la infraestructura gratuita de la plataforma. En cumplimiento estricto con las políticas de Google AdSense y normativas de privacidad vigentes, informamos de manera expresa que:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>
            <strong>Uso de cookies por terceros (incluido Google):</strong> Los proveedores terceros, incluido <strong>Google</strong>, utilizan cookies para mostrar anuncios (incluidos anuncios personalizados y no personalizados) en función de las visitas anteriores de un usuario a este sitio web (<strong>notepad.do</strong>) o a otros sitios web de Internet.
          </li>
          <li>
            <strong>Cookies publicitarias de Google:</strong> El uso de cookies de publicidad permite a Google y a sus socios mostrar anuncios relevantes a los usuarios basándose en sus visitas a nuestros sitios y/o a otros sitios de Internet.
          </li>
          <li>
            <strong>Cómo desactivar los anuncios personalizados:</strong> Los usuarios pueden inhabilitar y desactivar la publicidad personalizada en cualquier momento visitando directamente la página oficial de <strong>Configuración de anuncios de Google</strong> en{" "}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-[#FF9F0A] underline hover:text-white font-mono-code"
            >
              adssettings.google.com
            </a>{" "}
            (o en{" "}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noreferrer"
              className="text-[#FF9F0A] underline hover:text-white"
            >
              www.google.com/settings/ads
            </a>
            ).
          </li>
          <li>
            Alternativamente, puedes desactivar el uso de cookies de proveedores terceros para la publicidad personalizada visitando{" "}
            <a
              href="https://www.aboutads.info/choices/"
              target="_blank"
              rel="noreferrer"
              className="text-[#FF9F0A] underline hover:text-white"
            >
              www.aboutads.info
            </a>{" "}
            o{" "}
            <a
              href="https://www.youronlinechoices.eu/"
              target="_blank"
              rel="noreferrer"
              className="text-[#FF9F0A] underline hover:text-white"
            >
              www.youronlinechoices.eu
            </a>.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">4. Almacenamiento y Seguridad de Datos</h2>
        <p>
          Implementamos protocolos de seguridad estándar de la industria, incluyendo transmisión encriptada mediante protocolo SSL/TLS (HTTPS), limitación de peticiones (rate limiting) y protección por clave opcional en cada nota.
        </p>
        <p>
          Dado que cualquier persona que conozca la URL pública de una nota sin clave puede visualizarla, recomendamos proteger tus notas con contraseña y evitar almacenar información financiera sensible o secretos críticos sin protección adicional.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">5. Derechos del Usuario (RGPD / GDPR y CCPA)</h2>
        <p>
          Conforme a las directivas del Reglamento General de Protección de Datos (RGPD / GDPR) de la Unión Europea y la Ley de Privacidad del Consumidor de California (CCPA):
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-300">
          <li>Tienes derecho a solicitar la eliminación inmediata de cualquier nota que contenga información personal o que infrinja tus derechos.</li>
          <li>Tienes derecho a gestionar o revocar tu consentimiento de cookies publicitarias en cualquier momento desde el enlace "Preferencias de cookies" en el pie de página.</li>
          <li>No vendemos ni alquilamos información personal a terceros bajo ninguna circunstancia.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">6. Contacto sobre Privacidad</h2>
        <p>
          Si tienes preguntas sobre nuestra política de privacidad o deseas solicitar la eliminación de contenido específico, puedes escribirnos mediante nuestro{" "}
          <Link to="/contacto" className="text-[#FF9F0A] underline hover:text-white">
            formulario de contacto y soporte
          </Link>{" "}
          o enviando un correo a <span className="font-mono-code text-white">soporte@notepad.do</span>.
        </p>
      </section>
    </LegalLayout>
  );
}
