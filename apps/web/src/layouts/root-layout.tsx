import { Link, Outlet } from "react-router";

export function RootLayout() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="text-xl font-bold text-primary">
            Certuary
          </Link>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              Browse Certs
            </Link>
            <Link to="/programs" className="hover:text-foreground transition-colors">
              Programs
            </Link>
            <Link to="/path-builder" className="hover:text-foreground transition-colors">
              Path Builder
            </Link>
            <Link to="/domains" className="hover:text-foreground transition-colors">
              Domains
            </Link>
            <Link to="/heatmap" className="hover:text-foreground transition-colors">
              Heatmap
            </Link>
            <Link to="/network" className="hover:text-foreground transition-colors">
              Network
            </Link>
            <Link to="/graph" className="hover:text-foreground transition-colors">
              Similarity Map
            </Link>
            <Link to="/roadmap" className="hover:text-foreground transition-colors">
              Roadmap
            </Link>
            <Link to="/compare" className="hover:text-foreground transition-colors">
              Compare
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
