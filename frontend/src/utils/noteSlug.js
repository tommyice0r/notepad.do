// Generator for short note URLs
export function generateRandomSlug(length = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Slugs created in this tab for brand-new notes. The editor skips the GET for them
// (nothing to load, and it avoids the slow notepad.pw scraper fallback + loading spinner).
const freshSlugs = new Set();

export function createFreshSlug() {
  const slug = generateRandomSlug();
  freshSlugs.add(slug);
  return slug;
}

// Returns true only the first time a fresh slug is opened, so going back to it later reloads it from the server
export function consumeFreshSlug(slug) {
  return freshSlugs.delete(slug);
}

// Crawlers keep "/" as the indexable home page instead of being sent to a noindex note URL
export function isCrawler() {
  return (
    typeof navigator !== "undefined" &&
    /bot|crawl|spider|slurp|mediapartners|lighthouse|headless|facebookexternalhit/i.test(navigator.userAgent)
  );
}
