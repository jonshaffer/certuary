import { describe, it, expect } from "vitest";
import { getCertLevel } from "../experience-levels";
import type { Certification } from "@certuary/data";

function makeCert(tags: string[]): Certification {
  return {
    slug: "test",
    name: "Test",
    providerSlug: "test",
    description: "",
    status: "active",
    prerequisites: [],
    tags,
    links: [],
    versions: [],
    relatedCertSlugs: [],
    domains: [],
    prerequisiteCerts: [],
  };
}

describe("getCertLevel", () => {
  it("maps foundational to entry", () => {
    expect(getCertLevel(makeCert(["foundational"]))).toBe("entry");
  });

  it("maps entry-level to entry", () => {
    expect(getCertLevel(makeCert(["entry-level"]))).toBe("entry");
  });

  it("maps associate to associate", () => {
    expect(getCertLevel(makeCert(["associate"]))).toBe("associate");
  });

  it("maps intermediate to intermediate", () => {
    expect(getCertLevel(makeCert(["intermediate"]))).toBe("intermediate");
  });

  it("maps advanced to advanced", () => {
    expect(getCertLevel(makeCert(["advanced"]))).toBe("advanced");
  });

  it("maps professional to advanced", () => {
    expect(getCertLevel(makeCert(["professional"]))).toBe("advanced");
  });

  it("maps expert to expert", () => {
    expect(getCertLevel(makeCert(["expert"]))).toBe("expert");
  });

  it("falls back to intermediate for unrecognized tags", () => {
    expect(getCertLevel(makeCert(["cybersecurity", "cloud"]))).toBe(
      "intermediate"
    );
  });

  it("falls back to intermediate for empty tags", () => {
    expect(getCertLevel(makeCert([]))).toBe("intermediate");
  });

  it("uses first matching tag when multiple level tags present", () => {
    expect(
      getCertLevel(makeCert(["expert", "advanced", "cybersecurity"]))
    ).toBe("expert");
  });
});
