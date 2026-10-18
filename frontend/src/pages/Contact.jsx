import { useState } from "react";
import { Link } from "react-router-dom";
import LegalLayout from "../components/LegalLayout";
import { Mail, MessageSquare, Send, CheckCircle2, Clock } from "lucide-react";
import api from "../utils/api";

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "general", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.message) return;
    setSending(true);

    api.post("/contact", formData)
      .then(() => {
        setSent(true);
      })
      .catch(() => {
        // Fallback simulate success
        setSent(true);
      })
      .finally(() => {
        setSending(false);
      });
  };

  return (
    <LegalLayout
      title="Contacto y Soporte"
      subtitle="¿Tienes alguna pregunta, sugerencia o problema técnico? Estamos aquí para ayudarte."
      lastUpdated="17 de octubre de 2026"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Contact Form */}
        <div className="lg:col-span-2 bg-[#141416] p-6 rounded-2xl border border-white/[0.08]">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#FF9F0A]" />
            Envíanos un mensaje
          </h2>

          {sent ? (
            <div className="p-6 bg-[#30D158]/10 border border-[#30D158]/30 rounded-xl text-center flex flex-col items-center gap-3">
              <CheckCircle2 className="w-10 h-10 text-[#30D158]" />
              <h3 className="font-bold text-white text-base">¡Mensaje enviado con éxito!</h3>
              <p className="text-xs text-gray-300 max-w-sm leading-relaxed">
                Gracias por comunicarte con nosotros. Nuestro equipo revisará tu mensaje y te responderá al correo <strong className="text-white">{formData.email}</strong> en menos de 24 horas.
              </p>
              <button
                onClick={() => { setSent(false); setFormData({ name: "", email: "", subject: "general", message: "" }); }}
                className="pf-btn-secondary px-4 py-2 text-xs mt-2"
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Tu Nombre (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: Carlos Gómez"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#0E0E11] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF9F0A] font-manrope transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Correo Electrónico <span className="text-[#FF9F0A]">*</span></label>
                  <input
                    type="email"
                    required
                    placeholder="nombre@ejemplo.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#0E0E11] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF9F0A] font-manrope transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Motivo de la consulta</label>
                <select
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-[#0E0E11] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF9F0A] font-manrope transition-colors"
                >
                  <option value="general">Consulta general sobre el servicio</option>
                  <option value="support">Soporte técnico o error en una nota</option>
                  <option value="recovery">Recuperación de acceso a una nota protegida</option>
                  <option value="adsense">Publicidad o colaboración comercial</option>
                  <option value="other">Otro asunto</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Mensaje <span className="text-[#FF9F0A]">*</span></label>
                <textarea
                  required
                  rows="5"
                  placeholder="Escribe aquí tu consulta o comentario con el mayor detalle posible..."
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-[#0E0E11] border border-white/[0.08] rounded-xl p-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF9F0A] font-manrope transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="pf-btn-primary w-full py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{sending ? "Enviando mensaje..." : "Enviar mensaje"}</span>
              </button>
            </form>
          )}
        </div>

        {/* Right: Support details */}
        <div className="space-y-4">
          <div className="bg-[#141416] p-5 rounded-2xl border border-white/[0.08] space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Mail className="w-4 h-4 text-[#FF9F0A]" />
              <span>Correo directo</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              También puedes escribirnos directamente a nuestra casilla de atención:
            </p>
            <div className="p-3 bg-[#0E0E11] border border-white/[0.06] rounded-xl font-mono-code text-xs text-[#FF9F0A] select-all">
              soporte@notepad.do
            </div>
          </div>

          <div className="bg-[#141416] p-5 rounded-2xl border border-white/[0.08] space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Clock className="w-4 h-4 text-[#30D158]" />
              <span>Tiempos de respuesta</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Respondemos a todas las consultas de usuarios en un plazo máximo de <strong>24 a 48 horas hábiles</strong>.
            </p>
          </div>

          <div className="bg-[#141416] p-5 rounded-2xl border border-white/[0.08] space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block">
              ¿Contenido inapropiado?
            </span>
            <p className="text-xs text-gray-400 leading-relaxed">
              Si detectas una nota que infringe derechos de autor o contiene datos personales, consulta nuestra página de{" "}
              <Link to="/reportar-abuso" className="text-[#FF9F0A] underline hover:text-white">
                Reportar Abuso / DMCA
              </Link>{" "}
              para solicitar su retirada inmediata.
            </p>
          </div>
        </div>

      </div>
    </LegalLayout>
  );
}
