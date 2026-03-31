export type CertStatus = "active" | "retiring" | "retired";

export interface Provider {
  id: string;
  name: string;
  slug: string;
  website: string;
  description: string;
  logo?: string;
}

export interface CertLink {
  label: string;
  url: string;
  type: "official" | "community" | "practice" | "course" | "source-of-truth";
}

export interface CertVersion {
  version: string;
  releaseDate: string;
  retireDate?: string;
  notes?: string;
}

export interface Certification {
  id: string;
  slug: string;
  name: string;
  shortName?: string;
  providerId: string;
  description: string;
  status: CertStatus;
  cost?: string;
  prerequisites: string[];
  tags: string[];
  links: CertLink[];
  versions: CertVersion[];
  relatedCertSlugs: string[];
  lastVerified?: string;
  sourceOfTruthUrl?: string;
}
