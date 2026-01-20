import "./App.css";
import { HashRouter, Routes, Route, NavLink } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import VisualizationPage from "./pages/VisualizationPage";
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
            </nav>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<DashboardPage budget={budget} />} />
          <Route path="/wizualizacja" element={<VisualizationPage budget={budget} />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
