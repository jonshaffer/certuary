export const PROVIDER_COLORS: Record<string, string> = {
  aws: "#FF9900",
  azure: "#0078D4",
  gcp: "#4285F4",
  comptia: "#C8202F",
  cisco: "#1BA0D7",
  isc2: "#00843D",
  isaca: "#003F72",
  "ec-council": "#D4213D",
  giac: "#5C2D91",
  "linux-foundation": "#003366",
  "red-hat": "#EE0000",
  pmi: "#1E3A5F",
  peoplecert: "#00A5E3",
  "scaled-agile": "#FF6900",
  "scrum-org": "#009FDA",
  "scrum-alliance": "#F5A623",
  github: "#333333",
  htb: "#9FEF00",
  iapp: "#004C97",
  crest: "#1B3A4B",
  csa: "#2196F3",
  "open-group": "#6D6E71",
  sabsa: "#8B0000",
};

export function getProviderColor(slug: string): string {
  return PROVIDER_COLORS[slug] || "#888888";
}

/** OKLCH hue angles derived from provider brand hex colors. */
const PROVIDER_HUES: Record<string, number> = {
  aws: 70,
  azure: 240,
  gcp: 225,
  comptia: 20,
  cisco: 210,
  isc2: 155,
  isaca: 230,
  "ec-council": 15,
  giac: 290,
  "linux-foundation": 240,
  "red-hat": 25,
  pmi: 240,
  peoplecert: 210,
  "scaled-agile": 50,
  "scrum-org": 220,
  "scrum-alliance": 65,
  github: 0,
  htb: 120,
  iapp: 240,
  crest: 220,
  csa: 240,
  "open-group": 0,
  sabsa: 15,
};

/** Get an OKLCH hue angle for a provider, falling back to 265 (blue). */
export function providerHue(slug: string): number {
  return PROVIDER_HUES[slug] ?? 265;
}
