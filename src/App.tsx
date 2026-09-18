import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { CommoditiesPage } from "./pages/CommoditiesPage";
import { IndexesPage } from "./pages/IndexesPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<CommoditiesPage />} />
          <Route path="/indexes" element={<IndexesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
