const GENERIC_LEVELS = new Set([
  "ASSOCIATE",
  "PROFESSIONAL",
  "EXPERT",
  "SPECIALTY",
  "FOUNDATIONAL",
  "FOUNDATION",
  "PRACTITIONER",
  "MASTER",
  "ADVANCED",
  "PLUS",
  "ESSENTIALS",
]);

/**
 * Get a readable short label for a certification.
 * Prefers shortName, then falls back to slug segments — using the last two
 * segments when the final one is a generic level word like "ASSOCIATE".
 */
export function getCertLabel(cert: {
  shortName?: string;
  slug: string;
}): string {
  if (cert.shortName) return cert.shortName;

  const parts = cert.slug.split("-");
  const last = parts[parts.length - 1].toUpperCase();

  if (GENERIC_LEVELS.has(last) && parts.length >= 2) {
    return `${parts[parts.length - 2].toUpperCase()} ${last}`;
  }
  return last;
}
