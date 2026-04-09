import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="mt-4 inline-block text-primary hover:underline"
      >
        Back to all certs
      </Link>
    </div>
  );
}
