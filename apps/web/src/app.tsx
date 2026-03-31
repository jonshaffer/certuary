import { Routes, Route } from "react-router";
import { RootLayout } from "./layouts/root-layout";
import { HomePage } from "./pages/home";
import { CertDetailPage } from "./pages/cert-detail";

export function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/cert/:slug" element={<CertDetailPage />} />
      </Route>
    </Routes>
  );
}
