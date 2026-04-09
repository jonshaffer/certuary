import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { Menu, X } from "lucide-react";

const navLinks = [
  { to: "/", label: "Browse Certs" },
  { to: "/programs", label: "Programs" },
  { to: "/path-builder", label: "Path Builder" },
  { to: "/domains", label: "Domains" },
  { to: "/heatmap", label: "Heatmap" },
  { to: "/network", label: "Network" },
  { to: "/graph", label: "Similarity Map" },
  { to: "/roadmap", label: "Roadmap" },
  { to: "/compare", label: "Compare" },
];

export function RootLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="text-xl font-bold text-primary">
            Certuary
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-4 text-sm text-muted-foreground">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile nav dropdown */}
        {menuOpen && (
          <nav className="md:hidden border-t border-border bg-card px-4 pb-4">
            <div className="flex flex-col gap-2 pt-2">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm transition-colors ${
                    location.pathname === to
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
