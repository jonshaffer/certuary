import type { Certification, Provider } from "./types.js";
import { certifications, providers } from "./generated.js";

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
