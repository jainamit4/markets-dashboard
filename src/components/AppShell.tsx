import { NavLink, Outlet } from "react-router-dom";

export function AppShell() {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <div className="brand-name">Markets Desk</div>
            <div className="brand-sub">Commodities · country indexes · AI economics</div>
          </div>
        </div>
        <nav className="nav" aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Commodities
          </NavLink>
          <NavLink
            to="/indexes"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            Country indexes
          </NavLink>
        </nav>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="foot">
        <p>
          Live series via Yahoo Finance chart API when reachable (proxied in <code>npm run dev</code> /{" "}
          <code>npm run preview</code>). Otherwise the UI falls back to a labeled cached snapshot — never
          presented as a live tick. DRAM and AI energy figures that are not vendor-published are marked
          illustrative. Not investment advice.
        </p>
      </footer>
    </div>
  );
}
