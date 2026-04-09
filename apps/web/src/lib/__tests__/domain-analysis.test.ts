import { describe, it, expect } from "vitest";
import { buildHeatmapData } from "../domain-analysis";
import type { Certification, DomainCategory, ExamDomain } from "@certuary/data";

function makeCert(slug: string, domains: ExamDomain[]): Certification {
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
    domains,
    prerequisiteCerts: [],
  };
}

const categories: DomainCategory[] = [
  { slug: "network-security", label: "Network Security", group: "security" },
  { slug: "cloud-security", label: "Cloud Security", group: "cloud" },
  { slug: "cryptography", label: "Cryptography", group: "security" },
];

describe("buildHeatmapData", () => {
  it("does not double-count when parent and subdomain match the same category", () => {
    const cert = makeCert("cert-a", [
      {
        name: "Network Defense",
        weight: 20,
        categories: ["network-security"],
        subdomains: [
          { name: "Firewall Config", categories: ["network-security"] },
        ],
      },
      {
        name: "Other Domain",
        weight: 20,
      },
    ]);

    const cells = buildHeatmapData([cert], categories);
    const cell = cells.find((c) => c.categorySlug === "network-security");

    // Weight should be 20 (parent only), not 40 (parent + subdomain)
    // Normalized: 20 / 40 * 100 = 50
    expect(cell).toBeDefined();
    expect(cell!.weight).toBe(50);
  });

  it("counts parent weight when only a subdomain matches", () => {
    const cert = makeCert("cert-b", [
      {
        name: "General Domain",
        weight: 30,
        subdomains: [
          { name: "Cloud Sub", categories: ["cloud-security"] },
        ],
      },
      {
        name: "Another Domain",
        weight: 10,
      },
    ]);

    const cells = buildHeatmapData([cert], categories);
    const cell = cells.find((c) => c.categorySlug === "cloud-security");

    // Subdomain matched, so parent's weight (30) is used once
    // Normalized: 30 / 40 * 100 = 75
    expect(cell).toBeDefined();
    expect(cell!.weight).toBe(75);
  });

  it("counts both categories when parent and subdomain match different categories", () => {
    const cert = makeCert("cert-c", [
      {
        name: "Security Domain",
        weight: 20,
        categories: ["network-security"],
        subdomains: [
          { name: "Cloud Sub", categories: ["cloud-security"] },
        ],
      },
    ]);

    const cells = buildHeatmapData([cert], categories);
    const netCell = cells.find((c) => c.categorySlug === "network-security");
    const cloudCell = cells.find((c) => c.categorySlug === "cloud-security");

    // Both categories matched via the same top-level domain (weight 20)
    // Normalized: 20 / 20 * 100 = 100
    expect(netCell).toBeDefined();
    expect(netCell!.weight).toBe(100);
    expect(cloudCell).toBeDefined();
    expect(cloudCell!.weight).toBe(100);
  });

  it("returns no cells when no domains match any category", () => {
    const cert = makeCert("cert-d", [
      { name: "Unrelated Domain", weight: 10 },
    ]);

    const cells = buildHeatmapData([cert], categories);
    expect(cells).toHaveLength(0);
  });

  it("uses keyword matching as fallback when no explicit categories", () => {
    const cert = makeCert("cert-e", [
      { name: "Network Security Fundamentals", weight: 15 },
      { name: "Other Topic", weight: 15 },
    ]);

    const cells = buildHeatmapData([cert], categories);
    const cell = cells.find((c) => c.categorySlug === "network-security");

    // "Network Security Fundamentals" matches "Network Security" via keyword overlap
    // Normalized: 15 / 30 * 100 = 50
    expect(cell).toBeDefined();
    expect(cell!.weight).toBe(50);
  });

  it("does not exceed 100 for a single-domain cert matching its own category", () => {
    const cert = makeCert("cert-f", [
      {
        name: "Network Security",
        weight: 10,
        categories: ["network-security"],
        subdomains: [
          { name: "Sub A", categories: ["network-security"] },
          { name: "Sub B", categories: ["network-security"] },
        ],
      },
    ]);

    const cells = buildHeatmapData([cert], categories);
    const cell = cells.find((c) => c.categorySlug === "network-security");

    // Only the top-level weight (10) should be counted once
    // Normalized: 10 / 10 * 100 = 100 (not 300%)
    expect(cell).toBeDefined();
    expect(cell!.weight).toBe(100);
  });

  it("handles mixed explicit and keyword matching across domains", () => {
    const cert = makeCert("cert-g", [
      {
        name: "Explicit Domain",
        weight: 10,
        categories: ["network-security"],
      },
      {
        name: "Cloud Security Basics",
        weight: 10,
      },
    ]);

    const cells = buildHeatmapData([cert], categories);
    const netCell = cells.find((c) => c.categorySlug === "network-security");
    const cloudCell = cells.find((c) => c.categorySlug === "cloud-security");

    // Both domains match, each contributing weight 10
    // Normalized: 10 / 20 * 100 = 50 each
    expect(netCell).toBeDefined();
    expect(netCell!.weight).toBe(50);
    expect(cloudCell).toBeDefined();
    expect(cloudCell!.weight).toBe(50);
  });
});
