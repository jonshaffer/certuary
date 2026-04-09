import { useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router";
import {
  getAllCerts,
  getAllDomainCategories,
  getAllCategoryGroups,
  getAllProviders,
  getDomainCategoriesByGroup,
} from "@certuary/data";
import { buildHeatmapData } from "../lib/domain-analysis";
import { getProviderColor, providerHue } from "@/lib/provider-colors";
import { getCertLabel } from "@/lib/cert-label";

function useHeatmapParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const group = searchParams.get("group") || "";
  const provider = searchParams.get("provider") || "";
  const selectedCell = searchParams.get("cell") || "";

  const setParam = useCallback(
    (key: string, value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        next.delete("cell");
        return next;
      });
    },
    [setSearchParams]
  );

  return { group, provider, selectedCell, setParam, setSearchParams };
}

export function HeatmapPage() {
  const { group, provider, selectedCell, setParam, setSearchParams } =
    useHeatmapParams();

  const groups = useMemo(() => getAllCategoryGroups(), []);
  const providers = useMemo(() => getAllProviders(), []);

  const categories = useMemo(() => {
    if (group) return getDomainCategoriesByGroup(group);
    return getAllDomainCategories();
  }, [group]);

  const certs = useMemo(() => {
    let result = getAllCerts().filter((c) => c.domains.length > 0);
    if (provider) {
      result = result.filter((c) => c.providerSlug === provider);
    }
    return result;
  }, [provider]);

  const cells = useMemo(
    () => buildHeatmapData(certs, categories),
    [certs, categories]
  );

  const maxWeight = useMemo(
    () => Math.max(...cells.map((c) => c.weight), 1),
    [cells]
  );

  const cellMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const cell of cells) {
      map.set(`${cell.certSlug}:${cell.categorySlug}`, cell.weight);
    }
    return map;
  }, [cells]);

  // Only show certs that have at least one non-zero cell
  const visibleCerts = useMemo(() => {
    const certSlugsWithData = new Set(cells.map((c) => c.certSlug));
    return certs.filter((c) => certSlugsWithData.has(c.slug));
  }, [certs, cells]);

  // Only show categories that have at least one non-zero cell
  const visibleCategories = useMemo(() => {
    const catSlugsWithData = new Set(cells.map((c) => c.categorySlug));
    return categories.filter((c) => catSlugsWithData.has(c.slug));
  }, [categories, cells]);

  const handleCellClick = useCallback(
    (certSlug: string, catSlug: string) => {
      const key = `${certSlug}:${catSlug}`;
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (next.get("cell") === key) {
          next.delete("cell");
        } else {
          next.set("cell", key);
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const selectedCertSlug = selectedCell?.split(":")[0] || null;
  const selectedCatSlug = selectedCell?.split(":")[1] || null;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold">Domain Heatmap</h1>
        <p className="text-sm text-muted-foreground">
          {visibleCerts.length} certs × {visibleCategories.length} categories
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Group:</label>
          <select
            className="rounded border border-border bg-background px-2 py-1 text-sm"
            value={group}
            onChange={(e) => setParam("group", e.target.value)}
          >
            <option value="">All categories</option>
            {groups.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Provider:</label>
          <select
            className="rounded border border-border bg-background px-2 py-1 text-sm"
            value={provider}
            onChange={(e) => setParam("provider", e.target.value)}
          >
            <option value="">All providers</option>
            {providers.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {visibleCerts.length === 0 || visibleCategories.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No matching data for the selected filters. Try broadening your
          selection.
        </p>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <table className="min-w-max border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-card px-2 py-1 text-left text-xs font-medium text-muted-foreground border-b border-r border-border min-w-[180px]">
                  Category
                </th>
                {visibleCerts.map((cert) => (
                  <th
                    key={cert.slug}
                    className={`border-b border-border px-0.5 py-1 text-center ${
                      selectedCertSlug === cert.slug
                        ? "bg-primary/10"
                        : ""
                    }`}
                  >
                    <Link
                      to={`/cert/${cert.slug}`}
                      className="block text-[11px] leading-tight hover:text-primary transition-colors max-w-[80px] mx-auto"
                      title={cert.name}
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-0.5 align-middle"
                        style={{ backgroundColor: getProviderColor(cert.providerSlug) }}
                      />
                      {getCertLabel(cert)}
                      {cert.status === "retiring" && (
                        <span className="text-amber-500" title="Retiring">*</span>
                      )}
                      {cert.status === "retired" && (
                        <span className="text-destructive" title="Retired">**</span>
                      )}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleCategories.map((cat) => (
                <tr
                  key={cat.slug}
                  className={
                    selectedCatSlug === cat.slug ? "bg-primary/5" : ""
                  }
                >
                  <td className="sticky left-0 z-10 bg-card px-2 py-1 text-xs font-medium border-r border-border whitespace-nowrap">
                    {cat.label}
                  </td>
                  {visibleCerts.map((cert) => {
                    const weight =
                      cellMap.get(`${cert.slug}:${cat.slug}`) || 0;
                    const intensity =
                      weight > 0 ? 0.15 + 0.85 * (weight / maxWeight) : 0;
                    const isSelected =
                      selectedCertSlug === cert.slug &&
                      selectedCatSlug === cat.slug;

                    return (
                      <td
                        key={cert.slug}
                        className={`px-0 py-0 border border-border/30 cursor-pointer transition-all ${
                          isSelected ? "ring-2 ring-primary" : ""
                        }`}
                        title={`${cert.name} × ${cat.label}: ${weight > 0 ? `${weight}% coverage` : "no match"}`}
                        onClick={() => handleCellClick(cert.slug, cat.slug)}
                      >
                        <div
                          className="w-full h-6 min-w-[20px]"
                          style={{
                            backgroundColor:
                              weight > 0
                                ? `oklch(0.55 0.15 ${providerHue(cert.providerSlug)} / ${intensity})`
                                : "transparent",
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Low</span>
          <div className="flex h-4">
            {[0.15, 0.35, 0.55, 0.75, 1].map((intensity) => (
              <div
                key={intensity}
                className="w-6 h-4"
                style={{
                  backgroundColor: `oklch(0.55 0 0 / ${intensity})`,
                }}
              />
            ))}
          </div>
          <span>High</span>
          <span className="ml-4">Domain weight coverage · Cell hue varies by provider</span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          <span className="text-amber-500">*</span> retiring
          {" · "}
          <span className="text-destructive">**</span> retired
        </p>
      </div>
    </div>
  );
}
