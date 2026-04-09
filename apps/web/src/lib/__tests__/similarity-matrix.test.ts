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
      makeCert("a", [{ name: "Security Operations" }]),
      makeCert("b", [{ name: "Cloud Architecture" }]),
    ];
    const { distances } = computeSimilarityMatrix(certs);
    expect(distances[0][0]).toBe(0);
    expect(distances[1][1]).toBe(0);
  });

  it("matrix is symmetric", () => {
    const certs = [
      makeCert("a", [{ name: "Network Security Analysis" }]),
      makeCert("b", [{ name: "Cloud Security Architecture" }]),
      makeCert("c", [{ name: "Security Operations Center" }]),
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
      makeCert("identical-a", [{ name: "Network Security Operations Management" }]),
      makeCert("identical-b", [{ name: "Network Security Operations Management" }]),
    ];
    const { distances } = computeSimilarityMatrix(certs);
    expect(distances[0][1]).toBe(0);
  });

  it("completely disjoint domains produce distance 1", () => {
    const certs = [
      makeCert("a", [{ name: "aaa bbb ccc" }]),
      makeCert("b", [{ name: "xxx yyy zzz" }]),
    ];
    const { distances } = computeSimilarityMatrix(certs);
    expect(distances[0][1]).toBe(1);
  });
});
