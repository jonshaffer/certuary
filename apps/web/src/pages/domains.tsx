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
        <ul className="space-y-2">
          {certs.map((c) => (
            <li key={c.slug}>
              <span className="font-medium">{c.name}</span>
              <span className="text-muted-foreground">
                {" "}
                — {c.domains.length} domain{c.domains.length !== 1 && "s"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
