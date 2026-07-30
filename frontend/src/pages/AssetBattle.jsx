import { useState } from "react";
import ReactMarkdown from "react-markdown";
import DashboardLayout from "../layouts/DashboardLayout";
import { getCompareTokens } from "../services/api";

function AssetBattle() {
  const [token1, setToken1] = useState("");
  const [token2, setToken2] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  const [lastPair, setLastPair] = useState(null);

  async function handleCompare() {
    if (!token1.trim() || !token2.trim()) {
      setError("Please enter both tokens to compare.");
      return;
    }

    setLoading(true);
    setError("");
    setReport("");

    try {
      const data = await getCompareTokens(token1.trim(), token2.trim());
      setReport(data.report || "");
      setLastPair({ token1: token1.trim(), token2: token2.trim() });
    } catch (err) {
      setError("Unable to generate comparison. Please try again.");
    }

    setLoading(false);
  }

  return (
    <DashboardLayout>
      <div className="ab-header">
        <h1>⚔️ Asset Battle</h1>
        <p>
          Compare two crypto assets side by side — market position,
          strengths, weaknesses, and an AI verdict, grounded in live
          verified data.
        </p>
      </div>

      <div className="ab-search-card">
        <h3>Choose Two Assets</h3>

        <div className="ab-search-row">
          <input
            className="ab-search-input"
            type="text"
            placeholder="Token 1 (e.g. Solana)"
            value={token1}
            onChange={(e) => setToken1(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCompare()}
          />

          <div className="ab-vs">VS</div>

          <input
            className="ab-search-input"
            type="text"
            placeholder="Token 2 (e.g. Ethereum)"
            value={token2}
            onChange={(e) => setToken2(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCompare()}
          />

          <button
            className="ab-compare-btn"
            onClick={handleCompare}
            disabled={loading}
          >
            {loading ? "Comparing..." : "Compare"}
          </button>
        </div>

        {error && <p className="ab-error">{error}</p>}
      </div>

      {loading && (
        <div className="ab-loading-card">
          <div className="ab-loading-skeleton" />
          <div className="ab-loading-skeleton" style={{ width: "70%" }} />
          <div className="ab-loading-skeleton" style={{ width: "85%" }} />
          <p className="ab-loading-text">
            Comparing {token1} vs {token2}...
          </p>
        </div>
      )}

      {!loading && report && lastPair && (
        <div className="ab-report-card">
          <div className="ab-report-label">
            ⚔️ {lastPair.token1} vs {lastPair.token2}
          </div>
          <div className="ai-report">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default AssetBattle;
