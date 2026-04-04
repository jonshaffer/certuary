import { Routes, Route } from "react-router";
import { RootLayout } from "./layouts/root-layout";
import { HomePage } from "./pages/home";
import { CertDetailPage } from "./pages/cert-detail";
import { ProgramsPage } from "./pages/programs";
import { ProgramDetailPage } from "./pages/program-detail";
import { PathBuilderPage } from "./pages/path-builder";
import { DomainsPage } from "./pages/domains";
import { GraphPage } from "./pages/graph";
import { HeatmapPage } from "./pages/heatmap";
import { NetworkPage } from "./pages/network";

export function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/cert/:slug" element={<CertDetailPage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/programs/:slug" element={<ProgramDetailPage />} />
        <Route path="/path-builder" element={<PathBuilderPage />} />
        <Route path="/domains" element={<DomainsPage />} />
        <Route path="/graph" element={<GraphPage />} />
        <Route path="/heatmap" element={<HeatmapPage />} />
        <Route path="/network" element={<NetworkPage />} />
      </Route>
    </Routes>
  );
}
