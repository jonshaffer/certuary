import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const DATA_DIR = path.resolve(import.meta.dirname, "../data");
const OUT_FILE = path.resolve(import.meta.dirname, "../src/generated.ts");

interface RawProvider {
  name: string;
  slug: string;
  website: string;
  description: string;
  logo?: string;
}

interface RawExamDomain {
  name: string;
  weight?: number;
  subdomains?: RawExamDomain[];
}

interface RawCert {
  name: string;
  slug: string;
  short_name?: string;
  status: string;
  cost?: string;
  exam_format?: string;
  passing_score?: number;
  duration_minutes?: number;
  question_count?: { min: number; max?: number; approximate?: boolean };
  description: string;
  tags?: string[];
  prerequisites?: string[];
  related_certs?: string[];
  domains?: RawExamDomain[];
  prerequisite_certs?: string[];
  domain_source_url?: string;
  versions?: {
    version: string;
    release_date?: string;
    retire_date?: string;
    notes?: string;
  }[];
  links?: {
    label: string;
    url: string;
    type: string;
  }[];
  source_of_truth_url?: string;
  last_verified?: string;
}

interface RawProgram {
  slug: string;
  name: string;
  description: string;
  website: string;
  status: string;
  required_certs?: string[];
  phases?: {
    name: string;
    order: number;
    certificate_slugs: string[];
  }[];
  ordering_strategies?: {
    slug: string;
    name: string;
    description?: string;
    phases: { name: string; order: number; certificate_slugs: string[] }[];
  }[];
  completion_criteria?: {
    required: number;
    notes?: string;
  };
}

function mapDomain(d: RawExamDomain): object {
  return {
    name: d.name,
    ...(d.weight != null ? { weight: d.weight } : {}),
    ...(d.subdomains ? { subdomains: d.subdomains.map(mapDomain) } : {}),
  };
}

function readYaml<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, "utf-8");
  return parse(content) as T;
}

function generate() {
  const providers: object[] = [];
  const certifications: object[] = [];
  const programs: object[] = [];

  const entries = fs.readdirSync(DATA_DIR, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const providerDir = path.join(DATA_DIR, entry.name);
    const providerIndexPath = path.join(providerDir, "_index.yaml");

    if (!fs.existsSync(providerIndexPath)) continue;

    const rawProvider = readYaml<RawProvider>(providerIndexPath);
    providers.push({
      slug: rawProvider.slug,
      name: rawProvider.name,
      website: rawProvider.website,
      description: rawProvider.description,
      ...(rawProvider.logo ? { logo: rawProvider.logo } : {}),
    });

    const certEntries = fs.readdirSync(providerDir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    for (const certEntry of certEntries) {
      if (!certEntry.isDirectory()) continue;

      const certIndexPath = path.join(providerDir, certEntry.name, "_index.yaml");
      if (!fs.existsSync(certIndexPath)) continue;

      const raw = readYaml<RawCert>(certIndexPath);

      certifications.push({
        slug: raw.slug,
        name: raw.name,
        ...(raw.short_name ? { shortName: raw.short_name } : {}),
        providerSlug: rawProvider.slug,
        description: raw.description,
        status: raw.status,
        ...(raw.cost ? { cost: raw.cost } : {}),
        ...(raw.exam_format ? { examFormat: raw.exam_format } : {}),
        ...(raw.passing_score != null ? { passingScore: raw.passing_score } : {}),
        ...(raw.duration_minutes != null ? { durationMinutes: raw.duration_minutes } : {}),
        ...(raw.question_count ? { questionCount: raw.question_count } : {}),
        prerequisites: raw.prerequisites ?? [],
        tags: raw.tags ?? [],
        links: (raw.links ?? []).map((l) => ({
          label: l.label,
          url: l.url,
          type: l.type,
        })),
        versions: (raw.versions ?? []).map((v) => ({
          version: v.version,
          releaseDate: v.release_date ?? "",
          ...(v.retire_date ? { retireDate: v.retire_date } : {}),
          ...(v.notes ? { notes: v.notes } : {}),
        })),
        relatedCertSlugs: raw.related_certs ?? [],
        domains: (raw.domains ?? []).map(mapDomain),
        prerequisiteCerts: raw.prerequisite_certs ?? [],
        ...(raw.domain_source_url ? { domainSourceUrl: raw.domain_source_url } : {}),
        ...(raw.last_verified ? { lastVerified: raw.last_verified } : {}),
        ...(raw.source_of_truth_url ? { sourceOfTruthUrl: raw.source_of_truth_url } : {}),
      });
    }

    // Scan for program definitions
    const programsDir = path.join(providerDir, "programs");
    if (fs.existsSync(programsDir)) {
      const programFiles = fs
        .readdirSync(programsDir)
        .filter((f) => f.endsWith(".yaml"))
        .sort();

      for (const programFile of programFiles) {
        const raw = readYaml<RawProgram>(path.join(programsDir, programFile));
        programs.push({
          slug: raw.slug,
          name: raw.name,
          providerSlug: rawProvider.slug,
          description: raw.description,
          website: raw.website,
          status: raw.status,
          requiredCerts: raw.required_certs ?? [],
          phases: (raw.phases ?? []).map((p) => ({
            name: p.name,
            order: p.order,
            certificateSlugs: p.certificate_slugs,
          })),
          ...(raw.ordering_strategies
            ? {
                orderingStrategies: raw.ordering_strategies.map((s) => ({
                  slug: s.slug,
                  name: s.name,
                  ...(s.description ? { description: s.description } : {}),
                  phases: s.phases.map((p) => ({
                    name: p.name,
                    order: p.order,
                    certificateSlugs: p.certificate_slugs,
                  })),
                })),
              }
            : {}),
          completionCriteria: raw.completion_criteria ?? { required: 0 },
        });
      }
    }
  }

  const output = `// Auto-generated from data/**/_index.yaml and data/**/programs/*.yaml — do not edit manually.
// Run "pnpm generate" to regenerate.
import type { Provider, Certification, Program } from "./types.js";

export const providers: Provider[] = ${JSON.stringify(providers, null, 2)};

export const certifications: Certification[] = ${JSON.stringify(certifications, null, 2)};

export const programs: Program[] = ${JSON.stringify(programs, null, 2)};
`;

  fs.writeFileSync(OUT_FILE, output, "utf-8");

  console.log(
    `Generated ${OUT_FILE} — ${providers.length} providers, ${certifications.length} certifications, ${programs.length} programs`,
  );
}

generate();
