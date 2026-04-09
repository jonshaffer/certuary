import { describe, it, expect } from "vitest";
import { getCertLabel } from "../cert-label";

describe("getCertLabel", () => {
  it("prefers shortName when present", () => {
    expect(
      getCertLabel({ shortName: "SA-A", slug: "aws-solutions-architect-associate" })
    ).toBe("SA-A");
  });

  it("uses 2 segments when last is generic (PRACTITIONER)", () => {
    expect(getCertLabel({ slug: "aws-cloud-practitioner" })).toBe(
      "CLOUD PRACTITIONER"
    );
  });

  it("falls back to last slug segment for non-generic names", () => {
    expect(getCertLabel({ slug: "isc2-cissp" })).toBe("CISSP");
  });

  it("uses last 2 segments for generic level words", () => {
    expect(getCertLabel({ slug: "aws-solutions-architect-associate" })).toBe(
      "ARCHITECT ASSOCIATE"
    );
    expect(getCertLabel({ slug: "azure-administrator-professional" })).toBe(
      "ADMINISTRATOR PROFESSIONAL"
    );
    expect(getCertLabel({ slug: "gcp-engineer-expert" })).toBe(
      "ENGINEER EXPERT"
    );
  });

  it("handles PLUS as a generic level", () => {
    expect(getCertLabel({ slug: "comptia-security-plus" })).toBe(
      "SECURITY PLUS"
    );
  });

  it("handles FOUNDATION as a generic level", () => {
    expect(getCertLabel({ slug: "itil-foundation" })).toBe(
      "ITIL FOUNDATION"
    );
  });

  it("handles single-segment slug", () => {
    expect(getCertLabel({ slug: "cissp" })).toBe("CISSP");
  });

  it("handles slug ending in generic word but only one segment", () => {
    // "associate" alone — can't use 2 segments
    expect(getCertLabel({ slug: "associate" })).toBe("ASSOCIATE");
  });
});
