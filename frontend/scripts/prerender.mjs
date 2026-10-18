import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");
const ssrDir = path.resolve(__dirname, "../dist-ssr");

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function injectHeadMeta(html, seo) {
  let out = html;

  out = out.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(seo.title)}</title>`
  );

  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(seo.description)}" />`
  );

  out = out.replace(
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="robots" content="${escapeHtml(seo.robots)}" />`
  );

  out = out.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escapeHtml(seo.canonical)}" />`
  );

  out = out.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${escapeHtml(seo.canonical)}" />`
  );

  out = out.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtml(seo.title)}" />`
  );

  out = out.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${escapeHtml(seo.description)}" />`
  );

  out = out.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`
  );

  out = out.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`
  );

  return out;
}

async function runPrerender() {
  const templatePath = path.join(distDir, "index.html");
  const template = fs.readFileSync(templatePath, "utf-8");

  // 1. Generate dist/note.html as the SPA shell for dynamic user notes (/:slug) with noindex, nofollow
  const noteShellHtml = injectHeadMeta(template, {
    title: "Nota privada en la nube — Notepad.do",
    description:
      "Espacio de trabajo y bloc de notas privado sincronizado en la nube con Notepad.do.",
    canonical: "https://notepad.do/",
    robots: "noindex, nofollow",
  });
  fs.writeFileSync(path.join(distDir, "note.html"), noteShellHtml, "utf-8");

  // 2. Import SSR bundle and prerender all static publisher routes
  const ssrEntryPath = pathToFileURL(path.join(ssrDir, "entry-server.js")).href;
  const { render, PRERENDER_ROUTES, STATIC_SEO_MAP } = await import(ssrEntryPath);

  for (const route of PRERENDER_ROUTES) {
    const seo = STATIC_SEO_MAP[route];
    const appHtml = render(route);

    let routeHtml = injectHeadMeta(template, seo);
    routeHtml = routeHtml.replace(
      /<div id="app"><\/div>/i,
      `<div id="app">${appHtml}</div>`
    );

    if (route === "/") {
      fs.writeFileSync(path.join(distDir, "index.html"), routeHtml, "utf-8");
      console.log(`✓ Prerendered: / -> dist/index.html (${appHtml.length} chars)`);
    } else {
      const cleanRel = route.replace(/^\/+/, "");
      const flatHtmlPath = path.join(distDir, `${cleanRel}.html`);
      const nestedDir = path.join(distDir, cleanRel);
      const nestedIndexPath = path.join(nestedDir, "index.html");

      fs.mkdirSync(path.dirname(flatHtmlPath), { recursive: true });
      fs.writeFileSync(flatHtmlPath, routeHtml, "utf-8");

      fs.mkdirSync(nestedDir, { recursive: true });
      fs.writeFileSync(nestedIndexPath, routeHtml, "utf-8");

      console.log(`✓ Prerendered: ${route} -> dist/${cleanRel}.html & dist/${cleanRel}/index.html (${appHtml.length} chars)`);
    }
  }

  // 3. Clean up temporary dist-ssr build folder
  fs.rmSync(ssrDir, { recursive: true, force: true });
  console.log("✓ Static prerendering complete and dist-ssr cleaned up.");
}

runPrerender().catch((err) => {
  console.error("Prerender failed:", err);
  process.exit(1);
});
