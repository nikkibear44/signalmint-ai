import "./App.css";

import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import OpportunityRadar from "./pages/OpportunityRadar";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/dashboard" element={<Dashboard />} />

      <Route
        path="/dashboard/opportunity-radar"
        element={<OpportunityRadar />}
      />
    </Routes>
  );
}

export default App;