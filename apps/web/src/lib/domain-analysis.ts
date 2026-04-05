import type { Certification, CertStatus, DomainCategory, ExamDomain } from "@certuary/data";
import { getAllCerts } from "@certuary/data";

export interface HeatmapCell {
  certSlug: string;
  categorySlug: string;
  weight: number;
}

export interface SimilarCert {
  cert: Certification;
  score: number;
  sharedDomainNames: string[];
}

/**
 * Collect all domain names (flattened, including subdomains) for a cert.
 */
function flattenDomainNames(domains: ExamDomain[]): string[] {
  const names: string[] = [];
  for (const d of domains) {
    names.push(d.name.toLowerCase());
    if (d.subdomains) {
      names.push(...flattenDomainNames(d.subdomains));
    }
  }
  return names;
}

/**
 * Build a keyword-based similarity score between two certs by comparing
 * domain name tokens. Returns a 0-1 score using Jaccard similarity on
 * word n-grams extracted from domain names.
 */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

function domainTokens(domains: ExamDomain[]): Set<string> {
  const tokens = new Set<string>();
  for (const name of flattenDomainNames(domains)) {
    for (const t of tokenize(name)) {
      tokens.add(t);
    }
  }
  return tokens;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Module-level token cache to avoid recomputation across calls
const tokenCacheMap = new Map<string, Set<string>>();

function getCachedTokens(cert: Certification): Set<string> {
  let cached = tokenCacheMap.get(cert.slug);
  if (!cached) {
    cached = domainTokens(cert.domains);
    tokenCacheMap.set(cert.slug, cached);
  }
  return cached;
}

/**
 * Find certs most similar to a given cert based on domain name overlap.
 */
export function findSimilarCerts(
  cert: Certification,
  limit = 10
): SimilarCert[] {
  const allCerts = getAllCerts();
  const certTokens = getCachedTokens(cert);
  const certDomainNames = flattenDomainNames(cert.domains);

  if (certTokens.size === 0) return [];

  const scored: SimilarCert[] = [];

  for (const other of allCerts) {
    if (other.slug === cert.slug) continue;
    if (other.domains.length === 0) continue;

    const otherTokens = getCachedTokens(other);
    const score = jaccard(certTokens, otherTokens);

    if (score > 0.05) {
      const otherDomainNames = flattenDomainNames(other.domains);
      const shared = certDomainNames.filter((name) => {
        const nameTokens = tokenize(name);
        return otherDomainNames.some((otherName) => {
          const otherNameTokens = tokenize(otherName);
          let matches = 0;
          for (const t of nameTokens) {
            if (otherNameTokens.has(t)) matches++;
          }
          return matches >= Math.min(2, nameTokens.size);
        });
      });

      scored.push({ cert: other, score, sharedDomainNames: shared });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/**
 * Flatten all domains (including subdomains) with their weights.
 */
function flattenDomainsWithWeights(
  domains: ExamDomain[],
  parentWeight?: number
): { name: string; weight: number }[] {
  const result: { name: string; weight: number }[] = [];
  for (const d of domains) {
    const weight = d.weight ?? parentWeight ?? 10;
    result.push({ name: d.name, weight });
    if (d.subdomains) {
      result.push(...flattenDomainsWithWeights(d.subdomains, weight));
    }
  }
  return result;
}

/**
 * Build heatmap data: for each cert × category, compute a relevance score
 * by matching domain name keywords against category labels.
 * Includes subdomains in matching.
 */
export function buildHeatmapData(
  certs: Certification[],
  categories: DomainCategory[]
): HeatmapCell[] {
  const cells: HeatmapCell[] = [];

  const categoryKeywords = new Map<string, Set<string>>();
  for (const cat of categories) {
    categoryKeywords.set(cat.slug, tokenize(cat.label));
  }

  for (const cert of certs) {
    if (cert.domains.length === 0) continue;

    const allDomains = flattenDomainsWithWeights(cert.domains);
    const totalCertWeight = cert.domains.reduce(
      (sum, d) => sum + (d.weight ?? 10),
      0
    );

    for (const cat of categories) {
      const catTokens = categoryKeywords.get(cat.slug)!;
      let matchedWeight = 0;

      for (const domain of allDomains) {
        const dTokens = tokenize(domain.name);
        let matches = 0;
        for (const t of dTokens) {
          if (catTokens.has(t)) matches++;
        }
        if (matches >= Math.min(2, catTokens.size)) {
          matchedWeight += domain.weight;
        }
      }

      if (matchedWeight > 0) {
        // Normalize to 0-100 as percentage of cert's total weight
        const normalized = Math.min(
          100,
          Math.round((matchedWeight / totalCertWeight) * 100)
        );
        cells.push({
          certSlug: cert.slug,
          categorySlug: cat.slug,
          weight: normalized,
        });
      }
    }
  }

  return cells;
}

/**
 * Build network graph edges between certs that share domain overlap.
 */
export interface GraphNode {
  id: string;
  name: string;
  shortName?: string;
  providerSlug: string;
  domainCount: number;
  status: CertStatus;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

export function buildNetworkGraph(
  certs: Certification[],
  minOverlap = 0.15
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const certsWithDomains = certs.filter((c) => c.domains.length > 0);

  const tokenCache = new Map<string, Set<string>>();
  for (const cert of certsWithDomains) {
    tokenCache.set(cert.slug, domainTokens(cert.domains));
  }

  const nodes: GraphNode[] = certsWithDomains.map((c) => ({
    id: c.slug,
    name: c.name,
    shortName: c.shortName,
    providerSlug: c.providerSlug,
    domainCount: c.domains.length,
    status: c.status,
  }));

  const edges: GraphEdge[] = [];

  for (let i = 0; i < certsWithDomains.length; i++) {
    for (let j = i + 1; j < certsWithDomains.length; j++) {
      const a = certsWithDomains[i];
      const b = certsWithDomains[j];
      const score = jaccard(tokenCache.get(a.slug)!, tokenCache.get(b.slug)!);

      if (score >= minOverlap) {
        edges.push({ source: a.slug, target: b.slug, weight: score });
      }
    }
  }

  return { nodes, edges };
}

