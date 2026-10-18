import { Link, useParams } from "react-router-dom";
import { BookOpen, Calculator, Sparkles, QrCode, Lock, Type, Table, ArrowRight, CheckCircle2 } from "lucide-react";
import LegalLayout from "../components/LegalLayout";

export const GUIDES_DATA = [
  {
    slug: "presupuesto-mensual-con-variables",
    title: "Cómo hacer un presupuesto mensual con variables y sumas automáticas",
    shortTitle: "Presupuesto mensual con variables",
    description:
      "Aprende a combinar apuntes de texto con variables matemáticas, porcentajes de impuestos y sumas automáticas estilo hoja de cálculo directamente en Notepad.do.",
    category: "Cálculo y Finanzas",
    readTime: "4 min de lectura",
    updatedAt: "18 de octubre de 2026",
    icon: Calculator,
    summary:
      "Descubre cómo estructurar gastos fijos, ingresos y presupuestos de proyectos declarando variables con nombre y evaluando totales en tiempo real sin necesidad de abrir hojas de cálculo complejas.",
    sections: [
      {
        heading: "1. Por qué llevar presupuestos rápidos en texto plano",
        paragraphs: [
          "Cuando estás planificando un proyecto freelance, organizando los gastos mensuales del hogar o cotizando infraestructura en la nube durante una llamada, abrir una hoja de cálculo tradicional suele interrumpir el flujo de pensamiento. Tienes que definir celdas, dar formato a columnas y escribir fórmulas rígidas como =SUMA(B2:B10).",
          "El motor matemático integrado de Notepad.do resuelve este problema combinando la libertad de un documento de texto con la precisión de una calculadora reactiva. Puedes mezclar títulos, explicaciones y números en cualquier línea, y el sistema detecta automáticamente tanto importes monetarios como asignaciones de variables."
        ]
      },
      {
        heading: "2. Declaración de variables legibles",
        paragraphs: [
          "En lugar de recordar coordenadas de celdas, en Notepad.do puedes asignar nombres descriptivos a cada concepto utilizando el signo igual (=). El motor ignora los símbolos de moneda ($, €, RD$) para que puedas escribir con naturalidad:",
          "Cualquier variable definida en una línea superior queda disponible inmediatamente para ser utilizada en las líneas inferiores del mismo documento."
        ],
        codeExample: `ingresos = 2850
alquiler = 850
electricidad = 95.50
internet = 45
supermercado = 420

gastos_fijos = alquiler + electricidad + internet + supermercado = 1410.5
ahorro_neto = ingresos - gastos_fijos = 1439.5`
      },
      {
        heading: "3. Cálculo de porcentajes, descuentos e impuestos (IVA / ITBIS)",
        paragraphs: [
          "Uno de los casos más frecuentes al elaborar un presupuesto comercial o factura preliminar es aplicar impuestos o descuentos porcentuales. El motor matemático de Notepad.do interpreta expresiones con el símbolo % de forma directa:",
          "Si escribes una expresión terminada en el signo '=' y pulsas el botón 'Organizar' en la barra inferior (o utilizas el inspector de resultados), el resultado exacto se inserta o actualiza al instante."
        ],
        codeExample: `desarrollo_web = 1200
servidor_anual = 180
subtotal = desarrollo_web + servidor_anual = 1380

# Aplicando 18% de impuestos sobre el subtotal:
total_con_impuestos = subtotal + 18% = 1628.4`
      },
      {
        heading: "4. Suma automática tipo Excel en la barra inferior",
        paragraphs: [
          "Incluso si no deseas escribir variables ni signos de igual, Notepad.do analiza las líneas que contienen importes numéricos y muestra en la barra inferior una píldora verde con la sumatoria total (∑) y el número de elementos detectados.",
          "Al hacer clic sobre ese indicador verde, el bloc inserta automáticamente una línea de resumen al final de tu nota con el total formateado con dos decimales. Así puedes enviar el enlace de la cotización a un cliente o compañero de equipo con total claridad."
        ]
      }
    ]
  },
  {
    slug: "limpiar-listas-duplicadas",
    title: "Cómo limpiar listas de texto, ordenar A-Z y eliminar líneas duplicadas",
    shortTitle: "Limpiar listas duplicadas",
    description:
      "Guía práctica para depurar listas de correos, inventarios, registros o palabras clave eliminando duplicados exactos y ordenando alfabéticamente en un clic.",
    category: "Productividad y Datos",
    readTime: "3 min de lectura",
    updatedAt: "18 de octubre de 2026",
    icon: Sparkles,
    summary:
      "Ahorra tiempo al consolidar listados copiados de distintas fuentes: elimina repeticiones, ordena de la A a la Z y numera elementos automáticamente desde el menú de limpieza rápida.",
    sections: [
      {
        heading: "1. El problema de consolidar listas de múltiples fuentes",
        paragraphs: [
          "Trabajar con listas de invitados, catálogos de productos, dominios web, direcciones de correo o registros del sistema suele implicar copiar y pegar bloques de texto desde distintos documentos. El resultado casi siempre contiene líneas repetidas, espacios en blanco innecesarios y un orden caótico.",
          "En lugar de recurrir a scripts externos o fórmulas complejas, Notepad.do incorpora herramientas de limpieza instantánea en la esquina inferior derecha de la barra de herramientas."
        ]
      },
      {
        heading: "2. Detección en tiempo real y eliminación de duplicados",
        paragraphs: [
          "Mientras escribes o pegas una lista en el editor, el detector de patrones identifica cuántas líneas están repetidas sin alterar tu texto automáticamente. Cuando abras el menú de herramientas rápidas (en la esquina inferior derecha), verás un contador ámbar junto al botón 'Sin duplicados'.",
          "Al pulsar 'Sin duplicados', el editor conserva únicamente la primera aparición de cada línea (comparando el texto limpio sin espacios residuales) y elimina todas las copias repetidas en menos de un milisegundo."
        ],
        codeExample: ` Antes de limpiar:
cliente-norte@empresa.com
soporte@empresa.com
cliente-norte@empresa.com
ventas@empresa.com
soporte@empresa.com

 Después de pulsar "Sin duplicados":
cliente-norte@empresa.com
soporte@empresa.com
ventas@empresa.com`
      },
      {
        heading: "3. Orden alfabético A ➔ Z y numeración automática",
        paragraphs: [
          "Una vez depurada la lista, puedes pulsar 'Ordenar A ➔ Z' para organizar todas las líneas alfabéticamente respetando caracteres en español y números (ordenación natural).",
          "Si además necesitas presentar el listado enumerado para un informe o acta de reunión, el botón 'Lista 1. 2. 3.' añade numeración correlativa a cada línea con contenido, o la retira si vuelves a pulsarlo."
        ]
      }
    ]
  },
  {
    slug: "compartir-notas-con-qr",
    title: "Cómo compartir notas, enlaces y código entre móvil y PC con código QR",
    shortTitle: "Compartir notas con QR",
    description:
      "Transfiere texto, enlaces largos o apuntes al instante entre tu ordenador y tu teléfono móvil sin instalar aplicaciones ni iniciar sesión usando URLs cortas y códigos QR.",
    category: "Flujo Multiplataforma",
    readTime: "3 min de lectura",
    updatedAt: "18 de octubre de 2026",
    icon: QrCode,
    summary:
      "Olvídate de enviarte correos a ti mismo para pasar un texto o enlace del ordenador al móvil. Usa enlaces personalizados y códigos QR instantáneos.",
    sections: [
      {
        heading: "1. Pasar texto entre dispositivos sin fricción",
        paragraphs: [
          "Una de las situaciones cotidianas más incómodas ocurre cuando tienes un fragmento de texto, una dirección larga o una lista de tareas en tu ordenador y necesitas llevarla en tu teléfono móvil, o viceversa, en un equipo donde no has iniciado sesión con tus cuentas personales.",
          "En Notepad.do cada nota vive en una URL corta y única (por ejemplo, notepad.do/reunion-jueves). No necesitas registrarte ni instalar ninguna aplicación nativa en iOS o Android."
        ]
      },
      {
        heading: "2. Uso del generador de código QR integrado",
        paragraphs: [
          "En la barra superior del bloc encontrarás el icono de compartir. Al pulsarlo se despliega una ventana con el enlace directo de la nota y un código QR de alto contraste generado específicamente para esa ruta.",
          "Basta con apuntar la cámara de tu teléfono móvil hacia la pantalla del ordenador para abrir exactamente el mismo bloc de notas sincronizado en tiempo real."
        ]
      },
      {
        heading: "3. Buenas prácticas al compartir enlaces de trabajo",
        paragraphs: [
          "Si vas a compartir una nota en un proyector, sala de clases o videollamada, puedes escribir directamente en la barra del navegador una ruta fácil de recordar (como notepad.do/taller-css).",
          "Cuando termines la sesión colaborativa, recuerda que puedes activar el candado de contraseña en la barra superior para que solo las personas autorizadas puedan seguir consultando o editando el documento."
        ]
      }
    ]
  },
  {
    slug: "proteger-notas-con-contrasena",
    title: "Cómo proteger notas privadas con contraseña y modo privacidad visual",
    shortTitle: "Proteger notas con contraseña",
    description:
      "Aprende a bloquear el acceso a tus borradores en Notepad.do mediante contraseña verificada en servidor y a ocultar el contenido en pantalla frente a miradas indiscretas.",
    category: "Seguridad y Privacidad",
    readTime: "4 min de lectura",
    updatedAt: "18 de octubre de 2026",
    icon: Lock,
    summary:
      "Combina el bloqueo por clave criptográfica con el modo de desenfoque visual (Modo Privacidad) y el copiado con censura automática de datos sensibles.",
    sections: [
      {
        heading: "1. Bloqueo de notas mediante contraseña",
        paragraphs: [
          "Por defecto, las notas en Notepad.do son accesibles para cualquier persona que conozca su URL exacta, lo que facilita la colaboración rápida. Sin embargo, cuando trabajas con borradores privados, apuntes personales o listas de configuración, es fundamental restringir el acceso.",
          "Al hacer clic en el botón del candado ('Proteger') en la barra superior, puedes establecer una contraseña para la nota actual. A partir de ese instante, el servidor exige la clave antes de entregar el contenido a cualquier visitante."
        ]
      },
      {
        heading: "2. No indexación automática en buscadores",
        paragraphs: [
          "Además del bloqueo por clave, todas las rutas de notas individuales de usuarios en Notepad.do incluyen directivas técnicas 'noindex, nofollow' para evitar que los motores de búsqueda indexen borradores personales o enlaces compartidos por error."
        ]
      },
      {
        heading: "3. Modo Privacidad en pantalla y Copiado Censurado",
        paragraphs: [
          "Si trabajas en una cafetería, oficina abierta o estás compartiendo pantalla en una videollamada, pulsa el icono del ojo en la barra superior para activar el Modo Privacidad. El contenido del bloc se desenfocará suavemente y solo será legible al pasar el cursor.",
          "Adicionalmente, desde el menú de herramientas rápidas inferior puedes usar la opción 'Copiar nota censurada (***)', que copia todo tu texto al portapapeles reemplazando automáticamente contraseñas o tokens detectados por asteriscos."
        ]
      }
    ]
  },
  {
    slug: "convertir-mayusculas-minusculas",
    title: "Cómo convertir texto a MAYÚSCULAS, minúsculas, Título y Oración al instante",
    shortTitle: "Convertir MAYÚSCULAS y minúsculas",
    description:
      "Domina la barra tipográfica inferior de Notepad.do para transformar todo tu bloc de notas en un toque o activar el modo de escritura continua en mayúsculas o formato título.",
    category: "Edición de Texto",
    readTime: "3 min de lectura",
    updatedAt: "18 de octubre de 2026",
    icon: Type,
    summary:
      "Transforma todo el texto del bloc sin necesidad de seleccionarlo primero y utiliza los modos activos de escritura continua estilo teclado móvil.",
    sections: [
      {
        heading: "1. Transformación en un toque sin seleccionar texto",
        paragraphs: [
          "En la mayoría de los editores tradicionales, corregir un texto escrito accidentalmente con el bloqueo de mayúsculas activado obliga a seleccionar todo el documento, buscar un submenú de formato y aplicar la conversión.",
          "En la barra inferior de Notepad.do dispones de cuatro botones directos con iconografía tipo teclado móvil: ↑AA (MAYÚSCULAS), ↓aa (minúsculas), ↑Aa (Formato Título) y •A. (Formato Oración). Al tocar cualquiera de ellos, todo el contenido del bloc se transforma al instante sin que tengas que seleccionar nada."
        ]
      },
      {
        heading: "2. Cuándo usar cada uno de los 4 modos tipográficos",
        paragraphs: [
          "• ↑AA (MAYÚSCULAS): Ideal para encabezados técnicos, códigos promocionales, siglas o avisos destacados.",
          "• ↓aa (minúsculas): Perfecto para normalizar etiquetas (tags), rutas URL, nombres de archivos o listas de correos electrónicos.",
          "• ↑Aa (Título / Capitalizado): Convierte la primera letra de cada palabra en mayúscula, excelente para títulos de artículos, nombres propios o catálogos.",
          "• •A. (Oración): Respeta la lectura natural convirtiendo en mayúscula únicamente la primera letra de cada párrafo o frase después de un punto."
        ]
      },
      {
        heading: "3. Modo de escritura activa en tiempo real",
        paragraphs: [
          "Cuando pulsas uno de los cuatro botones, este permanece iluminado en color ámbar indicando que el modo de escritura continua está activo. Mientras esté encendido, todo lo que sigas escribiendo en el bloc se formateará automáticamente en ese estilo en tiempo real hasta que vuelvas a tocar el botón para desactivarlo."
        ]
      }
    ]
  },
  {
    slug: "formatear-tablas-y-datos-tecnicos",
    title: "Cómo alinear tablas en texto plano y limpiar registros técnicos con Regex",
    shortTitle: "Alinear tablas y limpiar datos",
    description:
      "Guía avanzada para desarrolladores y analistas: alinea columnas separadas por tuberías (|) o punto y coma (;), limpia espacios y organiza datos estructurados en segundos.",
    category: "Herramientas Técnicas",
    readTime: "4 min de lectura",
    updatedAt: "18 de octubre de 2026",
    icon: Table,
    summary:
      "Convierte datos separados por barras o punto y coma en tablas monoespaciadas perfectamente alineadas y utiliza el botón Organizar para limpiar documentos desordenados.",
    sections: [
      {
        heading: "1. Alineación automática de tablas en texto plano (Tabla | ;)",
        paragraphs: [
          "Cuando pegas resultados de consultas SQL, archivos CSV o tablas Markdown en un bloc de notas, las columnas suelen quedar desalineadas porque cada celda tiene una longitud distinta.",
          "La herramienta 'Tabla | ;' del menú inferior calcula automáticamente el ancho máximo de cada columna y rellena con espacios exactos para formar una tabla monoespaciada limpia y fácil de leer."
        ],
        codeExample: ` Antes de alinear:
Servicio | Región | Latencia | Costo
Base de Datos | us-east-1 | 12ms | $45.00
Cache Redis | eu-west-1 | 8ms | $18.50
Worker API | sa-east-1 | 24ms | $29.00

 Después de pulsar "Tabla | ;":
Servicio      | Región    | Latencia | Costo
Base de Datos | us-east-1 | 12ms     | $45.00
Cache Redis   | eu-west-1 | 8ms      | $18.50
Worker API    | sa-east-1 | 24ms     | $29.00`
      },
      {
        heading: "2. El botón 'Organizar': limpieza integral en un clic",
        paragraphs: [
          "En el lado izquierdo de la barra inferior se encuentra el botón 'Organizar' (con el icono de destello ámbar). Esta función ejecuta una tubería de limpieza no destructiva sobre todo tu documento:",
          "Elimina espacios en blanco sobrantes al final de cada línea, colapsa bloques de más de dos líneas vacías consecutivas, evalúa fórmulas matemáticas pendientes y normaliza el formato general para que tu nota quede lista para compartir o exportar a .txt."
        ]
      },
      {
        heading: "3. Inspector no intrusivo de elementos detectados",
        paragraphs: [
          "Si tu nota contiene enlaces web, marcas de tiempo Unix (timestamps), textos codificados en Base64 o listas de tareas ([ ] / [x]), verás un discreto indicador en la barra superior. Al desplegarlo podrás abrir enlaces, ver la fecha legible de un timestamp o marcar tareas completadas sin ensuciar la vista principal de escritura."
        ]
      }
    ]
  }
];

export function GuidesIndex() {
  return (
    <LegalLayout
      title="Guías Prácticas y Tutoriales de Productividad"
      subtitle="Aprende a sacar el máximo partido a Notepad.do: desde presupuestos reactivos con variables hasta limpieza de listas, tablas en texto plano y seguridad."
      lastUpdated="18 de octubre de 2026"
    >
      <section className="space-y-4">
        <p className="text-gray-300 leading-relaxed">
          Hemos preparado esta colección de guías paso a paso con ejemplos reales para estudiantes, profesionales de oficina, analistas de datos y desarrolladores de software que utilizan <strong>Notepad.do</strong> como su espacio de trabajo diario.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {GUIDES_DATA.map((guide) => {
            const Icon = guide.icon || BookOpen;
            return (
              <Link
                key={guide.slug}
                to={`/guias/${guide.slug}`}
                className="group bg-[#141417] hover:bg-[#19191D] border border-white/[0.08] hover:border-[#FF9F0A]/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#FF9F0A] bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 px-2.5 py-0.5 rounded-full">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{guide.category}</span>
                    </span>
                    <span className="text-[11px] font-mono-code text-gray-500">{guide.readTime}</span>
                  </div>

                  <h2 className="text-base sm:text-lg font-extrabold text-white group-hover:text-[#FF9F0A] transition-colors leading-snug mb-2">
                    {guide.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                    {guide.summary}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-bold text-gray-300 group-hover:text-white">
                  <span>Leer guía paso a paso</span>
                  <ArrowRight className="w-4 h-4 text-[#FF9F0A] group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-8 bg-[#18181C]/70 border border-white/[0.08] rounded-2xl p-5 sm:p-6">
        <h2 className="text-base sm:text-lg font-bold text-white mb-2 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-[#30D158] shrink-0" />
          <span>¿Prefieres probarlo directamente en el editor?</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mb-4">
          Todas las funciones explicadas en estos artículos están disponibles de forma gratuita y sin registro obligatorio directamente en el bloc de notas principal.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/" className="pf-btn-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5">
            <span>Ir al bloc de notas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link to="/faq" className="pf-btn-secondary px-4 py-2 text-xs font-bold">
            Ver Preguntas Frecuentes (FAQ)
          </Link>
        </div>
      </section>
    </LegalLayout>
  );
}

export function GuideArticle() {
  const { guideSlug } = useParams();
  const guide = GUIDES_DATA.find((g) => g.slug === guideSlug);

  if (!guide) {
    return <GuidesIndex />;
  }

  const otherGuides = GUIDES_DATA.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <LegalLayout
      title={guide.title}
      subtitle={guide.description}
      lastUpdated={`${guide.updatedAt} · ${guide.readTime}`}
    >
      <div className="mb-4">
        <Link
          to="/guias"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF9F0A] hover:underline"
        >
          ← Volver al índice de guías y tutoriales
        </Link>
      </div>

      {guide.sections.map((sec, idx) => (
        <section key={idx} className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-white">{sec.heading}</h2>
          {sec.paragraphs.map((p, pIdx) => (
            <p key={pIdx} className="text-gray-300 leading-relaxed">
              {p}
            </p>
          ))}
          {sec.codeExample && (
            <pre className="p-4 rounded-xl bg-[#0A0A0D] border border-white/[0.08] font-mono-code text-xs text-gray-200 overflow-x-auto leading-relaxed">
              <code>{sec.codeExample}</code>
            </pre>
          )}
        </section>
      ))}

      <section className="pt-6 border-t border-white/[0.08] space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400">
          Otras guías recomendadas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {otherGuides.map((item) => (
            <Link
              key={item.slug}
              to={`/guias/${item.slug}`}
              className="p-3.5 rounded-xl bg-[#141417] hover:bg-[#1B1B1F] border border-white/[0.07] transition-colors flex flex-col justify-between gap-2"
            >
              <span className="text-[10px] font-bold text-[#FF9F0A]">{item.category}</span>
              <span className="text-xs font-bold text-white leading-snug">{item.shortTitle}</span>
            </Link>
          ))}
        </div>
      </section>
    </LegalLayout>
  );
}
