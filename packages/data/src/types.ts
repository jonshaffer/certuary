export type CertStatus = "active" | "retiring" | "retired";

export type ExamFormat = "multiple-choice" | "performance-based";

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
  name: string;
  providerSlug: string;
  description: string;
  website: string;
  status: ProgramStatus;
  requiredCerts: string[];
  phases: ProgramPhase[];
  orderingStrategies?: OrderingStrategy[];
  completionCriteria: ProgramCompletionCriteria;
}
