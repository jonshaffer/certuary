import type { Certification } from "../types.js";

export const comptiaAPlus: Certification = {
  id: "comptia-a-plus",
  slug: "comptia-a-plus",
  name: "CompTIA A+",
  shortName: "A+",
  providerId: "comptia",
  description:
    "CompTIA A+ certifies foundational IT skills across hardware, networking, mobile devices, operating systems, troubleshooting, and security. It is widely regarded as the entry point for IT careers.",
  status: "active",
  cost: "$404 USD (two exams at $202 each)",
  prerequisites: [],
  tags: ["entry-level", "hardware", "troubleshooting", "help-desk", "it-fundamentals"],
  links: [
    {
      label: "Official Certification Page",
      url: "https://www.comptia.org/certifications/a",
      type: "official",
    },
    {
      label: "CompTIA A+ Exam Objectives",
      url: "https://www.comptia.org/certifications/a#examdetails",
      type: "source-of-truth",
    },
    {
      label: "r/CompTIA",
      url: "https://www.reddit.com/r/CompTIA/",
      type: "community",
    },
    {
      label: "Professor Messer A+ Training",
      url: "https://www.professormesser.com/free-a-plus-training/220-1101/220-1101-video/220-1101-training-course/",
      type: "course",
    },
  ],
  versions: [
    {
      version: "220-1101 / 220-1102",
      releaseDate: "2022-04-20",
      notes: "Core 1 and Core 2 exams covering current hardware, OS, networking, and security topics.",
    },
    {
      version: "220-1001 / 220-1002",
      releaseDate: "2019-01-15",
      retireDate: "2022-10-20",
      notes: "Previous generation, now retired.",
    },
  ],
  relatedCertSlugs: ["comptia-security-plus", "ccna"],
  lastVerified: "2026-03-01",
  sourceOfTruthUrl: "https://www.comptia.org/certifications/a",
};
