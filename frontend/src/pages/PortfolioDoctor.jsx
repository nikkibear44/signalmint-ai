import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import DashboardLayout from "../layouts/DashboardLayout";
import { useWallet } from "../context/WalletContext";
import { getWalletPortfolio } from "../services/api";

function diversificationBadgeClass(diversification) {
  if (diversification === "Diversified") return "pd-badge pd-badge-good";
  if (diversification === "Concentrated") return "pd-badge pd-badge-warn";
  if (diversification === "Highly Concentrated") return "pd-badge pd-badge-bad";
  return "pd-badge";
}

function PortfolioDoctor() {
  const { address, connecting, connect } = useWallet();

  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!address) {
      setPortfolio(null);
      return;
    }

    async function loadPortfolio() {
      setLoading(true);
      setError("");

      try {
        const res = await getWalletPortfolio(address);

        if (res.success) {
          setPortfolio(res.data);
        } else {
          setError(res.message || "Unable to load portfolio.");
        }
      } catch (err) {
        setError("Unable to connect to SignalMint AI.");
      }

      setLoading(false);
    }

    loadPortfolio();
  }, [address]);

  return (
    <DashboardLayout>
      <h1>💼 Portfolio Doctor</h1>
      <p style={{ color: "#999", marginBottom: "10px" }}>
        Analyze your connected wallet's real holdings, allocation, and
        concentration risk.
      </p>

      {!address && (
        <div className="pd-connect-card">
          <h2>🔗 No wallet connected</h2>
          <p>
            Connect your OKX Wallet to see a live breakdown of your token
            holdings and diversification risk.
          </p>
          <button
            className="pd-connect-btn"
            onClick={connect}
            disabled={connecting}
          >
            {connecting ? "Connecting..." : "Connect Wallet"}
          </button>
        </div>
      )}

      {address && loading && (
        <p style={{ marginTop: "20px" }}>🔄 Analyzing your portfolio...</p>
      )}

      {address && error && (
        <p style={{ color: "#ff6666", marginTop: "20px" }}>{error}</p>
      )}

      {address && !loading && portfolio && (
        <>
          <div className="pd-summary-grid">
            <div className="pd-summary-card">
              <div className="pd-summary-label">Total Portfolio Value</div>
              <div className="pd-summary-value">
                ${portfolio.total_value_usd.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>

            <div className="pd-summary-card">
              <div className="pd-summary-label">Holdings</div>
              <div className="pd-summary-value">
                {portfolio.holdings_count}
              </div>
            </div>

            <div className="pd-summary-card">
              <div className="pd-summary-label">Diversification</div>
              <span className={diversificationBadgeClass(portfolio.diversification)}>
                {portfolio.diversification}
              </span>
            </div>

            <div className="pd-summary-card">
              <div className="pd-summary-label">Top Holding</div>
              <div className="pd-summary-value">
                {portfolio.top_holding_pct}%
              </div>
            </div>
          </div>

          <div className="pd-risk-note">
            <strong style={{ color: "#2ee6b8" }}>🧠 AI Risk Read: </strong>
            {portfolio.risk_note}
          </div>

          {portfolio.ai_narrative && (
            <div className="pd-narrative-card">
              <div className="pd-narrative-label">
                📝 AI Portfolio Advice
              </div>
              <div className="ai-report">
                <ReactMarkdown>{portfolio.ai_narrative}</ReactMarkdown>
              </div>
            </div>
          )}

          {portfolio.holdings.length === 0 ? (
            <div className="pd-holdings">
              <div className="pd-empty">
                No holdings above the dust threshold were found in this
                wallet.
              </div>
            </div>
          ) : (
            <div className="pd-holdings">
              {portfolio.holdings.map((h) => (
                <div key={h.mint} className="pd-holding-row">
                  <div className="pd-token-cell">
                    <div className="pd-token-icon">
                      {h.symbol?.charAt(0) || "?"}
                    </div>
                    <div>
                      <strong>{h.name}</strong>
                      <div style={{ color: "#888", fontSize: "13px" }}>
                        {h.symbol}
                      </div>
                    </div>
                  </div>

                  <div>
                    {h.amount.toLocaleString(undefined, {
                      maximumFractionDigits: 4,
                    })}
                  </div>

                  <div>
                    {h.price_unavailable
                      ? "Price unavailable"
                      : `$${h.value_usd.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}`}
                  </div>

                  <div>
                    {h.allocation_pct}%
                    <div className="pd-allocation-bar-track">
                      <div
                        className="pd-allocation-bar-fill"
                        style={{ width: `${h.allocation_pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

export default PortfolioDoctor;
