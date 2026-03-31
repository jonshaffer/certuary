import { useParams, Link } from "react-router";
import { getCertBySlug, getProviderById } from "@certuary/data";
import type { CertLink } from "@certuary/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function linkTypeLabel(type: CertLink["type"]): string {
  switch (type) {
    case "official":
      return "Official";
    case "community":
      return "Community";
    case "practice":
      return "Practice";
    case "course":
      return "Course";
    case "source-of-truth":
      return "Source of Truth";
  }
}

export function CertDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const cert = slug ? getCertBySlug(slug) : undefined;

  if (!cert) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-2xl font-bold">Certification not found</h1>
        <Link to="/">
          <Button variant="link" className="mt-4">Back to all certs</Button>
        </Link>
      </div>
    );
  }

  const provider = getProviderById(cert.providerId);
  const currentVersion = cert.versions[0];

  return (
    <div>
      <Link
        to="/"
        className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        &larr; Back to all certs
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {provider?.name ?? cert.providerId}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{cert.name}</h1>
        </div>
        <Badge
          variant={cert.status === "active" ? "default" : cert.status === "retiring" ? "outline" : "destructive"}
          className="mt-2 text-sm"
        >
          {cert.status}
        </Badge>
      </div>

      <p className="mb-6 text-muted-foreground">{cert.description}</p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              {cert.cost && (
                <div>
                  <dt className="font-medium text-muted-foreground">Cost</dt>
                  <dd>{cert.cost}</dd>
                </div>
              )}
              {cert.prerequisites.length > 0 && (
                <div>
                  <dt className="font-medium text-muted-foreground">Prerequisites</dt>
                  <dd>
                    <ul className="list-disc pl-4">
                      {cert.prerequisites.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
              {currentVersion && (
                <div>
                  <dt className="font-medium text-muted-foreground">Current Version</dt>
                  <dd>
                    {currentVersion.version} (released {currentVersion.releaseDate})
                  </dd>
                </div>
              )}
              <div>
                <dt className="font-medium text-muted-foreground">Tags</dt>
                <dd className="flex flex-wrap gap-1 mt-1">
                  {cert.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </dd>
              </div>
              {cert.lastVerified && (
                <div>
                  <dt className="font-medium text-muted-foreground">Data Last Verified</dt>
                  <dd>{cert.lastVerified}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Links & Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {cert.links.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {link.label}
                  </a>
                  <Badge variant="secondary" className="ml-2">
                    {linkTypeLabel(link.type)}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {cert.versions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Version History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cert.versions.map((v) => (
                <div key={v.version} className="border-l-2 border-border pl-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{v.version}</span>
                    <span className="text-sm text-muted-foreground">
                      Released {v.releaseDate}
                    </span>
                    {v.retireDate && (
                      <Badge variant="destructive" className="text-xs">
                        Retired {v.retireDate}
                      </Badge>
                    )}
                  </div>
                  {v.notes && (
                    <p className="mt-1 text-sm text-muted-foreground">{v.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
