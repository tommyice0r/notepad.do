import LegalLayout from "../components/LegalLayout";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

function FaqItem({ question, answer, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-white/[0.08] rounded-xl bg-[#141416] overflow-hidden transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-white text-sm sm:text-base hover:text-[#FF9F0A] transition-colors"
      >
        <span>{question}</span>
        {open ? <ChevronUp className="w-4 h-4 text-[#FF9F0A] shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-white/[0.04] pt-3">
          {answer}
        </div>
      )}
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
          question="¿Qué ocurre si olvido la contraseña de mi nota?"
          answer="Si olvidas la contraseña, la plataforma ofrece un mecanismo automatizado de rescate mediante un pago de $500 USD en Bitcoin a través de la pasarela OxaPay. Una vez que la red blockchain y el webhook confirman la transacción, la nota se desbloquea de manera instantánea y permanente."
        />

        <FaqItem
          question="¿Cómo funciona la migración de notas desde notepad.pw?"
          answer="Si accedes a una dirección que existía previamente en notepad.pw (por ejemplo, notepad.do/holdsa29jd12), nuestro scraper en segundo plano consulta el servidor antiguo. Si encuentra contenido, te mostrará un aviso en la parte superior preguntándote si deseas guardarlo en Notepad.do para que no pierdas tus apuntes históricos."
        />

        <FaqItem
          question="¿Qué es la detección de contraseñas y claves?"
          answer="Si escribes palabras como 'password: clave', 'user: admin' o 'api_key: xyz', la plataforma les coloca un distintivo visual suave en pantalla para que las identifiques fácilmente. Sin embargo, al copiar con el botón 'Copiar todo' o seleccionar con el ratón, siempre obtienes el texto plano puro, sin etiquetas HTML."
        />

        <FaqItem
          question="¿Cuánto tiempo se guardan las notas?"
          answer="Las notas se guardan de forma persistente mientras la plataforma esté activa. Recomendamos no obstante mantener una copia de respaldo descargando el archivo (.txt) si se trata de información crítica."
        />

        <FaqItem
          question="¿Por qué hay anuncios en la página?"
          answer="Los anuncios gestionados por Google AdSense ubicados arriba y abajo del bloc de notas nos permiten financiar la infraestructura de servidores de alta velocidad, las copias de seguridad de PostgreSQL y el soporte técnico, manteniendo el servicio 100% gratuito para todos."
        />

      </div>
    </LegalLayout>
  );
}
