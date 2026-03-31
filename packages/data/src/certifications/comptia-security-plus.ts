import type { Certification } from "../types.js";

export const comptiaSecurityPlus: Certification = {
  id: "comptia-security-plus",
  slug: "comptia-security-plus",
  name: "CompTIA Security+",
  shortName: "Security+",
  providerId: "comptia",
  description:
    "CompTIA Security+ validates baseline cybersecurity skills including threat assessment, network security, identity management, and cryptography. It meets DoD 8570 compliance requirements.",
  status: "active",
  cost: "$404 USD",
  prerequisites: ["CompTIA A+ recommended but not required", "Two years of IT administration experience recommended"],
  tags: ["cybersecurity", "intermediate", "dod-8570", "network-security"],
  links: [
    {
      label: "Official Certification Page",
      url: "https://www.comptia.org/certifications/security",
      type: "official",
    },
    {
      label: "Exam Objectives",
      url: "https://www.comptia.org/certifications/security#examdetails",
      type: "source-of-truth",
    },
    {
      label: "r/CompTIA",
      url: "https://www.reddit.com/r/CompTIA/",
      type: "community",
    },
  ],
  versions: [
    {
      version: "SY0-701",
      releaseDate: "2023-11-07",
      notes: "Current exam version covering updated threat landscape, zero trust, and cloud security.",
    },
    {
      version: "SY0-601",
      releaseDate: "2020-11-12",
      retireDate: "2024-07-31",
      notes: "Previous version, now retired.",
    },
  ],
  relatedCertSlugs: ["comptia-a-plus", "aws-solutions-architect-associate"],
  lastVerified: "2026-03-01",
  sourceOfTruthUrl: "https://www.comptia.org/certifications/security",
};
