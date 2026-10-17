import LegalLayout from "../components/LegalLayout";

export default function Terms() {
  return (
    <LegalLayout
      title="Términos del Servicio"
      subtitle="Condiciones generales que regulan el uso de la plataforma Notepad.do y sus servicios asociados."
      lastUpdated="14 de octubre de 2026"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">1. Aceptación de los Términos</h2>
        <p>
          Al acceder o utilizar el sitio web <strong>Notepad.do</strong>, aceptas quedar vinculado por estos Términos del Servicio y por todas las leyes aplicables. Si no estás de acuerdo con alguna parte de estos términos, tienes prohibido el uso o acceso a esta plataforma.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">2. Descripción del Servicio</h2>
        <p>
          Notepad.do es un servicio de utilidad en línea que permite a los usuarios redactar, almacenar temporalmente o de forma persistente notas de texto, compartirlas a través de enlaces cortos y, opcionalmente, protegerlas mediante contraseña o recuperar el acceso mediante pasarelas de pago de terceros.
        </p>
      </section>

      <section className="space-y-3 bg-[#1B1B1E]/60 p-5 rounded-xl border border-white/[0.08]">
        <h2 className="text-lg font-bold text-[#FF9F0A]">3. Política de Uso Aceptable (Contenido Prohibido)</h2>
        <p>
          Para mantener la plataforma segura y en estricto cumplimiento con las normativas internacionales y las políticas de proveedores de publicidad, está estrictamente prohibido utilizar Notepad.do para crear, almacenar o distribuir contenido que:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-300">
          <li>Constituya o facilite actividades ilegales, fraude, estafas o esquemas piramidales.</li>
          <li>Contenga enlaces a programas maliciosos (malware, virus, troyanos o ransomware).</li>
          <li>Contenga información privada no autorizada de terceros (doxxing, números de tarjetas bancarias, documentos de identidad sin consentimiento).</li>
          <li>Promueva el odio, la discriminación, la violencia o la pornografía infantil.</li>
          <li>Infrinja derechos de autor, marcas comerciales o propiedad intelectual de terceros.</li>
        </ul>
        <p className="text-xs text-gray-400 mt-2">
          Nos reservamos el derecho de eliminar de inmediato cualquier nota que viole estas reglas sin previo aviso y sin derecho a reembolso.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">4. Propiedad del Contenido</h2>
        <p>
          Los usuarios retienen todos los derechos de propiedad intelectual sobre el texto que crean o pegan en Notepad.do. Al almacenar una nota pública en nuestro servicio, nos otorgas una licencia limitada y no exclusiva únicamente para alojar, mostrar y transmitir dicho texto a los destinatarios que utilicen el enlace generado.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">5. Pagos de Desbloqueo y Transacciones OxaPay</h2>
        <p>
          La función opcional de recuperación mediante pago de $500 USD en criptomonedas (Bitcoin) es procesada por el proveedor externo <strong>OxaPay</strong>. Al iniciar un pago:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-300">
          <li>Reconoces que las transacciones en la cadena de bloques son irreversibles.</li>
          <li>Una vez confirmado el pago por la red descentralizada y el webhook de OxaPay, la nota se desbloqueará de forma automatizada.</li>
          <li>No se emiten reembolsos por notas desbloqueadas con éxito o por pagos enviados a direcciones incorrectas por error del usuario.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">6. Exclusión de Garantías y Limitación de Responsabilidad</h2>
        <p>
          Notepad.do se proporciona "tal cual" y "según disponibilidad", sin garantías expresas o implícitas de ningún tipo. No garantizamos que el servicio sea ininterrumpido, seguro o libre de errores.
        </p>
        <p>
          En ningún caso Notepad.do ni sus operadores serán responsables por pérdida de datos, lucro cesante o daños indirectos derivados del uso o imposibilidad de uso de la plataforma. Recomendamos mantener siempre copias de respaldo de textos críticos.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">7. Modificaciones a los Términos</h2>
        <p>
          Nos reservamos el derecho de actualizar estos términos en cualquier momento. La fecha de la última revisión se indicará en la parte superior de esta página. El uso continuado de Notepad.do tras cualquier modificación constituirá la aceptación de los nuevos términos.
        </p>
      </section>
    </LegalLayout>
  );
}
