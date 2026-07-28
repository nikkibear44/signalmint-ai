import { useState } from "react";
import ReactMarkdown from "react-markdown";
import DashboardLayout from "../layouts/DashboardLayout";
import { getDueDiligence } from "../services/api";

function TokenIntelligence() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  const [lastProject, setLastProject] = useState("");

  async function handleGenerate() {
    if (!query.trim()) {
      setError("Please enter a project or token name.");
      return;
    }

    setLoading(true);
    setError("");
    setReport("");

    try {
      const data = await getDueDiligence(query.trim());
      setReport(data.report || "");
      setLastProject(query.trim());
    } catch (err) {
      setError("Unable to generate report. Please try again.");
    }

    setLoading(false);
  }

  return (
    <DashboardLayout>
      <div className="ti-header">
        <h1>🔍 Token Intelligence</h1>
        <p>
          Ask a real question — "Is Uniswap a good long-term hold?", "What's
          Chainlink's biggest risk?" — or just type a project name. Get an
          institutional-grade due diligence report grounded in live verified
          data.
        </p>
      </div>

      <div className="ti-search-card">
        <h3>Ask About Any Project</h3>

        <div className="ti-search-row">
          <input
            className="ti-search-input"
            type="text"
            placeholder="e.g. Is Uniswap a good long-term hold? Or just: Chainlink"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          />

          <button
            className="ti-generate-btn"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>

        {error && <p className="ti-error">{error}</p>}
      </div>

      {loading && (
        <div className="ti-loading-card">
          <div className="ti-loading-skeleton" />
          <div className="ti-loading-skeleton" style={{ width: "70%" }} />
          <div className="ti-loading-skeleton" style={{ width: "85%" }} />
          <p className="ti-loading-text">
            Researching {query} — this can take up to a minute for a full
            institutional-grade report...
          </p>
        </div>
      )}

      {!loading && report && (
        <div className="ti-report-card">
          <div className="ti-report-label">
            📄 Due Diligence Report — {lastProject}
          </div>
          <div className="ai-report">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default TokenIntelligence;
