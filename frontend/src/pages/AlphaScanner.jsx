import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DashboardLayout from "../layouts/DashboardLayout";
import { getAlphaScanner, getPortfolioBuilder, getHiddenAlpha } from "../services/api";
import TokenDetailModal from "../components/TokenDetailModal";
import SignalLoader from "../components/SignalLoader";

function getRecommendation(score) {
  if (score >= 90) {
    return { text: "🟢 STRONG BUY", color: "#2ee6b8" };
  }

  if (score >= 80) {
    return { text: "🟡 BUY", color: "#ffd166" };
  }

  if (score >= 70) {
    return { text: "🔵 WATCHLIST", color: "#58a6ff" };
  }

  return { text: "🔴 HIGH RISK", color: "#ff6666" };
}

function scoreGradient(score) {
  if (score >= 90) return "linear-gradient(135deg,#2ee6b8,#1dbf9f)";
  if (score >= 80) return "linear-gradient(135deg,#ffd166,#ffb703)";
  return "linear-gradient(135deg,#58a6ff,#3b82f6)";
}

function scoreBorder(score) {
  if (score >= 90) return "2px solid #2ee6b8";
  if (score >= 80) return "2px solid #ffd166";
  return "2px solid #58a6ff";
}

function cardBorder(score) {
  if (score >= 90) return "2px solid #2ee6b8";
  if (score >= 80) return "2px solid #ffd166";
  return "1px solid #222";
}

function riskStyle(risk) {
  if (risk === "Low") return { background: "#1f4d3a", color: "#2ee6b8" };
  if (risk === "Medium") return { background: "#4d4420", color: "#ffd166" };
  return { background: "#4d1f1f", color: "#ff6666" };
}

const RISK_OPTIONS = [
  { value: "low", label: "Low Risk" },
  { value: "medium", label: "Medium Risk" },
  { value: "high", label: "High Risk" },
];

function buildAllocationExecutionInstruction(allocation) {
  return `I'd like to execute a trade based on this AI-generated portfolio allocation from SignalMint AI.

Token: ${allocation.name} (${allocation.symbol})
Allocation: ${allocation.allocation_pct}% of portfolio
Amount: ~$${allocation.allocation_usd} USDT0
Current Price: $${allocation.price}
AI Score: ${allocation.ai_score}
Risk: ${allocation.risk}
Reason: ${allocation.catalyst}

Please check whether ${allocation.symbol} and its chain are supported by OKX DEX before proceeding. If supported, use the OKX Agent Payments Protocol / OKX DEX to execute this swap on my behalf, using my own connected wallet. Confirm the trade details with me before signing anything. If ${allocation.symbol} or its chain is not supported by OKX DEX, let me know instead of attempting the trade.`;
}

function AlphaScanner() {
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState([]);
  const [error, setError] = useState("");
  const [selectedCoin, setSelectedCoin] = useState(null);

  // Portfolio builder state
  const [budget, setBudget] = useState("5000");
  const [riskTolerance, setRiskTolerance] = useState("medium");
  const [buildLoading, setBuildLoading] = useState(false);
  const [buildResult, setBuildResult] = useState(null);
  const [buildError, setBuildError] = useState("");
  const [expandedExecution, setExpandedExecution] = useState(null);
  const [copiedExecution, setCopiedExecution] = useState(null);

  // Hidden Alpha state
  const [hiddenAlpha, setHiddenAlpha] = useState(null);
  const [hiddenAlphaLoading, setHiddenAlphaLoading] = useState(true);
  const [hiddenAlphaError, setHiddenAlphaError] = useState("");

  async function loadScanner() {
    try {
      setLoading(true);

      const data = await getAlphaScanner();

      setCoins(data.results || []);
      setError("");
    } catch (err) {
      setError("Unable to load Alpha Scanner.");
    }

    setLoading(false);
  }

  async function handleBuildPortfolio() {
    const amount = Number(budget);

    if (!amount || amount <= 0) {
      setBuildError("Please enter a valid budget amount.");
      return;
    }

    setBuildLoading(true);
    setBuildError("");
    setBuildResult(null);
    setExpandedExecution(null);
    setCopiedExecution(null);

    try {
      const data = await getPortfolioBuilder(amount, riskTolerance);

      if (data.success) {
        setBuildResult(data);
      } else {
        setBuildError(data.message || "Unable to build portfolio allocation.");
      }
    } catch (err) {
      setBuildError("Unable to connect to SignalMint AI.");
    }

    setBuildLoading(false);
  }

  async function loadHiddenAlpha() {
    setHiddenAlphaLoading(true);
    setHiddenAlphaError("");

    try {
      const data = await getHiddenAlpha();

      if (data.success) {
        setHiddenAlpha(data);
      } else {
        setHiddenAlphaError(data.message || "Unable to load Hidden Alpha.");
      }
    } catch (err) {
      setHiddenAlphaError("Unable to connect to SignalMint AI.");
    }

    setHiddenAlphaLoading(false);
  }

  useEffect(() => {
    loadScanner();
    loadHiddenAlpha();
  }, []);

  return (
    <DashboardLayout>
      <div className="as-wrap">
        {/* Header + refresh button, side by side */}
        <div className="as-topbar">
          <div>
            <h1>🚀 AI Alpha Scanner</h1>
            <p>
              Scan the crypto market with AI to discover today's
              highest-conviction opportunities using live market data and
              intelligent ranking.
            </p>
          </div>

          <button
            className="as-refresh-btn"
            onClick={loadScanner}
            disabled={loading}
          >
            {loading ? "🔄 Refreshing..." : "🔄 Refresh Analysis"}
          </button>
        </div>

        {/* Stat cards - all same height now */}
        <div className="as-stats-grid">
          <div className="as-stat-card">
            <div className="as-stat-label">🔥 Tokens Scanned</div>
            <div className="as-stat-value">{coins.length}</div>
          </div>

          <div className="as-stat-card">
            <div className="as-stat-label">🤖 AI Picks</div>
            <div className="as-stat-value">Top {coins.length}</div>
          </div>

          <div className="as-stat-card">
            <div className="as-stat-label">⚡ Data Source</div>
            <div className="as-stat-value">CoinGecko + AI</div>
          </div>

          <div className="as-stat-card">
            <div className="as-stat-label">🟢 Status</div>
            <div className="as-stat-value">Live</div>
          </div>
        </div>

        {/* Portfolio Builder */}
        <div className="pb-card">
          <h3>💰 What Should I Buy With $X?</h3>
          <p className="pb-sub">
            Give SignalMint a budget and risk tolerance — it'll allocate
            across today's top-ranked opportunities and explain why.
          </p>

          <div className="pb-inputs-row">
            <div className="pb-input-group">
              <label>Budget (USD)</label>
              <input
                type="number"
                className="pb-input"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                min="1"
              />
            </div>

            <div className="pb-input-group">
              <label>Risk Tolerance</label>
              <div className="pb-risk-pills">
                {RISK_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`pb-risk-pill ${
                      riskTolerance === opt.value ? "pb-risk-pill-active" : ""
                    }`}
                    onClick={() => setRiskTolerance(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="pb-build-btn"
              onClick={handleBuildPortfolio}
              disabled={buildLoading}
            >
              {buildLoading ? "Building..." : "Build My Portfolio"}
            </button>
          </div>

          {buildError && <p className="pb-error">{buildError}</p>}

          {buildLoading && (
            <SignalLoader text="Scanning opportunities and building your allocation..." />
          )}

          {!buildLoading && buildResult && (
            <div className="pb-results">
              <div className="pb-strategy-card">
                <div className="pb-strategy-header">
                  <span className="pb-strategy-check">✅</span>
                  <span>Strategy Ready</span>
                </div>

                <div className="pb-strategy-grid">
                  <div className="pb-strategy-cell">
                    <span>Budget</span>
                    <strong>${Number(buildResult.budget).toLocaleString()}</strong>
                  </div>
                  <div className="pb-strategy-cell">
                    <span>Risk</span>
                    <strong style={{ textTransform: "capitalize" }}>
                      {buildResult.risk_tolerance}
                    </strong>
                  </div>
                  <div className="pb-strategy-cell">
                    <span>Expected Horizon</span>
                    <strong>{buildResult.expected_horizon}</strong>
                  </div>
                  <div className="pb-strategy-cell">
                    <span>AI Confidence</span>
                    <strong>
                      {buildResult.ai_confidence != null
                        ? `${buildResult.ai_confidence}%`
                        : "N/A"}
                    </strong>
                  </div>
                  <div className="pb-strategy-cell">
                    <span>Status</span>
                    <strong className="pb-strategy-status">
                      Ready to Execute
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pb-allocation-grid">
                {buildResult.allocations.map((a) => (
                  <div key={a.symbol} className="pb-allocation-card">
                    <div className="pb-allocation-header">
                      <strong>{a.name}</strong>
                      <span className="pb-allocation-symbol">{a.symbol}</span>
                    </div>
                    <div className="pb-allocation-pct">{a.allocation_pct}%</div>
                    <div className="pb-allocation-usd">
                      ${a.allocation_usd.toLocaleString()}
                    </div>
                    <div className="pb-allocation-bar-track">
                      <div
                        className="pb-allocation-bar-fill"
                        style={{ width: `${a.allocation_pct}%` }}
                      />
                    </div>
                    <div className="pb-allocation-meta">
                      <span>AI Score {a.ai_score}</span>
                      <span>{a.risk} Risk</span>
                    </div>

                    <button
                      className="pb-execute-btn"
                      onClick={() =>
                        setExpandedExecution(
                          expandedExecution === a.symbol ? null : a.symbol
                        )
                      }
                    >
                      🚀{" "}
                      {expandedExecution === a.symbol
                        ? "Hide Execution"
                        : "Prepare Execution"}
                    </button>

                    {expandedExecution === a.symbol && (
                      <div className="pb-execute-box">
                        <div className="pb-execute-intro">
                          I'd like to execute a trade based on this
                          AI-generated portfolio allocation from SignalMint
                          AI.
                        </div>

                        <div className="pb-execute-row">
                          <span className="pb-execute-label">Token</span>
                          <span className="pb-execute-value">
                            {a.name} ({a.symbol})
                          </span>
                        </div>
                        <div className="pb-execute-row">
                          <span className="pb-execute-label">Allocation</span>
                          <span className="pb-execute-value">
                            {a.allocation_pct}% of portfolio
                          </span>
                        </div>
                        <div className="pb-execute-row">
                          <span className="pb-execute-label">Amount</span>
                          <span className="pb-execute-value">
                            ~${a.allocation_usd} USDT0
                          </span>
                        </div>
                        <div className="pb-execute-row">
                          <span className="pb-execute-label">
                            Current Price
                          </span>
                          <span className="pb-execute-value">
                            ${a.price}
                          </span>
                        </div>
                        <div className="pb-execute-row">
                          <span className="pb-execute-label">AI Score</span>
                          <span className="pb-execute-value">
                            {a.ai_score}
                          </span>
                        </div>
                        <div className="pb-execute-row">
                          <span className="pb-execute-label">Risk</span>
                          <span className="pb-execute-value">{a.risk}</span>
                        </div>
                        <div className="pb-execute-row">
                          <span className="pb-execute-label">Reason</span>
                          <span className="pb-execute-value">
                            {a.catalyst}
                          </span>
                        </div>

                        <div className="pb-execute-instruction">
                          Please check whether {a.symbol} and its chain are
                          supported by OKX DEX before proceeding. If
                          supported, use the OKX Agent Payments Protocol /
                          OKX DEX to execute this swap on my behalf, using
                          my own connected wallet. Confirm the trade
                          details with me before signing anything.
                        </div>

                        <button
                          className="pb-copy-btn"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              buildAllocationExecutionInstruction(a)
                            );
                            setCopiedExecution(a.symbol);
                            setTimeout(() => setCopiedExecution(null), 2000);
                          }}
                        >
                          {copiedExecution === a.symbol
                            ? "✓ Copied"
                            : "📋 Copy Instruction"}
                        </button>
                        <p className="pb-execute-disclaimer">
                          SignalMint AI does not hold funds or execute
                          trades itself. This copies a ready-to-send
                          instruction for your own agent to execute using
                          your own connected wallet.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pb-narrative">
                <div className="ai-report">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {buildResult.narrative}
                  </ReactMarkdown>
                </div>
              </div>

              <p className="pb-disclaimer">
                This is not financial advice. Allocations are based on
                current AI Opportunity Scores, which change as market
                conditions change.
              </p>
            </div>
          )}
        </div>

        {/* Hidden Alpha */}
        <div className="ha-card">
          <div className="ha-header">
            <h3>🔍 Hidden Alpha — Overlooked Opportunities</h3>
            <span className="ha-badge">EXPERIMENTAL</span>
          </div>
          <p className="ha-sub">
            Ranked by real whale buying volume across Solana and Robinhood
            Chain — tokens don't need to be tracked by Alpha Scanner to
            show up here. AI Score and market cap appear when available as
            bonus context, not as a requirement. Twitter followers (where
            available) are a community size indicator, not real-time
            attention.
          </p>

          {hiddenAlphaLoading && (
            <SignalLoader text="Cross-referencing AI signals with real whale activity..." />
          )}

          {!hiddenAlphaLoading && hiddenAlphaError && (
            <p className="pb-error">{hiddenAlphaError}</p>
          )}

          {!hiddenAlphaLoading && hiddenAlpha && (
            <>
              {hiddenAlpha.results.length === 0 ? (
                <div className="ha-empty">
                  No tokens currently show real tracked whale buying right
                  now. This changes as whale activity happens — check back
                  later.
                </div>
              ) : (
                <div className="ha-grid">
                  {hiddenAlpha.results.map((r) => (
                    <div key={r.symbol} className="ha-item-card">
                      <div className="ha-item-header">
                        <strong>{r.name}</strong>
                        <span className="ha-item-symbol">{r.symbol}</span>
                      </div>
                      {r.ai_score != null ? (
                        <div className="ha-item-score">
                          Signal: {r.ai_score}
                        </div>
                      ) : (
                        <div className="ha-item-score ha-item-score-none">
                          Not scored by Alpha Scanner
                        </div>
                      )}
                      <div className="ha-item-whale">
                        🐋 {r.whale_buy_wallets} wallet(s) bought $
                        {r.whale_buy_usd.toLocaleString()} on{" "}
                        {r.whale_chains.join(", ")}
                      </div>
                      {r.market_cap ? (
                        <div className="ha-item-cap">
                          Market Cap: ${(r.market_cap / 1e6).toFixed(1)}M
                        </div>
                      ) : (
                        <div className="ha-item-cap">Market Cap: N/A</div>
                      )}
                      {r.twitter_followers != null && (
                        <div className="ha-item-social">
                          𝕏 {r.twitter_followers.toLocaleString()} followers
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {hiddenAlpha.narrative && (
                <div className="ha-narrative">
                  <div className="ai-report">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {hiddenAlpha.narrative}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {loading && <SignalLoader text="Running AI scan across today's market..." />}

        {error && <p style={{ color: "#ff6666" }}>{error}</p>}

        {!loading && (
          <div className="as-cards-grid">
            {coins.map((coin) => {
              const rec = getRecommendation(coin.ai_score);
              const risk = riskStyle(coin.risk);

              return (
                <div
                  key={coin.symbol}
                  className="as-card"
                  style={{ border: cardBorder(coin.ai_score) }}
                  onClick={() => setSelectedCoin(coin)}
                >
                  <div className="as-card-top">
                    <div style={{ flex: 1 }}>
                      <div className="as-card-title-row">
                        <span style={{ fontSize: 26 }}>
                          {coin.rank === 1
                            ? "🥇"
                            : coin.rank === 2
                            ? "🥈"
                            : coin.rank === 3
                            ? "🥉"
                            : `#${coin.rank}`}
                        </span>
                        <h2>{coin.name}</h2>
                      </div>
                      <div className="as-card-symbol">{coin.symbol}</div>
                    </div>

                    <div
                      className="as-score-panel"
                      style={{ border: scoreBorder(coin.ai_score) }}
                    >
                      <div
                        className="as-score-top"
                        style={{ background: scoreGradient(coin.ai_score) }}
                      >
                        <div className="as-score-label">AI SCORE</div>
                        <div className="as-score-value">{coin.ai_score}</div>
                      </div>

                      <div
                        className="as-score-bottom"
                        style={{ color: rec.color }}
                      >
                        {rec.text}
                      </div>
                    </div>
                  </div>

                  <div className="as-pill-row">
                    <div className="as-pill">
                      🎯 {coin.confidence}% Confidence
                    </div>

                    <div
                      className="as-pill"
                      style={{
                        background: risk.background,
                        color: risk.color,
                        fontWeight: 600,
                      }}
                    >
                      ⚠️ {coin.risk} Risk
                    </div>
                  </div>

                  <hr className="as-divider" />

                  <div className="as-metric-grid">
                    <div className="as-metric-cell">
                      <div className="as-metric-label">Price</div>
                      <strong>
                        $
                        {Number(coin.price).toLocaleString(undefined, {
                          maximumFractionDigits: 6,
                        })}
                      </strong>
                    </div>

                    <div className="as-metric-cell">
                      <div className="as-metric-label">24h</div>
                      <strong
                        style={{
                          color:
                            coin.change_24h >= 0 ? "#2ee6b8" : "#ff6666",
                        }}
                      >
                        {coin.change_24h >= 0 ? "+" : ""}
                        {coin.change_24h.toFixed(2)}%
                      </strong>
                    </div>

                    <div className="as-metric-cell">
                      <div className="as-metric-label">Market Cap</div>
                      <strong>
                        ${(coin.market_cap / 1e9).toFixed(2)}B
                      </strong>
                    </div>
                  </div>

                  <div className="as-block">
                    <strong className="as-block-label">
                      🚀 Primary Catalyst
                    </strong>
                    <p>{coin.catalyst}</p>
                  </div>

                  <div className="as-block">
                    <strong className="as-block-label">
                      🤖 AI Investment Thesis
                    </strong>
                    <ul>
                      {coin.reasons?.map((reason, index) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TokenDetailModal
        coin={selectedCoin}
        onClose={() => setSelectedCoin(null)}
      />
    </DashboardLayout>
  );
}

export default AlphaScanner;
