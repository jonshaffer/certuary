import { useMemo, useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  getAllCerts,
  getAllProviders,
  getProviderBySlug,
} from "@certuary/data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EXPERIENCE_LEVELS, getCertLevel } from "@/lib/experience-levels";
import { Map, GitCompare, Layers, Search, X } from "lucide-react";

const SEARCH_DEBOUNCE_MS = 250;

const ENTRY_POINTS = [
  {
    to: "/path-builder",
    title: "Plan your path",
    description: "Pick targets and we'll resolve the prerequisites.",
    Icon: Map,
  },
  {
    to: "/compare",
    title: "Compare certs",
    description: "Side-by-side breakdown of cost, format, and content.",
    Icon: GitCompare,
  },
  {
    to: "/domains",
    title: "Explore by domain",
    description: "Browse exam topics across providers.",
    Icon: Layers,
  },
];

function useHomeFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const provider = searchParams.get("provider") ?? "";
  const level = searchParams.get("level") ?? "";
  const status = searchParams.get("status") ?? "active";
  const tag = searchParams.get("tag") ?? "";

  const setParam = useCallback(
    (key: string, value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clearAll = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return { q, provider, level, status, tag, setParam, clearAll };
}

export function HomePage() {
  const allCerts = useMemo(() => getAllCerts(), []);
  const providers = useMemo(() => getAllProviders(), []);
  const { q, provider, level, status, tag, setParam, clearAll } =
    useHomeFilters();

  // Local input mirrors the URL but updates instantly while the user types;
  // URL syncs after a short debounce so router re-renders don't fire on
  // every keystroke and history doesn't churn.
  const [searchInput, setSearchInput] = useState(q);
  useEffect(() => {
    setSearchInput(q);
  }, [q]);
  useEffect(() => {
    if (searchInput === q) return;
    const timer = setTimeout(
      () => setParam("q", searchInput),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchInput, q, setParam]);

  // Pre-compute provider name, level, and a lowercased search haystack once
  // so the filter loop stays O(n) without per-cert lookups or string joins.
  const enriched = useMemo(
    () =>
      allCerts.map((cert) => {
        const providerName =
          getProviderBySlug(cert.providerSlug)?.name ?? cert.providerSlug;
        return {
          cert,
          providerName,
          level: getCertLevel(cert),
          searchHaystack: [
            cert.name,
            cert.shortName ?? "",
            providerName,
            ...cert.tags,
          ]
            .join(" ")
            .toLowerCase(),
        };
      }),
    [allCerts],
  );

  const filtered = useMemo(() => {
    const needle = searchInput.trim().toLowerCase();
    return enriched.filter(({ cert, level: certLevel, searchHaystack }) => {
      if (status !== "all" && cert.status !== status) return false;
      if (provider && cert.providerSlug !== provider) return false;
      if (level && certLevel !== level) return false;
      if (tag && !cert.tags.includes(tag)) return false;
      if (needle && !searchHaystack.includes(needle)) return false;
      return true;
    });
  }, [enriched, provider, level, status, tag, searchInput]);

  const hasFilters =
    !!searchInput || !!provider || !!level || status !== "active" || !!tag;

  const toggleTag = useCallback(
    (next: string) => {
      setParam("tag", next === tag ? "" : next);
    },
    [tag, setParam],
  );

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Find your next IT certification
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Browse {allCerts.length} certifications from {providers.length}{" "}
            providers. Plan a learning path, compare options, or explore by
            exam domain.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {ENTRY_POINTS.map(({ to, title, description, Icon }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
            >
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              <div className="mt-2 font-medium transition-colors group-hover:text-primary">
                {title}
              </div>
              <div className="text-sm text-muted-foreground">
                {description}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl font-bold">Browse certifications</h2>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Showing {filtered.length} of {allCerts.length}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1 sm:max-w-md">
            <Search
              className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, provider, or tag..."
              className="w-full rounded border border-border bg-background py-1.5 pl-8 pr-3 text-sm"
              aria-label="Search certifications"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-sm font-medium" htmlFor="filter-provider">
              Provider:
            </label>
            <select
              id="filter-provider"
              className="rounded border border-border bg-background px-2 py-1 text-sm"
              value={provider}
              onChange={(e) => setParam("provider", e.target.value)}
            >
              <option value="">All</option>
              {providers.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-sm font-medium" htmlFor="filter-level">
              Level:
            </label>
            <select
              id="filter-level"
              className="rounded border border-border bg-background px-2 py-1 text-sm"
              value={level}
              onChange={(e) => setParam("level", e.target.value)}
            >
              <option value="">All</option>
              {EXPERIENCE_LEVELS.map((l) => (
                <option key={l.key} value={l.key}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-sm font-medium" htmlFor="filter-status">
              Status:
            </label>
            <select
              id="filter-status"
              className="rounded border border-border bg-background px-2 py-1 text-sm"
              value={status}
              onChange={(e) => setParam("status", e.target.value)}
            >
              <option value="active">Active</option>
              <option value="retiring">Retiring</option>
              <option value="retired">Retired</option>
              <option value="all">All</option>
            </select>
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="gap-1 text-muted-foreground"
            >
              <X className="h-3 w-3" />
              Clear filters
            </Button>
          )}
        </div>

        {tag && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Filtering by tag:</span>
            <Badge variant="default">{tag}</Badge>
            <button
              onClick={() => setParam("tag", "")}
              className="text-xs underline hover:text-foreground"
            >
              clear
            </button>
          </p>
        )}
      </section>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium">
            No certifications match your filters
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try clearing filters or broadening your search.
          </p>
          {hasFilters && (
            <Button
              onClick={clearAll}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              Clear all filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ cert, providerName }) => (
            <Card
              key={cert.slug}
              className="group relative h-full transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {providerName}
                  </span>
                  <Badge
                    variant={
                      cert.status === "active"
                        ? "default"
                        : cert.status === "retiring"
                          ? "outline"
                          : "destructive"
                    }
                  >
                    {cert.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg">
                  <Link
                    to={`/cert/${cert.slug}`}
                    className="transition-colors group-hover:text-primary after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-primary"
                  >
                    {cert.shortName ?? cert.name}
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {cert.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative z-10 flex flex-wrap gap-1">
                  {cert.tags.slice(0, 3).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      aria-label={`Filter by tag ${t}`}
                      aria-pressed={t === tag}
                      className="rounded-full"
                    >
                      <Badge
                        variant={t === tag ? "default" : "secondary"}
                        className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        {t}
                      </Badge>
                    </button>
                  ))}
                </div>
                {cert.cost && (
                  <p className="relative z-10 mt-3 text-sm font-medium">
                    {cert.cost}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
