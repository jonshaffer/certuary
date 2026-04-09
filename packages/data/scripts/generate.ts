import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import type { z } from "zod";
import {
  RawProviderSchema,
  RawCertSchema,
  RawProgramSchema,
  RawCategoryTaxonomySchema,
  type RawExamDomain,
} from "../src/schemas.js";

const DATA_DIR = path.resolve(import.meta.dirname, "../data");
const OUT_FILE = path.resolve(import.meta.dirname, "../src/generated.ts");

function readYaml<T>(filePath: string, schema: z.ZodType<T>): T {
  const content = fs.readFileSync(filePath, "utf-8");

  let parsed: unknown;
  try {
    parsed = parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse YAML in "${filePath}": ${message}`);
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Validation failed for "${filePath}": ${result.error.message}`,
    );
  }

  return result.data;
}

function mapDomain(d: RawExamDomain): object {
  return {
    name: d.name,
    ...(d.weight != null ? { weight: d.weight } : {}),
    ...(d.subdomains ? { subdomains: d.subdomains.map(mapDomain) } : {}),
    ...(d.categories?.length ? { categories: d.categories } : {}),
  };
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

    const rawProvider = readYaml(providerIndexPath, RawProviderSchema);
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

      const raw = readYaml(certIndexPath, RawCertSchema);

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
        const raw = readYaml(path.join(programsDir, programFile), RawProgramSchema);
        programs.push({
          slug: raw.slug,
          type: raw.type,
          name: raw.name,
          providerSlug: rawProvider.slug,
          description: raw.description,
          website: raw.website,
          status: raw.status,
          ...(raw.designation ? { designation: raw.designation } : {}),
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

  // Parse category taxonomy
  const categoryTaxonomyPath = path.join(DATA_DIR, "_categories.yaml");
  const rawTaxonomy = readYaml(categoryTaxonomyPath, RawCategoryTaxonomySchema);
  const categoryGroups = rawTaxonomy.groups.map((g) => ({
    slug: g.slug,
    label: g.label,
  }));
  const domainCategories = rawTaxonomy.categories.map((c) => ({
    slug: c.slug,
    label: c.label,
    group: c.group,
  }));

  const output = `// Auto-generated from data/**/_index.yaml and data/**/programs/*.yaml — do not edit manually.
// Run "pnpm generate" to regenerate.
import type { Provider, Certification, Program, CategoryGroup, DomainCategory } from "./types.js";

export const providers: Provider[] = ${JSON.stringify(providers, null, 2)};

export const certifications: Certification[] = ${JSON.stringify(certifications, null, 2)};

export const programs: Program[] = ${JSON.stringify(programs, null, 2)};

export const categoryGroups: CategoryGroup[] = ${JSON.stringify(categoryGroups, null, 2)};

export const domainCategories: DomainCategory[] = ${JSON.stringify(domainCategories, null, 2)};
`;

  fs.writeFileSync(OUT_FILE, output, "utf-8");

  console.log(
    `Generated ${OUT_FILE} — ${providers.length} providers, ${certifications.length} certifications, ${programs.length} programs`,
  );
}

generate();
