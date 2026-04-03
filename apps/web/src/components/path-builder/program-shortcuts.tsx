import type { Program, Provider } from "@certuary/data";
import { getCertsByProgram } from "@certuary/data";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface ProgramShortcutsProps {
  programs: Program[];
  providers: Provider[];
  onApply: (certSlugs: string[]) => void;
}

export function ProgramShortcuts({
  programs,
  providers,
  onApply,
}: ProgramShortcutsProps) {
  const providerMap = new Map(providers.map((p) => [p.slug, p]));

  if (programs.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">
        Quick-fill from program
      </h3>
      <div className="flex flex-wrap gap-2">
        {programs.map((program) => {
          const provider = providerMap.get(program.providerSlug);
          const certs = getCertsByProgram(program.slug);
          return (
            <Button
              key={program.slug}
              variant="outline"
              size="sm"
              onClick={() => onApply(certs.map((c) => c.slug))}
              className="gap-1"
            >
              <span className="text-xs text-muted-foreground">
                {provider?.name}
              </span>
              {program.name}
              <ArrowRight className="h-3 w-3" />
            </Button>
          );
        })}
      </div>
    </div>
  );
}
