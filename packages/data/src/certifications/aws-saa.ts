import type { Certification } from "../types.js";

export const awsSolutionsArchitectAssociate: Certification = {
  id: "aws-solutions-architect-associate",
  slug: "aws-solutions-architect-associate",
  name: "AWS Certified Solutions Architect – Associate",
  shortName: "AWS SAA",
  providerId: "aws",
  description:
    "Validates the ability to design distributed systems on AWS, covering compute, networking, storage, databases, and cost optimization. One of the most popular cloud certifications worldwide.",
  status: "active",
  cost: "$150 USD",
  prerequisites: ["One or more years of hands-on AWS experience recommended"],
  tags: ["cloud", "architecture", "intermediate", "aws", "solutions-architect"],
  links: [
    {
      label: "Official Certification Page",
      url: "https://aws.amazon.com/certification/certified-solutions-architect-associate/",
      type: "official",
    },
    {
      label: "Exam Guide (PDF)",
      url: "https://d1.awsstatic.com/training-and-certification/docs-sa-assoc/AWS-Certified-Solutions-Architect-Associate_Exam-Guide.pdf",
      type: "source-of-truth",
    },
    {
      label: "r/AWSCertifications",
      url: "https://www.reddit.com/r/AWSCertifications/",
      type: "community",
    },
  ],
  versions: [
    {
      version: "SAA-C03",
      releaseDate: "2022-08-30",
      notes: "Current version with increased emphasis on serverless, containers, and cost optimization.",
    },
    {
      version: "SAA-C02",
      releaseDate: "2020-03-23",
      retireDate: "2022-08-29",
      notes: "Previous version, now retired.",
    },
  ],
  relatedCertSlugs: ["comptia-security-plus"],
  lastVerified: "2026-03-01",
  sourceOfTruthUrl: "https://aws.amazon.com/certification/certified-solutions-architect-associate/",
};
