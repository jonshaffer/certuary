export type CertStatus = "active" | "retiring" | "retired";

export type ExamFormatValue = "multiple-choice" | "performance-based" | "essay";

export type ExamFormat = ExamFormatValue | ExamFormatValue[];

export interface QuestionCount {
  min: number;
  max?: number;
  approximate?: boolean;
}

export interface Provider {
  slug: string;
  name: string;
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

export interface ExamDomain {
  name: string;
  weight?: number;
  subdomains?: ExamDomain[];
  categories?: string[];
}

export interface CategoryGroup {
  slug: string;
  label: string;
}

export interface DomainCategory {
  slug: string;
  label: string;
  group: string;
}

export interface Certification {
  slug: string;
  name: string;
  shortName?: string;
  providerSlug: string;
  description: string;
  status: CertStatus;
  cost?: string;
  examFormat?: ExamFormat;
  passingScore?: number;
  durationMinutes?: number;
  questionCount?: QuestionCount;
  prerequisites: string[];
  tags: string[];
  links: CertLink[];
  versions: CertVersion[];
  relatedCertSlugs: string[];
  domains: ExamDomain[];
  prerequisiteCerts: string[];
  domainSourceUrl?: string;
  lastVerified?: string;
  sourceOfTruthUrl?: string;
}

export type ProgramType = "provider" | "certuary" | "community";

export type ProgramStatus = "active" | "retired";

export interface ProgramPhase {
  name: string;
  order: number;
  certificateSlugs: string[];
}

export interface OrderingStrategy {
  slug: string;
  name: string;
  description?: string;
  phases: ProgramPhase[];
}

export interface ProgramCompletionCriteria {
  required: number;
  notes?: string;
}

export interface Program {
  slug: string;
  type: ProgramType;
  name: string;
  providerSlug: string;
  description: string;
  website: string;
  status: ProgramStatus;
  designation?: string;
  requiredCerts: string[];
  phases: ProgramPhase[];
  orderingStrategies?: OrderingStrategy[];
  completionCriteria: ProgramCompletionCriteria;
}
