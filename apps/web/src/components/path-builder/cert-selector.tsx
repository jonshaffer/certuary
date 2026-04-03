import { useState } from "react";
import type { Certification, Provider } from "@certuary/data";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CertSelectorProps {
  certs: Certification[];
  providers: Provider[];
  selected: Set<string>;
  onToggle: (slug: string) => void;
}

export function CertSelector({
  certs,
  providers,
  selected,
  onToggle,
}: CertSelectorProps) {
  const [open, setOpen] = useState(false);

  // Group certs by provider
  const providerMap = new Map(providers.map((p) => [p.slug, p]));
  const grouped = new Map<string, Certification[]>();
  for (const cert of certs) {
    const group = grouped.get(cert.providerSlug) ?? [];
    group.push(cert);
    grouped.set(cert.providerSlug, group);
  }

  // Sort provider keys alphabetically by provider name
  const sortedProviderSlugs = [...grouped.keys()].sort((a, b) => {
    const nameA = providerMap.get(a)?.name ?? a;
    const nameB = providerMap.get(b)?.name ?? b;
    return nameA.localeCompare(nameB);
  });

  const count = selected.size;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {count === 0
            ? "Select certifications..."
            : `${count} certification${count !== 1 ? "s" : ""} selected`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0">
        <Command>
          <CommandInput placeholder="Search certifications..." />
          <CommandList>
            <CommandEmpty>No certifications found.</CommandEmpty>
            {sortedProviderSlugs.map((providerSlug) => {
              const providerName =
                providerMap.get(providerSlug)?.name ?? providerSlug;
              const providerCerts = grouped.get(providerSlug) ?? [];
              return (
                <CommandGroup key={providerSlug} heading={providerName}>
                  {providerCerts.map((cert) => {
                    const isSelected = selected.has(cert.slug);
                    return (
                      <CommandItem
                        key={cert.slug}
                        value={`${cert.name} ${cert.shortName ?? ""} ${cert.tags.join(" ")}`}
                        onSelect={() => onToggle(cert.slug)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="truncate">
                          {cert.shortName ?? cert.name}
                        </span>
                        {cert.shortName && (
                          <span className="ml-1 truncate text-xs text-muted-foreground">
                            {cert.name}
                          </span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
