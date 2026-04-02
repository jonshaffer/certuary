import type { Certification, Program, Provider } from "./types.js";
import { certifications, programs, providers } from "./generated.js";

export function getAllCerts(): Certification[] {
  return certifications;
}

export function getCertBySlug(slug: string): Certification | undefined {
  return certifications.find((c) => c.slug === slug);
}

export function getCertsByProvider(providerSlug: string): Certification[] {
  return certifications.filter((c) => c.providerSlug === providerSlug);
}

export function getCertsByTag(tag: string): Certification[] {
  return certifications.filter((c) => c.tags.includes(tag));
}

export function getAllProviders(): Provider[] {
  return providers;
}

export function getProviderBySlug(slug: string): Provider | undefined {
  return providers.find((p) => p.slug === slug);
}

export function getAllPrograms(): Program[] {
  return programs;
}

export function getProgramBySlug(slug: string): Program | undefined {
  return programs.find((p) => p.slug === slug);
}

export function getProgramsByProvider(providerSlug: string): Program[] {
  return programs.filter((p) => p.providerSlug === providerSlug);
}

export function getCertsByProgram(programSlug: string): Certification[] {
  const program = getProgramBySlug(programSlug);
  if (!program) return [];
  const phaseSlugs = program.phases.flatMap((p) => p.certificateSlugs);
  const allSlugs = new Set([...program.requiredCerts, ...phaseSlugs]);
  return certifications.filter((c) => allSlugs.has(c.slug));
}

export function getCertsWithDomains(): Certification[] {
  return certifications.filter((c) => c.domains.length > 0);
}
