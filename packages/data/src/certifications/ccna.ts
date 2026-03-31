import type { Certification } from "../types.js";

export const ccna: Certification = {
  id: "ccna",
  slug: "ccna",
  name: "Cisco Certified Network Associate (CCNA)",
  shortName: "CCNA",
  providerId: "cisco",
  description:
    "The CCNA validates foundational networking skills including IP connectivity, network fundamentals, security fundamentals, automation, and programmability. It is the primary entry point into the Cisco certification track.",
  status: "active",
  cost: "$330 USD",
  prerequisites: [],
  tags: ["networking", "intermediate", "cisco", "routing", "switching"],
  links: [
    {
      label: "Official Certification Page",
      url: "https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccna/index.html",
      type: "official",
    },
    {
      label: "CCNA Exam Topics",
      url: "https://learningnetwork.cisco.com/s/ccna-exam-topics",
      type: "source-of-truth",
    },
    {
      label: "r/ccna",
      url: "https://www.reddit.com/r/ccna/",
      type: "community",
    },
  ],
  versions: [
    {
      version: "200-301",
      releaseDate: "2020-02-24",
      notes: "Unified CCNA covering networking fundamentals, IP services, security, and automation.",
    },
  ],
  relatedCertSlugs: ["comptia-a-plus", "comptia-security-plus"],
  lastVerified: "2026-03-01",
  sourceOfTruthUrl: "https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccna/index.html",
};
