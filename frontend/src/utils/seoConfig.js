import { GUIDES_DATA } from "../pages/Guides";

export const SITE_ORIGIN = "https://notepad.do";

export const STATIC_SEO_MAP = {
  "/": {
    title: "Notepad.do — Bloc de notas online rápido con guardado automático en la nube",
    description:
      "Bloc de notas online gratuito y ultrarrápido con guardado automático en tiempo real, sumas tipo Excel, formato inteligente de texto, códigos QR y protección con contraseña.",
    canonical: `${SITE_ORIGIN}/`,
    robots: "index, follow",
  },
  "/info": {
    title: "Guía y Características — Notepad.do | Bloc de Notas Online y Calculadora",
    description:
      "Conoce todas las herramientas de Notepad.do: guardado automático en la nube, calculadora reactiva con variables, cifrado opcional y formatos de texto.",
    canonical: `${SITE_ORIGIN}/info`,
    robots: "index, follow",
  },
  "/guias": {
    title: "Guías Prácticas y Tutoriales de Productividad — Notepad.do",
    description:
      "Colección de guías paso a paso para dominar Notepad.do: presupuestos mensuales con variables, limpieza de listas duplicadas, códigos QR, tablas y privacidad.",
    canonical: `${SITE_ORIGIN}/guias`,
    robots: "index, follow",
  },
  "/acerca-de": {
    title: "Acerca de Nosotros — Notepad.do | Productividad y Desarrollo Web",
    description:
      "Conoce la misión, arquitectura técnica y equipo detrás de Notepad.do, el bloc de notas minimalista en la nube con cálculo en tiempo real.",
    canonical: `${SITE_ORIGIN}/acerca-de`,
    robots: "index, follow",
  },
  "/faq": {
    title: "Preguntas Frecuentes (FAQ) — Notepad.do",
    description:
      "Respuestas detalladas sobre cómo funciona Notepad.do, guardado en tiempo real, privacidad con contraseñas, cálculo matemático y límites de uso.",
    canonical: `${SITE_ORIGIN}/faq`,
    robots: "index, follow",
  },
  "/privacidad": {
    title: "Política de Privacidad — Notepad.do",
    description:
      "Política de tratamiento de datos, almacenamiento en la nube, uso de cookies publicitarias de terceros (Google AdSense) y derechos ARCO/RGPD en Notepad.do.",
    canonical: `${SITE_ORIGIN}/privacidad`,
    robots: "index, follow",
  },
  "/terminos": {
    title: "Términos y Condiciones de Uso — Notepad.do",
    description:
      "Condiciones legales de servicio, reglas de uso aceptable, propiedad intelectual y políticas de moderación de Notepad.do.",
    canonical: `${SITE_ORIGIN}/terminos`,
    robots: "index, follow",
  },
  "/cookies": {
    title: "Política de Cookies — Notepad.do",
    description:
      "Información transparente sobre el uso de almacenamiento técnico local y cookies de Google AdSense (Google Consent Mode v2) en Notepad.do.",
    canonical: `${SITE_ORIGIN}/cookies`,
    robots: "index, follow",
  },
  "/contacto": {
    title: "Contacto y Soporte Técnico — Notepad.do",
    description:
      "Ponte en contacto con el equipo de soporte técnico, administración y consultas legales de Notepad.do.",
    canonical: `${SITE_ORIGIN}/contacto`,
    robots: "index, follow",
  },
  "/reportar-abuso": {
    title: "Reportar Abuso o Infracción DMCA — Notepad.do",
    description:
      "Canal oficial para reportar enlaces que vulneren derechos de autor (DMCA) o nuestras políticas de uso aceptable.",
    canonical: `${SITE_ORIGIN}/reportar-abuso`,
    robots: "index, follow",
  },
};

// Register all 6 editorial guide articles into STATIC_SEO_MAP
for (const guide of GUIDES_DATA) {
  const routePath = `/guias/${guide.slug}`;
  STATIC_SEO_MAP[routePath] = {
    title: `${guide.title} — Notepad.do`,
    description: guide.description,
    canonical: `${SITE_ORIGIN}${routePath}`,
    robots: "index, follow",
  };
}

export const PRERENDER_ROUTES = Object.keys(STATIC_SEO_MAP);

/**
 * Returns true ONLY for verified publisher routes (Home + Informational/Guide/Legal pages).
 * User-generated note routes (/:slug) and /admin return false so user notes are never indexed
 * and never serve AdSense ads.
 */
export function isPublicPublisherRoute(pathname) {
  const normalized = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  return Boolean(STATIC_SEO_MAP[normalized]);
}

export function getSeoForPath(pathname) {
  const normalized = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");

  if (STATIC_SEO_MAP[normalized]) {
    return STATIC_SEO_MAP[normalized];
  }

  if (normalized === "/admin") {
    return {
      title: "Administración — Notepad.do",
      description: "Panel administrativo interno de Notepad.do.",
      canonical: `${SITE_ORIGIN}/admin`,
      robots: "noindex, nofollow",
    };
  }

  // Dynamic user note slug (e.g. /equipo-sprint): ALWAYS noindex, nofollow
  return {
    title: "Nota privada en la nube — Notepad.do",
    description:
      "Espacio de trabajo y bloc de notas privado sincronizado en la nube con Notepad.do.",
    canonical: `${SITE_ORIGIN}${normalized}`,
    robots: "noindex, nofollow",
  };
}
