import { Link, useParams } from "react-router";
import { getProgramBySlug, getCertsByProgram } from "@certuary/data";

export function ProgramDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const program = slug ? getProgramBySlug(slug) : undefined;
  const certs = slug ? getCertsByProgram(slug) : [];

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

  const sortedPhases = [...program.phases].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <Link to="/programs" className="text-primary hover:underline text-sm">
        &larr; Back to Programs
      </Link>
      <h1 className="text-3xl font-bold">{program.name}</h1>
      <p className="text-muted-foreground">{program.description}</p>

      {sortedPhases.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Phases</h2>
          <ol className="space-y-2 ml-4 list-decimal list-inside">
            {sortedPhases.map((phase) => (
              <li key={phase.name}>
                <span className="font-medium">{phase.name}</span>
                {phase.certificateSlugs.length > 0 && (
                  <span className="text-muted-foreground text-sm">
                    {" "}
                    ({phase.certificateSlugs.length} cert
                    {phase.certificateSlugs.length !== 1 && "s"})
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {certs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Required Certifications</h2>
          <ul className="space-y-1 ml-4 list-disc list-inside">
            {certs.map((c) => (
              <li key={c.slug}>
                <Link
                  to={`/cert/${c.slug}`}
                  className="text-primary hover:underline"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Completion Criteria</h2>
        <p>
          <span className="font-medium">{program.completionCriteria.required}</span>{" "}
          certification{program.completionCriteria.required !== 1 && "s"} required
        </p>
        {program.completionCriteria.notes && (
          <p className="text-muted-foreground text-sm">
            {program.completionCriteria.notes}
          </p>
        )}
      </section>
    </div>
  );
}
