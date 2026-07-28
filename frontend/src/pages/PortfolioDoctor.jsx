import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import DashboardLayout from "../layouts/DashboardLayout";
import { useWallet } from "../context/WalletContext";
import { getWalletPortfolio, getEvmPortfolio } from "../services/api";

const CHAINS = [
  { key: "solana", label: "Solana", badgeColor: "#9945FF", badgeLetter: "S" },
  { key: "robinhood", label: "Robinhood Chain", badgeColor: "#00C805", badgeLetter: "R" },
  { key: "stable", label: "Stable Mainnet", badgeColor: "#26A17B", badgeLetter: "$" },
];

function diversificationBadgeClass(diversification) {
  if (diversification === "Diversified") return "pd-badge pd-badge-good";
  if (diversification === "Concentrated") return "pd-badge pd-badge-warn";
  if (diversification === "Highly Concentrated") return "pd-badge pd-badge-bad";
  return "pd-badge";
}

function PortfolioDoctor() {
  const {
    address,
    connecting,
    connect,
    evmAddress,
    connectEvm,
  } = useWallet();

  const [selectedChain, setSelectedChain] = useState("solana");
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEvmChain = selectedChain !== "solana";
  const activeAddress = isEvmChain ? evmAddress : address;

  useEffect(() => {
    setPortfolio(null);
    setError("");

    if (!activeAddress) return;

    async function loadPortfolio() {
      setLoading(true);
      setError("");

      try {
        const res = isEvmChain
          ? await getEvmPortfolio(selectedChain, activeAddress)
          : await getWalletPortfolio(activeAddress);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAddress, selectedChain]);

  return (
    <DashboardLayout>
      <h1>💼 Portfolio Doctor</h1>
      <p style={{ color: "#999", marginBottom: "20px" }}>
        Analyze your connected wallet's real holdings, allocation, and risk
        — across Solana, Robinhood Chain, and Stable Mainnet.
      </p>

      {/* Chain selector */}
      <div className="pd-chain-tabs">
        {CHAINS.map((chain) => (
          <button
            key={chain.key}
            className={`pd-chain-tab ${
              selectedChain === chain.key ? "pd-chain-tab-active" : ""
            }`}
            onClick={() => setSelectedChain(chain.key)}
          >
            <span
              className="pd-chain-dot"
              style={{ background: chain.badgeColor }}
            >
              {chain.badgeLetter}
            </span>
            {chain.label}
          </button>
        ))}
      </div>

      {!activeAddress && (
        <div className="pd-connect-card">
          <h2>🔗 No wallet connected</h2>
          <p>
            {isEvmChain
              ? "Connect your OKX Wallet's EVM account to see a live breakdown of your holdings on this chain."
              : "Connect your OKX Wallet to see a live breakdown of your token holdings and diversification risk."}
          </p>
          <button
            className="pd-connect-btn"
            onClick={isEvmChain ? connectEvm : connect}
            disabled={connecting}
          >
            {connecting ? "Connecting..." : "Connect Wallet"}
          </button>
        </div>
      )}

      {activeAddress && loading && (
        <p style={{ marginTop: "20px" }}>🔄 Analyzing your portfolio...</p>
      )}

      {activeAddress && error && (
        <p style={{ color: "#ff6666", marginTop: "20px" }}>{error}</p>
      )}

      {activeAddress && !loading && portfolio && (
        <>
          <div className="pd-summary-grid">
            <div className="pd-summary-card">
              <div className="pd-summary-label">Total Portfolio Value</div>
              <div className="pd-summary-value">
                $
                {(portfolio.total_value_usd || 0).toLocaleString(undefined, {
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

            {!isEvmChain && (
              <div className="pd-summary-card">
                <div className="pd-summary-label">Diversification</div>
                <span
                  className={diversificationBadgeClass(
                    portfolio.diversification
                  )}
                >
                  {portfolio.diversification}
                </span>
              </div>
            )}

            {!isEvmChain && (
              <div className="pd-summary-card">
                <div className="pd-summary-label">Top Holding</div>
                <div className="pd-summary-value">
                  {portfolio.top_holding_pct}%
                </div>
              </div>
            )}

            {isEvmChain && (
              <div className="pd-summary-card">
                <div className="pd-summary-label">Chain</div>
                <div className="pd-summary-value" style={{ fontSize: "18px" }}>
                  {portfolio.chain}
                </div>
              </div>
            )}
          </div>

          {!isEvmChain && portfolio.risk_note && (
            <div className="pd-risk-note">
              <strong style={{ color: "#2ee6b8" }}>🧠 AI Risk Read: </strong>
              {portfolio.risk_note}
            </div>
          )}

          {isEvmChain && portfolio.note && (
            <div className="pd-risk-note">
              <strong style={{ color: "#2ee6b8" }}>ℹ️ Note: </strong>
              {portfolio.note}
            </div>
          )}

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
              {portfolio.holdings.map((h, index) => (
                <div key={h.mint || h.symbol || index} className="pd-holding-row">
                  <div className="pd-token-cell">
                    <div className="pd-token-icon">
                      {h.symbol?.charAt(0) || "?"}
                    </div>
                    <div>
                      <strong>{h.name || h.symbol}</strong>
                      <div style={{ color: "#888", fontSize: "13px" }}>
                        {h.symbol}
                      </div>
                    </div>
                  </div>

                  <div>
                    {h.amount.toLocaleString(undefined, {
                      maximumFractionDigits: 6,
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
