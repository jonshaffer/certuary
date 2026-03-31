import { Link } from "react-router";
import { getAllCerts, getProviderById } from "@certuary/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function HomePage() {
  const certs = getAllCerts();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">IT Certifications</h1>
        <p className="mt-2 text-muted-foreground">
          Browse and compare IT certifications across providers.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {certs.map((cert) => {
          const provider = getProviderById(cert.providerId);
          return (
            <Link key={cert.slug} to={`/cert/${cert.slug}`} className="group">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {provider?.name ?? cert.providerId}
                    </span>
                    <Badge
                      variant={cert.status === "active" ? "default" : cert.status === "retiring" ? "outline" : "destructive"}
                    >
                      {cert.status}
                    </Badge>
                  </div>
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
                    <p className="mt-3 text-sm font-medium">{cert.cost}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
