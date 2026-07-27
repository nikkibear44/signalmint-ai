import "./App.css";

import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import OpportunityRadar from "./pages/OpportunityRadar";
import AlphaScanner from "./pages/AlphaScanner";
import SmartMoneyPage from "./pages/SmartMoney";
import PortfolioDoctor from "./pages/PortfolioDoctor";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/dashboard" element={<Dashboard />} />

      <Route
        path="/dashboard/opportunity-radar"
        element={<OpportunityRadar />}
      />

      <Route
        path="/dashboard/alpha-scanner"
        element={<AlphaScanner />}
      />

      <Route
        path="/dashboard/smart-money"
        element={<SmartMoneyPage />}
      />

      <Route
        path="/dashboard/portfolio-doctor"
        element={<PortfolioDoctor />}
      />
    </Routes>
  );
}

export default App;
