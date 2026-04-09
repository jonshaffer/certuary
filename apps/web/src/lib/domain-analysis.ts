import type { Certification, CertStatus, CategoryGroup, DomainCategory, ExamDomain } from "@certuary/data";
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

export function domainTokens(domains: ExamDomain[]): Set<string> {
  const tokens = new Set<string>();
  for (const name of flattenDomainNames(domains)) {
    for (const t of tokenize(name)) {
      tokens.add(t);
    }
  }
  return tokens;
}

export function jaccard(a: Set<string>, b: Set<string>): number {
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

export function getCachedTokens(cert: Certification): Set<string> {
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
 * Recursively collect all category slugs matched by a domain or any of its
 * subdomains. Uses explicit categories when present, falling back to keyword
 * matching. Returns a deduplicated set so each category is counted at most once
 * per top-level domain.
 */
function collectDomainCategories(
  domain: ExamDomain,
  categorySlugs: Set<string>,
  categoryKeywords: Map<string, Set<string>>,
  categories: DomainCategory[],
  parentCategories?: string[]
): Set<string> {
  const matched = new Set<string>();
  const domainCats = domain.categories?.length ? domain.categories : parentCategories;

  if (domainCats?.length) {
    for (const catSlug of domainCats) {
      if (categorySlugs.has(catSlug)) matched.add(catSlug);
    }
  } else {
    // Fall back to keyword matching
    const dTokens = tokenize(domain.name);
    for (const cat of categories) {
      const catTokens = categoryKeywords.get(cat.slug)!;
      let matches = 0;
      for (const t of dTokens) {
        if (catTokens.has(t)) matches++;
      }
      if (matches >= Math.min(2, catTokens.size)) {
        matched.add(cat.slug);
      }
    }
  }

  // Recurse into subdomains
  if (domain.subdomains) {
    for (const sub of domain.subdomains) {
      const subMatched = collectDomainCategories(
        sub, categorySlugs, categoryKeywords, categories, domainCats
      );
      for (const slug of subMatched) matched.add(slug);
    }
  }

  return matched;
}

/**
 * Build heatmap data: for each cert × category, compute a relevance score.
 * Uses explicit ExamDomain.categories when available, falling back to
 * keyword matching against category labels. Includes subdomains.
 */
export function buildHeatmapData(
  certs: Certification[],
  categories: DomainCategory[]
): HeatmapCell[] {
  const cells: HeatmapCell[] = [];

  const categorySlugs = new Set(categories.map((c) => c.slug));
  const categoryKeywords = new Map<string, Set<string>>();
  for (const cat of categories) {
    categoryKeywords.set(cat.slug, tokenize(cat.label));
  }

  for (const cert of certs) {
    if (cert.domains.length === 0) continue;

    const totalCertWeight = cert.domains.reduce(
      (sum, d) => sum + (d.weight ?? 10),
      0
    );

    // Accumulate matched weight per category, counting each top-level
    // domain's weight at most once per category (even if subdomains also match).
    const catWeights = new Map<string, number>();

    for (const domain of cert.domains) {
      const weight = domain.weight ?? 10;
      const matched = collectDomainCategories(
        domain, categorySlugs, categoryKeywords, categories
      );
      for (const catSlug of matched) {
        catWeights.set(catSlug, (catWeights.get(catSlug) ?? 0) + weight);
      }
    }

    if (totalCertWeight <= 0) continue;

    for (const [catSlug, matchedWeight] of catWeights) {
      if (matchedWeight <= 0) continue;
      const normalized = Math.min(
        100,
        Math.round((matchedWeight / totalCertWeight) * 100)
      );
      cells.push({
        certSlug: cert.slug,
        categorySlug: catSlug,
        weight: normalized,
      });
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

export interface ClusterLabel {
  id: number;
  label: string;
  nodeIds: string[];
}

// Generic tokens that don't help identify a cluster topic
const STOP_TOKENS = new Set([
  "and", "the", "for", "with", "management", "fundamentals",
  "concepts", "principles", "practices", "operations", "services",
  "using", "based", "advanced", "introduction",
]);

/**
 * Find connected components in the graph and label each cluster by its
 * most frequent domain tokens (excluding very common stop-words).
 */
export function findClusters(
  nodes: GraphNode[],
  edges: GraphEdge[],
  certs: Certification[]
): ClusterLabel[] {
  // Build adjacency list
  const adj = new Map<string, Set<string>>();
  for (const n of nodes) adj.set(n.id, new Set());
  for (const e of edges) {
    adj.get(e.source)?.add(e.target);
    adj.get(e.target)?.add(e.source);
  }

  // BFS to find connected components
  const visited = new Set<string>();
  const components: string[][] = [];

  for (const n of nodes) {
    if (visited.has(n.id)) continue;
    const queue = [n.id];
    const component: string[] = [];
    visited.add(n.id);
    let head = 0;
    while (head < queue.length) {
      const current = queue[head++]!;
      component.push(current);
      for (const neighbor of adj.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    components.push(component);
  }

  const certMap = new Map(certs.map((c) => [c.slug, c]));

  return components
    .filter((comp) => comp.length >= 2)
    .map((comp, i) => {
      // Count domain tokens across all certs in this cluster
      const tokenCounts = new Map<string, number>();
      for (const slug of comp) {
        const cert = certMap.get(slug);
        if (!cert) continue;
        const tokens = getCachedTokens(cert);
        for (const t of tokens) {
          if (!STOP_TOKENS.has(t)) {
            tokenCounts.set(t, (tokenCounts.get(t) ?? 0) + 1);
          }
        }
      }

      // Pick top tokens that appear in at least 40% of cluster members
      const minCount = Math.max(2, Math.ceil(comp.length * 0.4));
      const topTokens = [...tokenCounts.entries()]
        .filter(([, count]) => count >= minCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([token]) => token);

      const label =
        topTokens.length > 0
          ? topTokens.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")
          : `Cluster ${i + 1}`;

      return { id: i, label, nodeIds: comp };
    });
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

/**
 * Determine which category groups a set of certs map to.
 * Returns a Map from certSlug to an array of group slugs (ordered by weight).
 * Computes all mappings in one pass for efficiency.
 */
export function buildCertCategoryGroupMap(
  certs: Certification[],
  categories: DomainCategory[],
  categoryGroups: CategoryGroup[]
): Map<string, string[]> {
  const cells = buildHeatmapData(certs, categories);

  // Map category slug → group slug
  const catToGroup = new Map<string, string>();
  for (const cat of categories) {
    catToGroup.set(cat.slug, cat.group);
  }

  // Accumulate weight per (certSlug, groupSlug)
  const certGroupWeights = new Map<string, Map<string, number>>();
  for (const cell of cells) {
    const groupSlug = catToGroup.get(cell.categorySlug);
    if (!groupSlug) continue;

    let groupMap = certGroupWeights.get(cell.certSlug);
    if (!groupMap) {
      groupMap = new Map();
      certGroupWeights.set(cell.certSlug, groupMap);
    }
    groupMap.set(groupSlug, (groupMap.get(groupSlug) ?? 0) + cell.weight);
  }

  // Convert to sorted arrays (highest weight first)
  const validGroups = new Set(categoryGroups.map((g) => g.slug));
  const result = new Map<string, string[]>();
  for (const [certSlug, groupMap] of certGroupWeights) {
    const sorted = [...groupMap.entries()]
      .filter(([slug]) => validGroups.has(slug))
      .sort((a, b) => b[1] - a[1])
      .map(([slug]) => slug);
    if (sorted.length > 0) {
      result.set(certSlug, sorted);
    }
  }

  return result;
}

