import type { Certification } from "@certuary/data";
import { Checkbox } from "@/components/ui/checkbox";

interface HeldCertsProps {
  certsInPath: Certification[];
  held: Set<string>;
  onToggle: (slug: string) => void;
}

export function HeldCerts({ certsInPath, held, onToggle }: HeldCertsProps) {
  if (certsInPath.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">
        Already held
      </h3>
      <div className="space-y-2">
        {certsInPath.map((cert) => (
          <label
            key={cert.slug}
            className="flex items-center gap-2 text-sm cursor-pointer"
          >
            <Checkbox
              checked={held.has(cert.slug)}
              onCheckedChange={() => onToggle(cert.slug)}
            />
            <span>{cert.shortName ?? cert.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
