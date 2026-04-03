import { useMemo } from "react";
import { Link } from "react-router";
import { getCertBySlug, getProviderBySlug } from "@certuary/data";
import { parseCost } from "@/lib/costs";
import type { ResolvedPath } from "@/lib/path-resolver";
import { getTransitivePrerequisites, getTransitiveDependents } from "@/lib/path-resolver";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Route } from "lucide-react";
import { cn } from "@/lib/utils";

interface PathVisualizationProps {
  resolvedPath: ResolvedPath;
  activeCert: string | null;
  onHover: (slug: string | null) => void;
}

export function PathVisualization({
  resolvedPath,
  activeCert,
  onHover,
}: PathVisualizationProps) {
  const { ordered, totalCost, cycleDetected } = resolvedPath;

  if (ordered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Route className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="text-lg font-medium">No certifications selected</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Select certifications or use a program shortcut to build your study
          path.
        </p>
      </div>
    );
  }

  // Compute cumulative cost per step
  const cumulativeCosts = useMemo(() => {
    let running = 0;
    return ordered.map((entry) => {
      const cert = getCertBySlug(entry.slug);
      running += parseCost(cert?.cost);
      return running;
    });
  }, [ordered]);

  // Compute which slugs are related to the hovered cert (transitive chains)
  const pathSlugs = new Set(ordered.map((e) => e.slug));
  const highlightedSlugs = new Set<string>();
  if (activeCert) {
    highlightedSlugs.add(activeCert);
    for (const s of getTransitivePrerequisites(activeCert, pathSlugs)) {
      highlightedSlugs.add(s);
    }
    for (const s of getTransitiveDependents(activeCert, pathSlugs)) {
      highlightedSlugs.add(s);
    }
  }

  return (
    <div className="space-y-4">
      {cycleDetected && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          A circular dependency was detected in the prerequisite graph. The
          ordering below may not be fully correct.
        </div>
      )}

      <div className="relative space-y-0">
        {ordered.map((entry, index) => {
          const cert = getCertBySlug(entry.slug);
          if (!cert) return null;
          const provider = getProviderBySlug(cert.providerSlug);

          const isActive = activeCert === entry.slug;
          const isHighlighted = highlightedSlugs.has(entry.slug);
          const isDimmed = activeCert !== null && !isHighlighted;

          return (
            <div key={entry.slug} className="relative flex gap-4">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    entry.isAutoAdded
                      ? "border-2 border-dashed border-muted-foreground/40 text-muted-foreground"
                      : "bg-primary text-primary-foreground",
                    isActive && "ring-2 ring-ring ring-offset-2",
                  )}
                >
                  {index + 1}
                </div>
                {index < ordered.length - 1 && (
                  <div className="w-px flex-1 bg-border min-h-4" />
                )}
              </div>

              {/* Card */}
              <div className="flex-1 pb-4">
                <Link to={`/cert/${cert.slug}`} className="group block">
                  <Card
                    className={cn(
                      "transition-all",
                      entry.isAutoAdded && "border-dashed",
                      isDimmed && "opacity-40",
                      isActive && "shadow-md",
                      !isDimmed && "hover:shadow-md",
                    )}
                    onMouseEnter={() => onHover(entry.slug)}
                    onMouseLeave={() => onHover(null)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {provider?.name ?? cert.providerSlug}
                        </span>
                        {entry.isAutoAdded && entry.requiredBy.length > 0 && (
                          <Badge variant="outline" className="text-[10px]">
                            Required by{" "}
                            {entry.requiredBy
                              .map((s) => {
                                const c = getCertBySlug(s);
                                return c?.shortName ?? c?.name ?? s;
                              })
                              .join(", ")}
                          </Badge>
                        )}
                        <Badge
                          variant={
                            cert.status === "active"
                              ? "default"
                              : cert.status === "retiring"
                                ? "outline"
                                : "destructive"
                          }
                          className="ml-auto"
                        >
                          {cert.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-base group-hover:text-primary transition-colors">
                        {cert.shortName ?? cert.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-1 text-xs">
                        {cert.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {cert.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        {(cert.cost || cumulativeCosts[index] > 0) && (
                          <span className="text-right text-sm">
                            {cert.cost && (
                              <span className="font-medium">{cert.cost}</span>
                            )}
                            <span className="ml-2 text-xs text-muted-foreground">
                              (${cumulativeCosts[index].toLocaleString()} total)
                            </span>
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cost summary */}
      {totalCost > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Estimated Total Cost
            </span>
            <span className="text-lg font-bold">
              ${totalCost.toLocaleString()} USD
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {ordered.length} certification{ordered.length !== 1 ? "s" : ""} in
            your path
          </p>
        </div>
      )}
    </div>
  );
}
