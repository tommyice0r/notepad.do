import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import { 
  FileEdit, Plus, ArrowRight, Zap, Shield, Database, 
  Lock, RefreshCw, QrCode, CheckCircle2, ChevronRight, 
  Sparkles, KeyRound, Globe, Copy, Check
} from "lucide-react";

function generateRandomSlug(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function Landing() {
  const navigate = useNavigate();
  const [demoText, setDemoText] = useState("Presupuesto del Proyecto Web:\n- Diseño UI/UX: $320.00\n- Servidor Cloud Anual: $140.50\n- Dominio .do: $45.00\nhttps://notepad.do/info");
  const [copiedDemo, setCopiedDemo] = useState(false);

  const handleStartNew = () => {
    const slug = generateRandomSlug();
    navigate(`/${slug}`);
  };

  const handleCopyDemo = () => {
    navigator.clipboard.writeText(demoText);
    setCopiedDemo(true);
    setTimeout(() => setCopiedDemo(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#060607] text-[#EDEDED] font-manrope flex flex-col justify-between">
      
      {/* 1. TOP HEADER */}
      <header className="w-full border-b border-white/[0.08] bg-[#0A0A0C]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-[1300px] mx-auto h-16 px-4 sm:px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <BrandLogo size="md" />
            <span className="font-extrabold text-lg tracking-tight text-white font-manrope">
              Notepad<span className="text-[#FF9F0A]">.do</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-gray-400">
            <a href="#caracteristicas" className="hover:text-white transition-colors">Características</a>
            <Link to="/guias" className="hover:text-white transition-colors">Guías y Tutoriales</Link>
            <Link to="/faq" className="hover:text-white transition-colors">Preguntas</Link>
            <Link to="/acerca-de" className="hover:text-white transition-colors">Acerca de</Link>
            <Link to="/contacto" className="hover:text-white transition-colors">Contacto</Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleStartNew}
              className="pf-btn-primary flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold font-manrope active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Crear nota gratis</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="w-full max-w-[1300px] mx-auto px-4 sm:px-6 pt-12 pb-16 text-center flex flex-col items-center">
        
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1B1B1E] border border-white/[0.08] mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse"></span>
          <span className="text-xs font-bold text-gray-300 font-manrope">Notepad.do 2.0</span>
          <span className="text-gray-500">·</span>
          <span className="text-xs text-[#FF9F0A] font-semibold">Guardado automático en la nube</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight max-w-4xl text-balance leading-[1.1] mb-5 sm:mb-6 font-manrope">
          El bloc de notas más rápido de la web.
        </h1>

        {/* Hero Subtitle */}
        <p className="text-sm sm:text-xl text-gray-400 max-w-2xl text-balance leading-relaxed mb-7 sm:mb-8">
          Escribe apuntes, presupuestos con suma automática o fragmentos de código al instante. Sin registros obligatorios, con guardado en tiempo real y bloqueo por clave.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto mb-10 sm:mb-12">
          <button
            onClick={handleStartNew}
            className="pf-btn-primary px-6 sm:px-8 py-3.5 text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(255,130,0,0.35)] active:scale-95"
          >
            <span>Empezar a escribir ahora</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5] shrink-0" />
          </button>

          <a
            href="#demo"
            className="pf-btn-secondary px-6 py-3.5 text-sm sm:text-base font-bold flex items-center justify-center gap-2"
          >
            Ver demo en vivo
          </a>
        </div>

        {/* 3. INTERACTIVE MINI DEMO PREVIEW (ProxiesFood .pm-box style) */}
        <div id="demo" className="w-full max-w-[960px] pf-panel overflow-hidden shadow-2xl text-left border border-white/[0.1] my-2 sm:my-4">
          
          {/* Card Top Toolbar */}
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-[#141416] border-b border-white/[0.08] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/60 inline-block shrink-0"></span>
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/60 inline-block shrink-0"></span>
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500/60 inline-block shrink-0"></span>
              <span className="ml-1 sm:ml-2 text-[11px] sm:text-xs font-mono-code text-gray-400 truncate">
                notepad.do/ejemplo-demo
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="pf-pill pf-pill-ok text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#30D158]"></span>
                <span className="hidden sm:inline">Guardado</span>
              </span>
              <button
                onClick={handleCopyDemo}
                className="pf-btn-secondary px-2.5 py-1 text-[11px] flex items-center gap-1 font-manrope"
              >
                {copiedDemo ? <Check className="w-3 h-3 text-[#30D158]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedDemo ? "Copiado" : "Copiar"}</span>
              </button>
            </div>
          </div>

          {/* Editor Surface */}
          <div className="p-4 sm:p-6 bg-[#070708] min-h-[160px] font-mono-code text-xs sm:text-sm leading-relaxed">
            <textarea
              value={demoText}
              onChange={e => setDemoText(e.target.value)}
              rows="4"
              className="w-full bg-transparent text-[#EDEDED] text-base sm:text-sm resize-none outline-none font-mono-code leading-relaxed"
              placeholder="Escribe algo aquí para probar..."
            />
            <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-gray-400 font-mono-code">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF9F0A] shrink-0" />
                <span>Cálculo automático de sumas tipo Excel, formato JSON y limpieza de enlaces.</span>
              </span>
              <button onClick={handleStartNew} className="text-[#FF9F0A] hover:underline font-bold font-manrope shrink-0">
                Abrir en pantalla completa →
              </button>
            </div>
          </div>

        </div>

      </section>

      {/* 4. FEATURES BENTO GRID (ProxiesFood style) */}
      <section id="caracteristicas" className="w-full max-w-[1300px] mx-auto px-4 sm:px-6 py-16 border-t border-white/[0.08]">
        
        <div className="text-center mb-12">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#FF9F0A] block mb-2 font-manrope">
            Diseñado para la velocidad
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-manrope">
            Todo lo que necesitas en un bloc de notas moderno
          </h2>
          <p className="text-sm text-gray-400 mt-2 max-w-xl mx-auto">
            Olvídate de interfaces sobrecargadas. Notepad.do reúne la simplicidad de la escritura rápida con la seguridad de la nube.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Feature 1 */}
          <div className="pf-panel p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#30D158]/15 border border-[#30D158]/30 flex items-center justify-center text-[#30D158] mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-manrope">Guardado Automático Instantáneo</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Cada letra que pulsas se almacena en PostgreSQL de inmediato. Si se cierra la pestaña o se apaga tu ordenador, todo tu texto permanece intacto al volver.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] font-mono-code text-[#30D158] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Sin botón de guardar necesario</span>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="pf-panel p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 flex items-center justify-center text-[#FF9F0A] mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-manrope">Protección con Contraseña</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                ¿Apuntes privados o de trabajo? Bloquea cualquier nota con una clave única con un solo clic. Nadie podrá leer ni editar el documento sin autorización.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] font-mono-code text-[#FF9F0A] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Cifrado criptográfico Bcrypt</span>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="pf-panel p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-manrope">Compatibilidad de Enlaces</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                ¿Tenías apuntes en servicios clásicos de bloc de notas? Ingresa con tu identificador habitual y el asistente de migración te permitirá conservar tu texto.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] font-mono-code text-blue-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>100% compatible con enlaces cortos</span>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="pf-panel p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-manrope">Sumas Tipo Excel y Auto-Formato</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Suma automáticamente listas de gastos e importes, resuelve ecuaciones matemáticas en línea, limpia parámetros de seguimiento en URLs y formatea JSON con un clic.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] font-mono-code text-purple-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Cálculos, JSON y enlaces limpios</span>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="pf-panel p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-manrope">Códigos QR y Telegram</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Genera un código QR interactivo para abrir tus apuntes instantáneamente en la cámara de tu teléfono móvil o compártelos por Telegram con un clic.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] font-mono-code text-emerald-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Transferencia móvil sin cables</span>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="pf-panel p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 flex items-center justify-center text-[#FF9F0A] mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-manrope">Cero Cuentas ni Formularios</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Tu tiempo vale oro. Sin contraseñas obligatorias, sin correos de verificación y sin suscripciones ni registros. Abre y escribe.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] font-mono-code text-[#FF9F0A] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Libertad absoluta y privacidad</span>
            </div>
          </div>

        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section id="como-funciona" className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-16 border-t border-white/[0.08]">
        <div className="text-center mb-12">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#FF9F0A] block mb-2 font-manrope">
            Flujo de uso
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-manrope">
            Tan fácil como usar papel y lápiz
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="pf-panel p-6 relative">
            <span className="text-4xl font-extrabold text-[#FF9F0A]/20 absolute top-4 right-4 font-mono-code">01</span>
            <h3 className="font-bold text-white text-base mb-2 font-manrope">1. Abre un enlace</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Haz clic en "Nueva nota" o inventa una dirección propia en la barra de tu navegador (ej: notepad.do/misupernota).
            </p>
          </div>

          <div className="pf-panel p-6 relative">
            <span className="text-4xl font-extrabold text-[#FF9F0A]/20 absolute top-4 right-4 font-mono-code">02</span>
            <h3 className="font-bold text-white text-base mb-2 font-manrope">2. Escribe lo que quieras</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Todo lo que escribas se guardará en PostgreSQL segundo a segundo. Personaliza el tamaño de letra o números de línea si lo deseas.
            </p>
          </div>

          <div className="pf-panel p-6 relative">
            <span className="text-4xl font-extrabold text-[#FF9F0A]/20 absolute top-4 right-4 font-mono-code">03</span>
            <h3 className="font-bold text-white text-base mb-2 font-manrope">3. Comparte o Protege</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Envía el enlace a tus compañeros para que lean o colaboren, o añade una contraseña para que solo tú tengas acceso.
            </p>
          </div>
        </div>
      </section>

      {/* 6. BOTTOM CALL TO ACTION */}
      <section className="w-full max-w-[1300px] mx-auto px-4 sm:px-6 py-16 border-t border-white/[0.08]">
        <div className="pf-panel p-8 sm:p-12 text-center bg-gradient-to-b from-[#141416] to-[#0E0E11] border border-white/[0.1] relative overflow-hidden">
          <div className="max-w-2xl mx-auto relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4 font-manrope">
              Empieza a tomar notas en segundos
            </h2>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              Únete a miles de desarrolladores, estudiantes y escritores que ya utilizan Notepad.do como su bloc de notas predeterminado.
            </p>
            <button
              onClick={handleStartNew}
              className="pf-btn-primary px-8 py-3.5 text-base font-extrabold inline-flex items-center gap-2 active:scale-95 shadow-xl"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Crear mi primera nota ahora</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7. FULL COMPREHENSIVE FOOTER (REQUIRED BY ADSENSE) */}
      <footer className="w-full border-t border-white/[0.08] bg-[#0A0A0C] py-12 px-4 sm:px-6">
        <div className="max-w-[1300px] mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <BrandLogo size="sm" />
              <span className="font-extrabold text-base tracking-tight text-white font-manrope">
                Notepad<span className="text-[#FF9F0A]">.do</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 max-w-sm leading-relaxed mb-4">
              El bloc de notas web más rápido de Internet. Diseñado para ofrecer almacenamiento instantáneo de texto en la nube con máxima privacidad y rendimiento.
            </p>
            <div className="text-[11px] text-gray-500 font-mono-code">
              Go Engine + React + PostgreSQL · Servidores de alta disponibilidad
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3 font-manrope">Herramientas y Guías</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><button onClick={handleStartNew} className="hover:text-white transition-colors">Crear Nueva Nota</button></li>
              <li><Link to="/guias" className="hover:text-white transition-colors">Guías y Tutoriales</Link></li>
              <li><Link to="/guias/presupuesto-mensual-con-variables" className="hover:text-white transition-colors">Presupuesto con Variables</Link></li>
              <li><Link to="/guias/limpiar-listas-duplicadas" className="hover:text-white transition-colors">Limpiar Listas Duplicadas</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3 font-manrope">Compañía</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link to="/acerca-de" className="hover:text-white transition-colors">Acerca de nosotros</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">Preguntas frecuentes</Link></li>
              <li><Link to="/contacto" className="hover:text-white transition-colors">Contacto y soporte</Link></li>
              <li><Link to="/reportar-abuso" className="hover:text-white transition-colors">Reportar abuso / DMCA</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3 font-manrope">Legal</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link to="/privacidad" className="hover:text-white transition-colors">Política de Privacidad</Link></li>
              <li><Link to="/terminos" className="hover:text-white transition-colors">Términos del Servicio</Link></li>
              <li><Link to="/cookies" className="hover:text-white transition-colors">Política de Cookies</Link></li>
              <li><a href="https://adssettings.google.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Configurar Anuncios (Google)</a></li>
            </ul>
          </div>

        </div>

        <div className="max-w-[1300px] mx-auto pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-3">
          <span>© 2026 Notepad.do — Todos los derechos reservados.</span>
          <span className="text-[11px] font-mono-code text-gray-600">
            Sincronización en tiempo real · Cifrado SSL/TLS
          </span>
        </div>
      </footer>

    </div>
  );
}
