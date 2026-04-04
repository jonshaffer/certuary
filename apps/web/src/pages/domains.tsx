import { Link } from "react-router";
import { getCertsWithDomains } from "@certuary/data";
import type { ExamDomain } from "@certuary/data";

function DomainList({ domains, depth = 0 }: { domains: ExamDomain[]; depth?: number }) {
  return (
    <ul className={`space-y-1 ${depth === 0 ? "ml-4" : "ml-6 mt-1"}`}>
      {domains.map((d) => (
        <li key={d.name}>
          <div className="flex items-baseline justify-between max-w-lg">
            <span className={depth > 0 ? "text-sm text-muted-foreground" : ""}>{d.name}</span>
            {d.weight != null && (
              <span className="text-muted-foreground text-sm ml-2">
                {d.weight}%
              </span>
            )}
          </div>
          {d.subdomains && d.subdomains.length > 0 && (
            <DomainList domains={d.subdomains} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  );
}

export function DomainsPage() {
  const certs = getCertsWithDomains();

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold">Exam Domains</h1>
        <Link
          to="/heatmap"
          className="text-sm text-primary hover:underline"
        >
          View as heatmap &rarr;
        </Link>
      </div>
      {certs.length === 0 ? (
        <p className="text-muted-foreground">
          No certifications with domain data yet. Check back soon.
        </p>
      ) : (
        <div className="space-y-8">
          {certs.map((c) => (
            <div key={c.slug} className="space-y-3">
              <h2 className="text-xl font-semibold">
                <Link
                  to={`/cert/${c.slug}`}
                  className="text-primary hover:underline"
                >
                  {c.name}
                </Link>
              </h2>
              <DomainList domains={c.domains} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
