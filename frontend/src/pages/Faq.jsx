import LegalLayout from "../components/LegalLayout";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

function FaqItem({ question, answer, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-white/[0.08] rounded-xl bg-[#141416] overflow-hidden transition-colors">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-white text-sm sm:text-base hover:text-[#FF9F0A] transition-colors cursor-pointer"
      >
        <h2>{question}</h2>
        {open ? <ChevronUp className="w-4 h-4 text-[#FF9F0A] shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
      </button>
      <div
        className={`px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-white/[0.04] pt-3 ${
          open ? "block" : "hidden"
        }`}
      >
        <p>{answer}</p>
      </div>
    </div>
  );
}

export default function Faq() {
  return (
    <LegalLayout
      title="Preguntas Frecuentes (FAQ)"
      subtitle="Respuestas claras a las dudas más habituales sobre el uso, seguridad y funciones de Notepad.do."
      lastUpdated="14 de octubre de 2026"
    >
      <div className="space-y-3">
        
        <FaqItem
          question="¿Cómo funciona el guardado automático?"
          answer="Cada vez que escribes o modificas texto en el lienzo, nuestro sistema detecta los cambios y los sincroniza de inmediato con nuestros servidores PostgreSQL. El indicador 'Guardado' en la barra inferior confirma que tu texto está respaldado en la nube."
          defaultOpen={true}
        />

        <FaqItem
          question="¿Necesito registrarme o crear una cuenta?"
          answer="No. Notepad.do está diseñado para ser totalmente libre de fricciones. Al ingresar a la página principal, se genera una URL única (ejemplo: notepad.do/x8k2p9) donde puedes comenzar a escribir al instante sin contraseñas obligatorias ni correos."
          defaultOpen={true}
        />

        <FaqItem
          question="¿Cómo comparto una nota con otra persona?"
          answer="Simplemente copia el enlace que aparece en la barra inferior (o en la barra de direcciones de tu navegador) y compártelo por WhatsApp, Telegram, correo o redes sociales. También puedes usar el botón 'Compartir' para obtener un código QR instantáneo que se puede escanear con la cámara del móvil."
        />

        <FaqItem
          question="¿Cómo protejo mi nota con contraseña?"
          answer="Haz clic en el icono del candado en la barra superior del bloc de notas. Introduce la contraseña que desees y confirma. A partir de ese momento, cualquier persona que acceda al enlace deberá introducir esa clave para leer o editar el documento."
        />

        <FaqItem
          question="¿Cómo funcionan las sumas tipo Excel y la calculadora integrada?"
          answer="Si escribes una lista con dos o más importes numéricos o precios (por ejemplo, gastos de un viaje o presupuesto), Notepad.do calcula automáticamente la suma total, el promedio y el rango en la barra inferior. Con el botón 'Insertar Total' puedes añadir el resumen contable al final de tu nota. Además, si escribes una operación como '150 * 4 + 20 =' y pulsas 'Organizar', el editor resuelve la ecuación automáticamente."
        />

        <FaqItem
          question="¿Cómo funciona el auto-formato inteligente de texto, enlaces y JSON?"
          answer="El botón 'Organizar' analiza la estructura de tu borrador: si pegas un bloque JSON válido, lo indenta automáticamente; si pegas direcciones web con parámetros de seguimiento publicitario (como utm_source o fbclid), las limpia para dejar enlaces cortos y legibles."
        />

        <FaqItem
          question="¿Qué ocurre si olvido la contraseña de mi nota?"
          answer="Por motivos de seguridad, las notas bloqueadas requieren la clave configurada para su lectura o edición. Si eres el titular y necesitas recuperar el acceso a un documento bloqueado, puedes utilizar la opción de soporte automatizado en la pantalla de bloqueo o comunicarte a través de nuestra página de Contacto."
        />

        <FaqItem
          question="¿Puedo personalizar el fondo, el tema visual y el tamaño de letra?"
          answer="Sí. Haciendo clic en el icono de la paleta de colores en la barra superior puedes elegir entre fondos minimalistas, fotografías en alta definición, fondos animados, ajustar la transparencia del panel de cristal y cambiar la tipografía del editor. Tus preferencias visuales se guardan localmente en tu navegador."
        />

        <FaqItem
          question="¿Cuánto tiempo se guardan las notas?"
          answer="Las notas se guardan de forma persistente en nuestra base de datos en la nube mientras la plataforma esté activa. Recomendamos también utilizar el botón 'Descargar (.txt)' en la barra superior para conservar copias locales de documentos importantes."
        />

        <FaqItem
          question="¿Por qué hay anuncios en la página?"
          answer="Los espacios publicitarios gestionados por Google AdSense nos permiten financiar los servidores de sincronización en tiempo real, el almacenamiento en la nube y el mantenimiento técnico, manteniendo Notepad.do 100% gratuito y sin registro obligatorio para todos los usuarios."
        />

      </div>
    </LegalLayout>
  );
}
