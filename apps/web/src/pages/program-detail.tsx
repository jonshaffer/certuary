import { Link, useParams } from "react-router";
import { getProgramBySlug } from "@certuary/data";

export function ProgramDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const program = slug ? getProgramBySlug(slug) : undefined;

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

  return (
    <div className="space-y-6">
      <Link to="/programs" className="text-primary hover:underline text-sm">
        &larr; Back to Programs
      </Link>
      <h1 className="text-3xl font-bold">{program.name}</h1>
      <p className="text-muted-foreground">{program.description}</p>
    </div>
  );
}
