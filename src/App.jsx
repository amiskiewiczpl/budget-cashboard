import "./App.css";
import { HashRouter, Routes, Route, NavLink } from "react-router-dom";
import DashboardGlass from "./pages/glass/DashboardPage";
import VisualizationGlass from "./pages/glass/VisualizationPage";
import PlanPage from "./pages/plan/PlanPage";
import useBudgetState from "./utils/useBudgetState";

export default function App() {
  const budget = useBudgetState();

  return (
    <HashRouter>
      <div className="app">
        <header className="topbar">
          <div className="topbar__inner">
            <div className="brand">
              <div className="brand__dot" />
              <div>
                <h1 className="brand__title">Budget Cashboard</h1>
                <p className="brand__subtitle">Koperty + przeciąganie „prawdziwych” pieniędzy</p>
              </div>
            </div>

            <nav className="nav">
              <NavLink className={({ isActive }) => `navLink ${isActive ? "navLink--active" : ""}`} to="/">
                Dashboard
              </NavLink>
              <NavLink className={({ isActive }) => `navLink ${isActive ? "navLink--active" : ""}`} to="/wizualizacja">
                Wizualizacja
              </NavLink>
              <NavLink className={({ isActive }) => `navLink ${isActive ? "navLink--active" : ""}`} to="/plan">
                Plan
              </NavLink>
            </nav>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<DashboardGlass budget={budget} />} />
          <Route path="/wizualizacja" element={<VisualizationGlass budget={budget} />} />
          <Route path="/plan" element={<PlanPage />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
