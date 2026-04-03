import { getCertBySlug } from "@certuary/data";
import { parseCost } from "@/lib/costs";

export interface PathEntry {
  slug: string;
  isAutoAdded: boolean;
}

export interface ResolvedPath {
  ordered: PathEntry[];
  totalCost: number;
  cycleDetected: boolean;
}

/**
 * Expands all prerequisite certs via BFS starting from the selected slugs.
 * Returns a map of slug → isAutoAdded (false for user-selected, true for prereqs).
 */
export function expandPrerequisites(
  selectedSlugs: Set<string>,
): Map<string, boolean> {
  const expanded = new Map<string, boolean>();
  const queue: string[] = [];

  for (const slug of selectedSlugs) {
    expanded.set(slug, false);
    queue.push(slug);
  }

  let i = 0;
  while (i < queue.length) {
    const current = queue[i++];
    const cert = getCertBySlug(current);
    if (!cert) continue;

    for (const prereqSlug of cert.prerequisiteCerts) {
      if (!expanded.has(prereqSlug)) {
        expanded.set(prereqSlug, true);
        queue.push(prereqSlug);
      }
    }
  }

  return expanded;
}

/**
 * Topologically sorts the expanded cert set using Kahn's algorithm.
 * Edges go from prerequisite → dependent (prereq must come first).
 */
function topologicalSort(
  expanded: Map<string, boolean>,
  heldSlugs: Set<string>,
): { ordered: PathEntry[]; cycleDetected: boolean } {
  // Filter out held certs
  const activeSlugs = new Set<string>();
  for (const slug of expanded.keys()) {
    if (!heldSlugs.has(slug)) {
      activeSlugs.add(slug);
    }
  }

  // Build adjacency list and in-degree map
  // Edge: prereq → dependent (if prereq is in activeSlugs)
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const slug of activeSlugs) {
    inDegree.set(slug, 0);
    dependents.set(slug, []);
  }

  for (const slug of activeSlugs) {
    const cert = getCertBySlug(slug);
    if (!cert) continue;

    for (const prereqSlug of cert.prerequisiteCerts) {
      // Only count edges within our active set, and skip held certs (already satisfied)
      if (activeSlugs.has(prereqSlug)) {
        inDegree.set(slug, (inDegree.get(slug) ?? 0) + 1);
        dependents.get(prereqSlug)!.push(slug);
      }
    }
  }

  // Kahn's algorithm
  const queue: string[] = [];
  for (const [slug, degree] of inDegree) {
    if (degree === 0) queue.push(slug);
  }

  // Sort the initial queue for deterministic ordering
  queue.sort();

  const ordered: PathEntry[] = [];
  const orderedSet = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    ordered.push({
      slug: current,
      isAutoAdded: expanded.get(current) ?? false,
    });
    orderedSet.add(current);

    for (const dep of dependents.get(current) ?? []) {
      const newDegree = (inDegree.get(dep) ?? 1) - 1;
      inDegree.set(dep, newDegree);
      if (newDegree === 0) {
        // Insert in sorted position for deterministic ordering
        const insertIdx = queue.findIndex((s) => s > dep);
        if (insertIdx === -1) queue.push(dep);
        else queue.splice(insertIdx, 0, dep);
      }
    }
  }

  // Check for cycles — any remaining nodes with in-degree > 0
  const cycleDetected = ordered.length < activeSlugs.size;
  if (cycleDetected) {
    for (const slug of activeSlugs) {
      if (!orderedSet.has(slug)) {
        ordered.push({
          slug,
          isAutoAdded: expanded.get(slug) ?? false,
        });
      }
    }
  }

  return { ordered, cycleDetected };
}

/**
 * Given user-selected cert slugs and already-held cert slugs,
 * resolves prerequisites, topologically sorts, and computes total cost.
 */
export function resolvePath(
  selectedSlugs: Set<string>,
  heldSlugs: Set<string>,
): ResolvedPath {
  if (selectedSlugs.size === 0) {
    return { ordered: [], totalCost: 0, cycleDetected: false };
  }

  const expanded = expandPrerequisites(selectedSlugs);
  const { ordered, cycleDetected } = topologicalSort(expanded, heldSlugs);

  const totalCost = ordered.reduce((sum, entry) => {
    const cert = getCertBySlug(entry.slug);
    return sum + parseCost(cert?.cost);
  }, 0);

  return { ordered, totalCost, cycleDetected };
}

/** Returns all transitive prerequisite cert slugs of a given cert within the path. */
export function getTransitivePrerequisites(
  slug: string,
  pathSlugs: Set<string>,
): Set<string> {
  const result = new Set<string>();
  const queue = [slug];
  let i = 0;
  while (i < queue.length) {
    const current = queue[i++];
    const cert = getCertBySlug(current);
    if (!cert) continue;
    for (const prereq of cert.prerequisiteCerts) {
      if (pathSlugs.has(prereq) && !result.has(prereq)) {
        result.add(prereq);
        queue.push(prereq);
      }
    }
  }
  return result;
}

/** Returns all transitive dependents of a cert within the path. */
export function getTransitiveDependents(
  slug: string,
  pathSlugs: Set<string>,
): Set<string> {
  const result = new Set<string>();
  const queue = [slug];
  let i = 0;
  while (i < queue.length) {
    const current = queue[i++];
    for (const s of pathSlugs) {
      if (result.has(s)) continue;
      const cert = getCertBySlug(s);
      if (cert?.prerequisiteCerts.includes(current)) {
        result.add(s);
        queue.push(s);
      }
    }
  }
  return result;
}
