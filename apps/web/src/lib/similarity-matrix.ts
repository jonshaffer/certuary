import type { Certification } from "@certuary/data";
import { getCachedTokens, jaccard } from "./domain-analysis";

export interface SimilarityResult {
  certs: Certification[];
  distances: number[][];
}

/**
 * Compute the full NxN pairwise distance matrix for a set of certifications.
 * Distance is defined as 1 - Jaccard similarity on domain tokens.
 */
export function computeSimilarityMatrix(
  certs: Certification[]
): SimilarityResult {
  const n = certs.length;
  const distances: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0)
  );

  const tokenSets = certs.map((c) => getCachedTokens(c));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dist = 1 - jaccard(tokenSets[i], tokenSets[j]);
      distances[i][j] = dist;
      distances[j][i] = dist;
    }
  }

  return { certs, distances };
}
