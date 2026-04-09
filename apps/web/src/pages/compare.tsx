import { useMemo, useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  getAllCerts,
  getCertBySlug,
  getProviderBySlug,
} from "@certuary/data";
import type { Certification } from "@certuary/data";
import { getCertLevel, EXPERIENCE_LEVELS } from "@/lib/experience-levels";
import { getProviderColor } from "@/lib/provider-colors";
import { parseCost } from "@/lib/costs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const MAX_CERTS = 4;

function useCompareParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const certSlugs = useMemo(() => {
    const raw = searchParams.get("certs") || "";
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [searchParams]);

  const setCertSlugs = useCallback(
    (slugs: string[]) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (slugs.length > 0) {
          next.set("certs", slugs.join(","));
        } else {
          next.delete("certs");
        }
        return next;
      });
    },
    [setSearchParams]
  );

  return { certSlugs, setCertSlugs };
}

function CertSelector({
  selected,
  onAdd,
}: {
  selected: string[];
  onAdd: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const allCerts = useMemo(() => getAllCerts(), []);

  const selectedSet = new Set(selected);
  const atCapacity = selected.length >= MAX_CERTS;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={atCapacity}
          className="text-sm"
        >
          {atCapacity
            ? `Maximum ${MAX_CERTS} selected`
            : "+ Add certification"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search certifications..." />
          <CommandList>
            <CommandEmpty>No certifications found.</CommandEmpty>
            <CommandGroup>
              {allCerts
                .filter((c) => !selectedSet.has(c.slug))
                .map((c) => (
                  <CommandItem
                    key={c.slug}
                    value={`${c.name} ${c.slug}`}
                    onSelect={() => {
                      onAdd(c.slug);
                      setOpen(false);
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: getProviderColor(c.providerSlug),
                      }}
                    />
                    <span className="truncate">{c.name}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function AttributeRow({
  label,
  certs,
  render,
  highlightBest,
}: {
  label: string;
  certs: Certification[];
  render: (cert: Certification, isBest: boolean) => React.ReactNode;
  highlightBest?: (cert: Certification) => number | null;
}) {
  const bestIndex = useMemo(() => {
    if (!highlightBest || certs.length < 2) return -1;
    let best = -1;
    let bestVal = Infinity;
    for (let i = 0; i < certs.length; i++) {
      const val = highlightBest(certs[i]);
      if (val !== null && val >= 0 && val < bestVal) {
        bestVal = val;
        best = i;
      }
    }
    return best;
  }, [certs, highlightBest]);

  return (
    <tr>
      <td className="sticky left-0 z-10 bg-card px-3 py-2 text-sm font-medium border-r border-border whitespace-nowrap">
        {label}
      </td>
      {certs.map((cert, i) => (
        <td
          key={cert.slug}
          className={`px-3 py-2 text-sm border-r border-border ${
            i === bestIndex ? "bg-green-50 dark:bg-green-950/20" : ""
          }`}
        >
          {render(cert, i === bestIndex)}
        </td>
      ))}
    </tr>
  );
}

function QuickCompareLink({
  label,
  slugs,
}: {
  label: string;
  slugs: string[];
}) {
  return (
    <Link
      to={`/compare?certs=${slugs.join(",")}`}
      className="text-sm text-primary hover:underline"
    >
      {label}
    </Link>
  );
}

export function ComparePage() {
  const { certSlugs, setCertSlugs } = useCompareParams();

  const certs = useMemo(
    () =>
      certSlugs
        .map((slug) => getCertBySlug(slug))
        .filter((c): c is Certification => c != null),
    [certSlugs]
  );

  const addCert = useCallback(
    (slug: string) => {
      if (certSlugs.length < MAX_CERTS && !certSlugs.includes(slug)) {
        setCertSlugs([...certSlugs, slug]);
      }
    },
    [certSlugs, setCertSlugs]
  );

  const removeCert = useCallback(
    (slug: string) => {
      setCertSlugs(certSlugs.filter((s) => s !== slug));
    },
    [certSlugs, setCertSlugs]
  );

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Compare Certifications</h1>

      {/* Selected certs + selector */}
      <div className="flex flex-wrap items-center gap-2">
        {certs.map((cert) => (
          <div
            key={cert.slug}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: getProviderColor(cert.providerSlug),
              }}
            />
            <span className="font-medium">{cert.shortName ?? cert.name}</span>
            <button
              onClick={() => removeCert(cert.slug)}
              className="ml-1 text-muted-foreground hover:text-foreground"
              aria-label={`Remove ${cert.name}`}
            >
              ×
            </button>
          </div>
        ))}
        <CertSelector selected={certSlugs} onAdd={addCert} />
      </div>

      {certs.length < 2 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium">
            {certs.length === 0
              ? "Select at least 2 certifications to compare"
              : "Select one more certification to compare"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a quick comparison:
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <QuickCompareLink
              label="AWS SA-A vs Azure AZ-104 vs GCP ACE"
              slugs={[
                "aws-solutions-architect-associate",
                "azure-administrator-associate",
                "gcp-cloud-engineer-associate",
              ]}
            />
            <QuickCompareLink
              label="CISSP vs CISM vs CISA"
              slugs={["isc2-cissp", "isaca-cism", "isaca-cisa"]}
            />
            <QuickCompareLink
              label="CompTIA Security+ vs CySA+ vs CASP+"
              slugs={[
                "comptia-security-plus",
                "comptia-cysa-plus",
                "comptia-casp-plus",
              ]}
            />
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <table className="min-w-max border-collapse w-full">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left text-xs font-medium text-muted-foreground border-b border-r border-border min-w-[140px]">
                  Attribute
                </th>
                {certs.map((cert) => (
                  <th
                    key={cert.slug}
                    className="border-b border-border px-3 py-2 text-left min-w-[200px]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{
                          backgroundColor: getProviderColor(cert.providerSlug),
                        }}
                      />
                      <Link
                        to={`/cert/${cert.slug}`}
                        className="text-sm font-medium text-primary hover:underline truncate"
                      >
                        {cert.shortName ?? cert.name}
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AttributeRow
                label="Provider"
                certs={certs}
                render={(c) => (
                  <span>
                    {getProviderBySlug(c.providerSlug)?.name ?? c.providerSlug}
                  </span>
                )}
              />
              <AttributeRow
                label="Status"
                certs={certs}
                render={(c) => (
                  <Badge
                    variant={
                      c.status === "active"
                        ? "default"
                        : c.status === "retiring"
                          ? "outline"
                          : "destructive"
                    }
                  >
                    {c.status}
                  </Badge>
                )}
              />
              <AttributeRow
                label="Level"
                certs={certs}
                render={(c) => {
                  const level = getCertLevel(c);
                  const label = EXPERIENCE_LEVELS.find(
                    (l) => l.key === level
                  )?.label;
                  return <Badge variant="secondary">{label}</Badge>;
                }}
              />
              <AttributeRow
                label="Cost"
                certs={certs}
                render={(c) => <span>{c.cost ?? "—"}</span>}
                highlightBest={(c) => parseCost(c.cost)}
              />
              <AttributeRow
                label="Exam Format"
                certs={certs}
                render={(c) => (
                  <span className="capitalize">
                    {c.examFormat
                      ? Array.isArray(c.examFormat)
                        ? c.examFormat.join(", ")
                        : c.examFormat
                      : "—"}
                  </span>
                )}
              />
              <AttributeRow
                label="Duration"
                certs={certs}
                render={(c) => (
                  <span>
                    {c.durationMinutes != null
                      ? `${c.durationMinutes} min`
                      : "—"}
                  </span>
                )}
                highlightBest={(c) => c.durationMinutes ?? null}
              />
              <AttributeRow
                label="Questions"
                certs={certs}
                render={(c) => {
                  if (!c.questionCount) return <span>—</span>;
                  const { min, max, approximate } = c.questionCount;
                  return (
                    <span>
                      {approximate ? "~" : ""}
                      {min}
                      {max != null ? `–${max}` : ""}
                    </span>
                  );
                }}
              />
              <AttributeRow
                label="Passing Score"
                certs={certs}
                render={(c) => (
                  <span>
                    {c.passingScore != null ? `${c.passingScore}%` : "—"}
                  </span>
                )}
              />
              <AttributeRow
                label="Prerequisites"
                certs={certs}
                render={(c) =>
                  c.prerequisites.length > 0 ? (
                    <ul className="list-disc pl-4 text-xs space-y-0.5">
                      {c.prerequisites.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-green-600 text-xs">None</span>
                  )
                }
              />
              <AttributeRow
                label="Tags"
                certs={certs}
                render={(c) => (
                  <div className="flex flex-wrap gap-1">
                    {c.tags.slice(0, 5).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                    {c.tags.length > 5 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{c.tags.length - 5}
                      </span>
                    )}
                  </div>
                )}
              />
              <AttributeRow
                label="Top Domains"
                certs={certs}
                render={(c) => (
                  <div className="space-y-1">
                    {c.domains.slice(0, 5).map((d) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <span className="text-xs truncate max-w-[140px]">
                          {d.name}
                        </span>
                        {d.weight != null && (
                          <>
                            <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${d.weight}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {d.weight}%
                            </span>
                          </>
                        )}
                      </div>
                    ))}
                    {c.domains.length > 5 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{c.domains.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              />
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Select up to {MAX_CERTS} certifications to compare side by side. Green
        highlighting indicates the best value for numeric fields. URLs are
        shareable.
      </p>
    </div>
  );
}
