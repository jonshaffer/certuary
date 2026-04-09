import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  getProgramBySlug,
  getCertsByProgram,
  getCertBySlug,
  getProviderBySlug,
} from "@certuary/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parseCost } from "@/lib/costs";
import { programTypeLabels } from "@/lib/program-labels";

export function ProgramDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const program = slug ? getProgramBySlug(slug) : undefined;
  const certs = slug ? getCertsByProgram(slug) : [];
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

  if (!program) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Program not found.</p>
        <Link to="/programs" className="text-primary hover:underline text-sm">
          &larr; Back to Programs
        </Link>
      </div>
    );
  }

  const provider = getProviderBySlug(program.providerSlug);
  const strategies = program.orderingStrategies ?? [];
  const activeStrategy = strategies.find((s) => s.slug === selectedStrategy);
  const activePhases = activeStrategy ? activeStrategy.phases : program.phases;
  const sortedPhases = [...activePhases].sort((a, b) => a.order - b.order);
  const totalCost = certs.reduce((sum, c) => sum + parseCost(c.cost), 0);

  return (
    <div className="space-y-8">
      <Link to="/programs" className="text-primary hover:underline text-sm">
        &larr; Back to Programs
      </Link>

      <div>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {provider?.name ?? program.providerSlug}
        </span>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-3xl font-bold">{program.name}</h1>
          <Badge variant="outline">
            {programTypeLabels[program.type]}
          </Badge>
          <Badge
            variant={program.status === "active" ? "default" : "destructive"}
          >
            {program.status}
          </Badge>
        </div>
        {program.designation && (
          <div className="mt-2">
            <Badge variant="default">{program.designation}</Badge>
          </div>
        )}
        <p className="mt-2 text-muted-foreground">{program.description}</p>
        {program.type === "certuary" && (
          <p className="mt-1 text-xs text-muted-foreground italic">
            This certification path is curated by the Certuary community and is
            not an official program from the provider.
          </p>
        )}
        <a
          href={program.website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-primary hover:underline"
        >
          Official program page &rarr;
        </a>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Completion Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">
                Required Certifications
              </dt>
              <dd>
                {program.completionCriteria.required} certification
                {program.completionCriteria.required !== 1 && "s"}
              </dd>
            </div>
            {program.completionCriteria.notes && (
              <div>
                <dt className="font-medium text-muted-foreground">Notes</dt>
                <dd>{program.completionCriteria.notes}</dd>
              </div>
            )}
            {totalCost > 0 && (
              <div>
                <dt className="font-medium text-muted-foreground">
                  Estimated Total Cost
                </dt>
                <dd>${totalCost.toLocaleString()} USD</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {sortedPhases.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Certification Phases</h2>
            {strategies.length > 1 && (
              <div className="flex gap-1">
                <Button
                  variant={selectedStrategy === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStrategy(null)}
                >
                  Default
                </Button>
                {strategies.map((s) => (
                  <Button
                    key={s.slug}
                    variant={selectedStrategy === s.slug ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStrategy(s.slug)}
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
          {activeStrategy?.description && (
            <p className="text-sm text-muted-foreground">{activeStrategy.description}</p>
          )}
          {sortedPhases.map((phase) => (
            <div key={phase.name} className="space-y-3">
              <h3 className="text-lg font-medium">
                Phase {phase.order}: {phase.name}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({phase.certificateSlugs.length} cert
                  {phase.certificateSlugs.length !== 1 && "s"})
                </span>
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {phase.certificateSlugs.map((certSlug) => {
                  const cert = getCertBySlug(certSlug);
                  if (!cert) {
                    return (
                      <Card key={certSlug}>
                        <CardHeader>
                          <CardTitle className="text-lg">{certSlug}</CardTitle>
                          <CardDescription>
                            Certification data unavailable
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    );
                  }
                  return (
                    <Link
                      key={certSlug}
                      to={`/cert/${cert.slug}`}
                      className="group"
                    >
                      <Card className="h-full transition-shadow hover:shadow-md">
                        <CardHeader>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {cert.shortName ?? cert.name}
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {cert.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-1">
                            {cert.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          {cert.cost && (
                            <p className="mt-3 text-sm font-medium">
                              {cert.cost}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
