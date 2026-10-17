import LegalLayout from "../components/LegalLayout";

export default function Privacy() {
  return (
    <LegalLayout
      title="Política de Privacidad"
      subtitle="Transparencia total sobre cómo recopilamos, protegemos y gestionamos la información de nuestros usuarios."
      lastUpdated="14 de octubre de 2026"
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
            <strong>Contraseñas de notas:</strong> Cuando decides proteger una nota con clave, almacenamos un hash criptográfico de dicha contraseña. Nunca almacenamos contraseñas en texto claro.
          </li>
          <li>
            <strong>Datos de navegación estándar:</strong> Recopilamos automáticamente información técnica no identificable, como dirección IP anonimizada, tipo de navegador, sistema operativo y páginas de referencia, con propósitos de seguridad y prevención de ataques de denegación de servicio (DDoS).
          </li>
          <li>
            <strong>No requerimos registro:</strong> No solicitamos tu nombre, correo electrónico personal ni número de teléfono para utilizar el bloc de notas básico.
          </li>
        </ul>
      </section>

      <section className="space-y-3 bg-[#1B1B1E]/60 p-5 rounded-xl border border-white/[0.08]">
        <h2 className="text-lg font-bold text-[#FF9F0A]">3. Publicidad y Cookies de Google AdSense (Divulgación Obligatoria)</h2>
        <p>
          Notepad.do se financia mediante la visualización de publicidad en línea a través del programa <strong>Google AdSense</strong>. En cumplimiento estricto con las políticas de Google:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>
            <strong>Proveedores externos:</strong> Google y otros proveedores publicitarios externos utilizan cookies para publicar anuncios basados en las visitas previas de un usuario a este u otros sitios web de Internet.
          </li>
          <li>
            <strong>Cookie de DoubleClick / Cookies publicitarias:</strong> El uso de cookies publicitarias permite a Google y a sus socios mostrar anuncios a los usuarios en función de sus visitas a Notepad.do y a otros sitios de la red.
          </li>
          <li>
            <strong>Inhabilitación de publicidad personalizada:</strong> Los usuarios pueden optar por no recibir publicidad personalizada visitando la página de configuración de anuncios de Google en{" "}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noreferrer"
              className="text-[#FF9F0A] underline hover:text-white"
            >
              Configuración de Anuncios de Google
            </a>.
          </li>
          <li>
            Alternativamente, puedes inhabilitar el uso de cookies para publicidad personalizada de proveedores externos visitando el portal independiente{" "}
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
              Your Online Choices (Europa)
            </a>.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">4. Almacenamiento y Seguridad de Datos</h2>
        <p>
          Implementamos protocolos de seguridad estándar de la industria, incluyendo transmisión encriptada mediante protocolo SSL/TLS (HTTPS). Las notas protegidas cuentan con restricciones de acceso por contraseña o mediante el protocolo de rescate automatizado con OxaPay.
        </p>
        <p>
          A pesar de nuestros esfuerzos, ninguna transmisión por Internet es 100% segura. Recomendamos a los usuarios no almacenar información sensible como números de tarjetas de crédito o credenciales críticas sin cifrar.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">5. Derechos del Usuario (GDPR y CCPA)</h2>
        <p>
          Conforme a las directivas del Reglamento General de Protección de Datos (RGPD / GDPR) de la Unión Europea y la Ley de Privacidad del Consumidor de California (CCPA):
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-300">
          <li>Tienes derecho a solicitar la eliminación inmediata de cualquier nota que contenga información personal o que infrinja tus derechos.</li>
          <li>Tienes derecho a oponerte al procesamiento de datos publicitarios mediante la inhabilitación de cookies descrita en la Sección 3.</li>
          <li>No vendemos ni alquilamos ninguna información personal a terceros bajo ninguna circunstancia.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">6. Contacto sobre Privacidad</h2>
        <p>
          Si tienes preguntas sobre nuestra política de privacidad o deseas solicitar la eliminación de contenido específico, puedes escribirnos mediante nuestro{" "}
          <a href="/contacto" className="text-[#FF9F0A] underline hover:text-white">
            formulario de contacto y soporte
          </a>{" "}
          o enviando un correo a <span className="font-mono-code text-white">soporte@notepad.do</span>.
        </p>
      </section>
    </LegalLayout>
  );
}
