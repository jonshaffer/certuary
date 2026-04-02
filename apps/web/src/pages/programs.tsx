import { Link } from "react-router";
import { getAllPrograms } from "@certuary/data";

export function ProgramsPage() {
  const programs = getAllPrograms();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Programs</h1>
      {programs.length === 0 ? (
        <p className="text-muted-foreground">
          No programs available yet. Check back soon.
        </p>
      ) : (
        <ul className="space-y-2">
          {programs.map((p) => (
            <li key={p.slug}>
              <Link
                to={`/programs/${p.slug}`}
                className="text-primary hover:underline"
              >
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
