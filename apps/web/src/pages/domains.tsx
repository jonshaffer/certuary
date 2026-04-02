import { Link } from "react-router";
import { getCertsWithDomains } from "@certuary/data";

export function DomainsPage() {
  const certs = getCertsWithDomains();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Exam Domains</h1>
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
              <ul className="space-y-1 ml-4">
                {c.domains.map((d) => (
                  <li
                    key={d.name}
                    className="flex items-baseline justify-between max-w-lg"
                  >
                    <span>{d.name}</span>
                    <span className="text-muted-foreground text-sm ml-2">
                      {d.weight}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
