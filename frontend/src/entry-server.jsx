import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { AppContent } from "./App";
import { PRERENDER_ROUTES, STATIC_SEO_MAP, SITE_ORIGIN } from "./utils/seoConfig";

export function render(url) {
  return renderToString(
    <StaticRouter location={url}>
      <AppContent />
    </StaticRouter>
  );
}

export { PRERENDER_ROUTES, STATIC_SEO_MAP, SITE_ORIGIN };
