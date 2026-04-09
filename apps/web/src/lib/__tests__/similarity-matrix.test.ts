import { describe, it, expect } from "vitest";
import { computeSimilarityMatrix } from "../similarity-matrix";
import type { Certification } from "@certuary/data";

function makeCert(
  slug: string,
  domains: { name: string; weight?: number }[]
): Certification {
  return {
    slug,
    name: slug,
    providerSlug: "test",
    description: "",
    status: "active",
    prerequisites: [],
    tags: [],
    links: [],
    versions: [],
    relatedCertSlugs: [],
    domains: domains.map((d) => ({ name: d.name, weight: d.weight })),
    prerequisiteCerts: [],
  };
}

describe("computeSimilarityMatrix", () => {
  it("returns empty matrix for empty input", () => {
    const result = computeSimilarityMatrix([]);
    expect(result.distances).toEqual([]);
    expect(result.certs).toEqual([]);
  });

  it("diagonal is always 0", () => {
    const certs = [
      makeCert("diag-cert-alpha", [{ name: "Security Operations" }]),
      makeCert("diag-cert-beta", [{ name: "Cloud Architecture" }]),
    ];
    const { distances } = computeSimilarityMatrix(certs);
    expect(distances[0][0]).toBe(0);
    expect(distances[1][1]).toBe(0);
  });

  it("matrix is symmetric", () => {
    const certs = [
      makeCert("sym-cert-one", [{ name: "Network Security Analysis" }]),
      makeCert("sym-cert-two", [{ name: "Cloud Security Architecture" }]),
      makeCert("sym-cert-three", [{ name: "Security Operations Center" }]),
    ];
    const { distances } = computeSimilarityMatrix(certs);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(distances[i][j]).toBe(distances[j][i]);
      }
    }
  });

  it("identical domains produce distance 0", () => {
    const certs = [
      makeCert("identical-alpha", [{ name: "Network Security Operations Management" }]),
      makeCert("identical-beta", [{ name: "Network Security Operations Management" }]),
    ];
    const { distances } = computeSimilarityMatrix(certs);
    expect(distances[0][1]).toBe(0);
  });

  it("completely disjoint domains produce distance 1", () => {
    const certs = [
      makeCert("disjoint-alpha", [{ name: "aaa bbb ccc" }]),
      makeCert("disjoint-beta", [{ name: "xxx yyy zzz" }]),
    ];
    const { distances } = computeSimilarityMatrix(certs);
    expect(distances[0][1]).toBe(1);
  });
});
