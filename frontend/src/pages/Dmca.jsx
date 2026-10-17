import { useState } from "react";
import LegalLayout from "../components/LegalLayout";
import { AlertTriangle, ShieldAlert, Send, CheckCircle2, FileText } from "lucide-react";
import api from "../utils/api";

export default function Dmca() {
  const [formData, setFormData] = useState({
    noteUrl: "",
    abuseType: "copyright",
    name: "",
    email: "",
    details: ""
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.noteUrl || !formData.email) return;
    setSending(true);

    api.post("/contact", {
      name: formData.name || "Reporte de Abuso",
      email: formData.email,
      subject: `[ABUSO/DMCA] ${formData.abuseType} - ${formData.noteUrl}`,
      message: `URL Reportada: ${formData.noteUrl}\nTipo: ${formData.abuseType}\nDetalles:\n${formData.details}`
    })
    .finally(() => {
      setSent(true);
      setSending(false);
    });
  };

  return (
    <LegalLayout
      title="Política de Contenido, DMCA y Reporte de Abuso"
      subtitle="Procedimiento oficial para solicitar la eliminación de notas que infrinjan derechos de autor, privacidad o las normas de la comunidad."
      lastUpdated="14 de octubre de 2026"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">1. Política sobre Contenido Generado por Usuarios</h2>
        <p>
          Notepad.do es un proveedor de servicios de almacenamiento de texto neutral. No supervisamos de forma activa ni editamos previamente el texto redactado por los usuarios. Sin embargo, aplicamos una política de tolerancia cero frente al contenido abusivo, ilegal o infractor.
        </p>
        <p>
          Nos acogemos al marco de puerto seguro de la <strong>Digital Millennium Copyright Act (DMCA)</strong> y las directivas de comercio electrónico aplicables para tramitar solicitudes de retirada de forma ágil.
        </p>
      </section>

      <section className="space-y-4 bg-[#141416] p-6 rounded-2xl border border-white/[0.08] my-6">
        <div className="flex items-center gap-2.5 text-[#FF9F0A]">
          <ShieldAlert className="w-5 h-5 text-[#FF9F0A]" />
          <h2 className="text-base font-bold text-white">Formulario Oficial de Solicitud de Retirada</h2>
        </div>

        {sent ? (
          <div className="p-6 bg-[#30D158]/10 border border-[#30D158]/30 rounded-xl text-center flex flex-col items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-[#30D158]" />
            <h3 className="font-bold text-white text-base">Reporte de Abuso Recibido</h3>
            <p className="text-xs text-gray-300 max-w-sm leading-relaxed">
              Hemos registrado tu solicitud para la URL indicada. Nuestro equipo de moderación revisará la nota y procederá a su inhabilitación o eliminación en menos de 12 horas hábiles.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                URL o enlace exacto de la nota infractora <span className="text-[#FF9F0A]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="https://notepad.do/ejemplo123"
                value={formData.noteUrl}
                onChange={e => setFormData({ ...formData, noteUrl: e.target.value })}
                className="w-full bg-[#0E0E11] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF9F0A] font-mono-code transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                  Motivo de la denuncia <span className="text-[#FF9F0A]">*</span>
                </label>
                <select
                  value={formData.abuseType}
                  onChange={e => setFormData({ ...formData, abuseType: e.target.value })}
                  className="w-full bg-[#0E0E11] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF9F0A] font-manrope transition-colors"
                >
                  <option value="copyright">Infracción de derechos de autor (DMCA)</option>
                  <option value="privacy">Datos personales expuestos sin permiso (Doxxing)</option>
                  <option value="phishing">Enlaces a estafas o phishing</option>
                  <option value="malware">Distribución de software malicioso</option>
                  <option value="other">Otro tipo de abuso</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                  Tu correo de contacto o titular del derecho <span className="text-[#FF9F0A]">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="titular@empresa.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#0E0E11] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF9F0A] font-manrope transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Explicación detallada o pruebas de titularidad <span className="text-[#FF9F0A]">*</span>
              </label>
              <textarea
                required
                rows="4"
                placeholder="Describe por qué este contenido debe ser retirado e incluye cualquier información que respalde tu solicitud..."
                value={formData.details}
                onChange={e => setFormData({ ...formData, details: e.target.value })}
                className="w-full bg-[#0E0E11] border border-white/[0.08] rounded-xl p-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF9F0A] font-manrope transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{sending ? "Procesando solicitud..." : "Enviar Solicitud de Retirada"}</span>
            </button>
          </form>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">2. Proceso de Resolución</h2>
        <p>
          Una vez recibida la notificación válida, nuestro equipo de soporte:
        </p>
        <ol className="list-decimal pl-5 space-y-1.5 text-gray-300">
          <li>Verificará la existencia del contenido en el enlace proporcionado.</li>
          <li>Procederá a deshabilitar de forma inmediata el acceso a la nota reportada.</li>
          <li>Enviará un correo de confirmación al remitente notificando la resolución del caso.</li>
        </ol>
      </section>
    </LegalLayout>
  );
}
