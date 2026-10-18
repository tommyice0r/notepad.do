import LegalLayout from "../components/LegalLayout";
import { Zap, ShieldCheck, Database, RefreshCw, Lock, Globe } from "lucide-react";

export default function About() {
  return (
    <LegalLayout
      title="Acerca de Notepad.do"
      subtitle="La historia, misión y tecnología detrás del bloc de notas web más rápido de la red."
      lastUpdated="14 de octubre de 2026"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">1. Nuestra Misión</h2>
        <p>
          En la era de las aplicaciones web pesadas que tardan segundos en cargar y exigen crear una cuenta para escribir un simple apunte, <strong>Notepad.do</strong> nació con un propósito claro: <em>ofrecer una servilleta digital instantánea, ligera y confiable</em>.
        </p>
        <p>
          Creemos que cuando una persona tiene una idea, un fragmento de código, una lista de tareas o un borrador rápido, debe poder abrir una URL y comenzar a escribir en menos de 300 milisegundos, con la total tranquilidad de que su contenido se almacena de forma segura y automática en la nube.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">2. Pilares Fundamentales</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="p-4 rounded-xl bg-[#1B1B1E]/60 border border-white/[0.08]">
            <div className="w-8 h-8 rounded-lg bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 flex items-center justify-center text-[#FF9F0A] mb-3">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">Velocidad Extrema</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Desarrollado con arquitectura compilada de alto rendimiento, capaz de responder y sincronizar el contenido con latencias sub-milisegundo.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#1B1B1E]/60 border border-white/[0.08]">
            <div className="w-8 h-8 rounded-lg bg-[#30D158]/15 border border-[#30D158]/30 flex items-center justify-center text-[#30D158] mb-3">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">Persistencia Confiable</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Infraestructura en la nube con almacenamiento transaccional persistente para garantizar que tus notas nunca se pierdan si se te cierra el navegador.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#1B1B1E]/60 border border-white/[0.08]">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mb-3">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">Protección por Clave</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Protección de documentos mediante algoritmos criptográficos Bcrypt y modo privacidad visual instantáneo para trabajar en entornos compartidos.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#1B1B1E]/60 border border-white/[0.08]">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
              <RefreshCw className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">Productividad Inteligente</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Incluye calculadora en línea, sumas automáticas estilo hoja de cálculo, formateador de JSON, limpieza de enlaces y transferencia móvil por código QR.
            </p>
          </div>

        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">3. Modelo de Sostenibilidad</h2>
        <p>
          Notepad.do es un servicio 100% gratuito para estudiantes, desarrolladores, contadores y profesionales. No exigimos suscripciones ni bloqueamos funciones tras muros de pago.
        </p>
        <p>
          Para financiar la infraestructura de servidores y bases de datos de alta disponibilidad, nos apoyamos en publicidad contextual no intrusiva gestionada por <strong>Google AdSense</strong>, ubicada únicamente en los márgenes exteriores para no interrumpir jamás tu experiencia de lectura y escritura.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">4. ¿Quiénes somos?</h2>
        <p>
          Somos un equipo apasionado por las herramientas minimalistas de productividad, el software de alto rendimiento y el diseño centrado en el usuario. Si tienes sugerencias, comentarios o deseas reportar alguna mejora, te invitamos a comunicarte con nosotros a través de nuestra página de contacto.
        </p>
      </section>
    </LegalLayout>
  );
}
