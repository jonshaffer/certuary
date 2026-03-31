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

interface RawCert {
  name: string;
  slug: string;
  short_name?: string;
  status: string;
  cost?: string;
  description: string;
  tags?: string[];
  prerequisites?: string[];
  related_certs?: string[];
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

function readYaml<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, "utf-8");
  return parse(content) as T;
}

function generate() {
  const providers: object[] = [];
  const certifications: object[] = [];

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
        ...(raw.last_verified ? { lastVerified: raw.last_verified } : {}),
        ...(raw.source_of_truth_url ? { sourceOfTruthUrl: raw.source_of_truth_url } : {}),
      });
    }
  }

  const output = `// Auto-generated from data/**/_index.yaml — do not edit manually.
// Run "pnpm generate" to regenerate.
import type { Provider, Certification } from "./types.js";

export const providers: Provider[] = ${JSON.stringify(providers, null, 2)};

export const certifications: Certification[] = ${JSON.stringify(certifications, null, 2)};
`;

  fs.writeFileSync(OUT_FILE, output, "utf-8");

  console.log(
    `Generated ${OUT_FILE} — ${providers.length} providers, ${certifications.length} certifications`,
  );
}

generate();
