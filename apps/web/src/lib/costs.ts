export function parseCost(cost: string | undefined): number {
  if (!cost) return 0;
  const trimmed = cost.trim();
  if (!trimmed.startsWith("$")) return 0;
  const dollarSigns = trimmed.match(/\$/g);
  if (!dollarSigns || dollarSigns.length !== 1) return 0;
  const match = trimmed.match(/^\$(\d[\d,]*)/);
  return match ? Number(match[1].replace(/,/g, "")) : 0;
}
