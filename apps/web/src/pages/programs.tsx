import { Link } from "react-router";
import { getAllPrograms, getProviderBySlug } from "@certuary/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ProgramsPage() {
  const programs = getAllPrograms();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Programs</h1>
        <p className="mt-2 text-muted-foreground">
          Certification programs and achievement paths.
        </p>
      </div>
      {programs.length === 0 ? (
        <p className="text-muted-foreground">
          No programs available yet. Check back soon.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => {
            const provider = getProviderBySlug(program.providerSlug);
            return (
              <Link
                key={program.slug}
                to={`/programs/${program.slug}`}
                className="group"
              >
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {provider?.name ?? program.providerSlug}
                      </span>
                      <Badge
                        variant={
                          program.status === "active"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {program.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {program.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {program.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline">
                        {program.type === "provider"
                          ? "Provider Program"
                          : program.type === "community"
                            ? "Community"
                            : "Certuary Path"}
                      </Badge>
                      {program.designation && (
                        <Badge variant="default">{program.designation}</Badge>
                      )}
                      <Badge variant="secondary">
                        {program.phases.length} phase
                        {program.phases.length !== 1 && "s"}
                      </Badge>
                      <Badge variant="secondary">
                        {program.requiredCerts.length} cert
                        {program.requiredCerts.length !== 1 && "s"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
