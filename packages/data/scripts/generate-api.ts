import fs from "node:fs";
import path from "node:path";
import {
  getAllCerts,
  getCertsByProvider,
  getCertsByProgram,
  getAllProviders,
  getAllPrograms,
  getProgramsByProvider,
  getAllCategoryGroups,
  getAllDomainCategories,
} from "../src/helpers.js";

const args = process.argv.slice(2);
const outDirIdx = args.indexOf("--out-dir");
if (outDirIdx === -1 || !args[outDirIdx + 1]) {
  console.error("Usage: generate-api.ts --out-dir <path>");
  process.exit(1);
}
const outDir = path.resolve(args[outDirIdx + 1]);
const basePath = process.env.BASE_PATH ?? "/";

function writeJson(filePath: string, data: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

const endpoints: string[] = [];

function emit(relativePath: string, data: unknown) {
  writeJson(path.join(outDir, relativePath), data);
  endpoints.push(`${basePath}api/${relativePath}`);
}

// Collections
emit("certifications.json", getAllCerts());
emit("providers.json", getAllProviders());
emit("programs.json", getAllPrograms());
emit("categories.json", {
  categoryGroups: getAllCategoryGroups(),
  domainCategories: getAllDomainCategories(),
});

// Individual certifications
for (const cert of getAllCerts()) {
  emit(`certifications/${cert.slug}.json`, cert);
}

// Individual providers + nested resources
for (const provider of getAllProviders()) {
  emit(`providers/${provider.slug}.json`, provider);
  emit(
    `providers/${provider.slug}/certifications.json`,
    getCertsByProvider(provider.slug),
  );
  emit(
    `providers/${provider.slug}/programs.json`,
    getProgramsByProvider(provider.slug),
  );
}

// Individual programs + nested certifications
for (const program of getAllPrograms()) {
  emit(`programs/${program.slug}.json`, program);
  emit(
    `programs/${program.slug}/certifications.json`,
    getCertsByProgram(program.slug),
  );
}

// Manifest
writeJson(path.join(outDir, "index.json"), {
  generatedAt: new Date().toISOString(),
  endpoints,
});

console.log(
  `Generated ${endpoints.length} JSON API endpoints in ${outDir}`,
);
