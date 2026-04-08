import { useMemo, useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  getAllCerts,
  getAllProviders,
  getAllDomainCategories,
  getAllCategoryGroups,
} from "@certuary/data";
import type { Certification } from "@certuary/data";
import { buildCertCategoryGroupMap } from "../lib/domain-analysis";
import {
  EXPERIENCE_LEVELS,
  getCertLevel,
  type ExperienceLevel,
} from "../lib/experience-levels";
import { getProviderColor } from "@/lib/provider-colors";
import { getCertLabel } from "@/lib/cert-label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

function useRoadmapParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const provider = searchParams.get("provider") || "";

  const setParam = useCallback(
    (key: string, value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        return next;
      });
    },
    [setSearchParams]
  );

  return { provider, setParam };
}

const CELL_CHIP_LIMIT = 8;

function CertChip({ cert }: { cert: Certification }) {
  return (
    <Link
      to={`/cert/${cert.slug}`}
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium leading-tight text-white hover:opacity-80 transition-opacity"
      style={{ backgroundColor: getProviderColor(cert.providerSlug) }}
      title={`${cert.name} (${cert.providerSlug})`}
    >
      {getCertLabel(cert)}
      {cert.status !== "active" && (
        <span className="opacity-70">
          {cert.status === "retiring" ? "*" : "**"}
        </span>
      )}
    </Link>
  );
}

function GridCell({ certs }: { certs: Certification[] }) {
  if (certs.length === 0) {
    return (
      <td className="border border-border/30 px-2 py-2 align-top text-center text-xs text-muted-foreground/40">
        —
      </td>
    );
  }

  if (certs.length <= CELL_CHIP_LIMIT) {
    return (
      <td className="border border-border/30 px-2 py-2 align-top">
        <div className="flex flex-wrap gap-1">
          {certs.map((c) => (
            <CertChip key={c.slug} cert={c} />
          ))}
        </div>
      </td>
    );
  }

  // Dense cell — show count with expandable popover
  return (
    <td className="border border-border/30 px-2 py-2 align-top">
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex flex-wrap items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
            <Badge variant="secondary" className="text-xs">
              {certs.length} certs
            </Badge>
            <div className="flex flex-wrap gap-0.5">
              {certs.slice(0, 12).map((c) => (
                <div
                  key={c.slug}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getProviderColor(c.providerSlug) }}
                  title={c.name}
                />
              ))}
              {certs.length > 12 && (
                <span className="text-[9px] text-muted-foreground">
                  +{certs.length - 12}
                </span>
              )}
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <ScrollArea className="max-h-64 p-3">
            <div className="flex flex-wrap gap-1">
              {certs.map((c) => (
                <CertChip key={c.slug} cert={c} />
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </td>
  );
}

export function RoadmapPage() {
  const { provider, setParam } = useRoadmapParams();

  const providers = useMemo(() => getAllProviders(), []);
  const categoryGroups = useMemo(() => getAllCategoryGroups(), []);
  const categories = useMemo(() => getAllDomainCategories(), []);

  const certs = useMemo(() => {
    let result = getAllCerts().filter((c) => c.domains.length > 0);
    if (provider) {
      result = result.filter((c) => c.providerSlug === provider);
    }
    return result;
  }, [provider]);

  // Build the grid data: Map<"groupSlug:level", Certification[]>
  const { gridMap, unmappedCount } = useMemo(() => {
    const certGroupMap = buildCertCategoryGroupMap(
      certs,
      categories,
      categoryGroups
    );

    const map = new Map<string, Certification[]>();
    let unmapped = 0;

    for (const cert of certs) {
      const groups = certGroupMap.get(cert.slug);
      if (!groups || groups.length === 0) {
        unmapped++;
        continue;
      }

      const level = getCertLevel(cert);
      for (const groupSlug of groups) {
        const key = `${groupSlug}:${level}`;
        const list = map.get(key);
        if (list) {
          list.push(cert);
        } else {
          map.set(key, [cert]);
        }
      }
    }

    return { gridMap: map, unmappedCount: unmapped };
  }, [certs, categories, categoryGroups]);

  const totalMapped = useMemo(() => {
    const slugs = new Set<string>();
    for (const list of gridMap.values()) {
      for (const c of list) slugs.add(c.slug);
    }
    return slugs.size;
  }, [gridMap]);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold">Certification Roadmap</h1>
        <p className="text-sm text-muted-foreground">
          {totalMapped} certs mapped
          {unmappedCount > 0 && ` · ${unmappedCount} without domain match`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
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

      {/* Grid matrix */}
      <div className="overflow-x-auto rounded border border-border">
        <table className="min-w-max border-collapse w-full">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left text-xs font-medium text-muted-foreground border-b border-r border-border min-w-[100px]">
                Level
              </th>
              {categoryGroups.map((group) => (
                <th
                  key={group.slug}
                  className="border-b border-border px-2 py-2 text-center text-xs font-medium min-w-[140px]"
                >
                  {group.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EXPERIENCE_LEVELS.map((level) => (
              <tr key={level.key}>
                <td className="sticky left-0 z-10 bg-card px-3 py-2 text-sm font-medium border-r border-border whitespace-nowrap">
                  {level.label}
                </td>
                {categoryGroups.map((group) => (
                  <GridCell
                    key={group.slug}
                    certs={
                      gridMap.get(`${group.slug}:${level.key}`) ?? []
                    }
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Certifications organized by domain category and experience level.
        Colored by provider. Certs may appear in multiple columns if they span
        domains. Click a cert to view details.
        {" "}<span className="text-amber-500">*</span> retiring
        {" · "}<span className="text-destructive">**</span> retired
      </p>
    </div>
  );
}
