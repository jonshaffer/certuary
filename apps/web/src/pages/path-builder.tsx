import { useState, useMemo, useCallback } from "react";
import {
  getAllCerts,
  getAllProviders,
  getAllPrograms,
  getCertBySlug,
} from "@certuary/data";
import { resolvePath } from "@/lib/path-resolver";
import { CertSelector } from "@/components/path-builder/cert-selector";
import { ProgramShortcuts } from "@/components/path-builder/program-shortcuts";
import { HeldCerts } from "@/components/path-builder/held-certs";
import { PathVisualization } from "@/components/path-builder/path-visualization";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function PathBuilderPage() {
  const certs = getAllCerts();
  const providers = getAllProviders();
  const programs = getAllPrograms();

  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [heldSlugs, setHeldSlugs] = useState<Set<string>>(new Set());
  const [activeCert, setActiveCert] = useState<string | null>(null);

  const resolvedPath = useMemo(
    () => resolvePath(selectedSlugs, heldSlugs),
    [selectedSlugs, heldSlugs],
  );

  // All certs in the expanded path (for the "already held" list)
  const certsInPath = useMemo(() => {
    const allSlugs = new Set([
      ...selectedSlugs,
      ...resolvedPath.ordered.map((e) => e.slug),
    ]);
    return [...allSlugs]
      .map((slug) => getCertBySlug(slug))
      .filter((c) => c !== undefined);
  }, [selectedSlugs, resolvedPath]);

  const toggleCertSelection = useCallback((slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
    // Remove from held if deselected
    setHeldSlugs((prev) => {
      const next = new Set(prev);
      next.delete(slug);
      return next;
    });
  }, []);

  const applyProgram = useCallback((certSlugs: string[]) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      for (const slug of certSlugs) {
        next.add(slug);
      }
      return next;
    });
  }, []);

  const toggleHeld = useCallback((slug: string) => {
    setHeldSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelectedSlugs(new Set());
    setHeldSlugs(new Set());
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Path Builder</h1>
        <p className="mt-2 text-muted-foreground">
          Plan your certification path. Select target certifications and
          prerequisites will be resolved automatically.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* Selection Panel */}
        <aside className="space-y-5">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Target Certifications
            </h2>
            <CertSelector
              certs={certs}
              providers={providers}
              selected={selectedSlugs}
              onToggle={toggleCertSelection}
            />
            {selectedSlugs.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="gap-1 text-muted-foreground"
              >
                <X className="h-3 w-3" />
                Clear all
              </Button>
            )}
          </div>

          <Separator />

          <ProgramShortcuts
            programs={programs}
            providers={providers}
            onApply={applyProgram}
          />

          {certsInPath.length > 0 && (
            <>
              <Separator />
              <HeldCerts
                certsInPath={certsInPath}
                held={heldSlugs}
                onToggle={toggleHeld}
              />
            </>
          )}
        </aside>

        {/* Path Visualization */}
        <main>
          <PathVisualization
            resolvedPath={resolvedPath}
            activeCert={activeCert}
            onHover={setActiveCert}
          />
        </main>
      </div>
    </div>
  );
}
