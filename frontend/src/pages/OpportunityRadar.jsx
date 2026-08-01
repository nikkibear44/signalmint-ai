import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DashboardLayout from "../layouts/DashboardLayout";
import SignalLoader from "../components/SignalLoader";
import {
  analyzeToken,
  getMarketSnapshot,
  getTrendingTokens,
  getTradePlan,
} from "../services/api";
import MetricCard from "../components/MetricCard";
import "../styles/dashboard.css";
import ExecutiveSummary from "../components/ExecutiveSummary";

function cleanPlanValue(value) {
  if (!value) return "N/A";

  const normalized = String(value).trim().toLowerCase();

  if (normalized === "undefined" || normalized === "null" || normalized === "") {
    return "N/A";
  }

  return value;
}

function hasActionablePlan(plan) {
  // A real, executable plan needs an actual number/price somewhere in
  // the entry zone - not just qualitative language like "wait for
  // stabilization" or "monitor for volume increase".
  if (!plan?.entry_zone) return false;

  const hasNumber = /\d/.test(plan.entry_zone);
  const entryLower = plan.entry_zone.toLowerCase();

  const waitLanguage = [
    "wait",
    "monitor",
    "n/a",
    "reassess",
    "unavailable",
  ].some((phrase) => entryLower.includes(phrase));

  return hasNumber && !waitLanguage;
}

function buildExecutionInstruction(tokenSymbol, plan, amountUsd) {
  return `I'd like to execute a trade based on this AI-generated plan from SignalMint AI.

Token: ${tokenSymbol}
Bias: ${plan.overall_bias}
Suggested Action: ${plan.suggested_action}
Entry Zone: ${cleanPlanValue(plan.entry_zone)}
Take Profit: ${cleanPlanValue(plan.take_profit)}
Stop Loss: ${cleanPlanValue(plan.stop_loss)}
Amount: ~$${amountUsd} USDT0

Please check whether ${tokenSymbol} and its chain are supported by OKX DEX before proceeding. If supported, use the OKX Agent Payments Protocol / OKX DEX to execute this swap on my behalf, using my own connected wallet. Confirm the trade details with me before signing anything. If ${tokenSymbol} or its chain is not supported by OKX DEX, let me know instead of attempting the trade.`;
}

function biasClass(bias) {
  const normalized = (bias || "").toLowerCase();

  if (normalized === "bullish") return "tdm-bias tdm-bias-bullish";
  if (normalized === "bearish") return "tdm-bias tdm-bias-bearish";
  return "tdm-bias tdm-bias-neutral";
}

function OpportunityRadar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [opportunityScore, setOpportunityScore] = useState(null);
  const [signal, setSignal] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [reason, setReason] = useState("");
  const [executiveSummary, setExecutiveSummary] = useState("");

  const [tradePlan, setTradePlan] = useState(null);
  const [tradePlanLoading, setTradePlanLoading] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);
  const [executionAmount, setExecutionAmount] = useState("100");
  const [showExecutionPrep, setShowExecutionPrep] = useState(false);
  const [copiedExecution, setCopiedExecution] = useState(false);

  const [catalysts, setCatalysts] = useState([]);
  const [risks, setRisks] = useState([]);

  const [market, setMarket] = useState("");
  const [error, setError] = useState("");

  const [marketSnapshot, setMarketSnapshot] = useState(null);
  const [trendingTokens, setTrendingTokens] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("");

  const [watchlist, setWatchlist] = useState([]);
  const [currentToken, setCurrentToken] = useState("");

  const [compareToken1, setCompareToken1] = useState("");
  const [compareToken2, setCompareToken2] = useState("");

  const [comparisonResult, setComparisonResult] = useState("");
  const [comparisonLoading, setComparisonLoading] = useState(false);

  function updateAnalysis(data) {
    setMarket(data.market || "");

    const cleanedReport = (data.report || "").replace(
      /# 🚦 AI Opportunity Score[\s\S]*?# 🔍 SignalMint AI Research Report/,
      "# 🔍 SignalMint AI Research Report"
    );

    setReport(cleanedReport);

    const reportText = data.report || "";

    // -------------------------
    // Opportunity Score
    // -------------------------

    const scoreMatch = reportText.match(/Opportunity Score:\s*(\d+)/i);

    const signalMatch = reportText.match(/Signal:\s*(BUY|SELL|HOLD)/i);

    const confidenceMatch = reportText.match(/Confidence:\s*(\d+)/i);

    const reasonMatch = reportText.match(
      /Reason:\s*([\s\S]*?)(?=\n(?:---|#))/i
    );

    setOpportunityScore(scoreMatch ? Number(scoreMatch[1]) : null);
    setSignal(signalMatch ? signalMatch[1] : "");
    setConfidence(confidenceMatch ? Number(confidenceMatch[1]) : null);

    // -------------------------
    // Score reason (distinct one-sentence reason, NOT the Executive Summary)
    // -------------------------

    setReason(
      reasonMatch ? reasonMatch[1].trim() : data.insights?.summary || ""
    );

    setExecutiveSummary(data.insights?.summary || "");

    // -------------------------
    // Key Catalysts
    // -------------------------

    let catalystsList = [];

    if (data.insights?.catalysts) {
      catalystsList = data.insights.catalysts
        .split("\n")
        .map((line) => line.replace(/^[-•*]\s*/, "").trim())
        .filter((line) => line.length > 0);
    }

    setCatalysts(catalystsList);

    // -------------------------
    // Risks
    // -------------------------

    if (data.insights?.risk_assessment) {
      setRisks(
        data.insights.risk_assessment
          .split("\n")
          .map((line) =>
            line
              .replace(/^[-•*]\s*/, "")
              .replace(/\*\*/g, "")
              .trim()
          )
          .filter((line) => line.length > 0)
      );
    } else {
      setRisks([]);
    }

    // -------------------------
    // Decision Card (reuses the same AI trade plan logic
    // that already works in Alpha Scanner)
    // -------------------------

    loadTradePlanFor(data.market, catalystsList);
  }

  async function loadTradePlanFor(marketData, catalystsList) {
    setTradePlanLoading(true);
    setTradePlan(null);

    const coinForPlan = {
      name: marketData?.name || currentToken || "Unknown",
      symbol: marketData?.symbol || currentToken || "N/A",
      price: marketData?.price ?? "N/A",
      change_24h: marketData?.change_24h ?? "N/A",
      market_cap: marketData?.market_cap ?? "N/A",
      catalyst: catalystsList[0] || "No confirmed upcoming catalyst.",
      reasons:
        catalystsList.length > 0
          ? catalystsList
          : ["AI opportunity score analysis"],
    };

    try {
      const result = await getTradePlan(coinForPlan);
      setTradePlan(result.report || null);
    } catch (err) {
      console.error(err);
      setTradePlan(null);
    }

    setTradePlanLoading(false);
  }

  function addToWatchlist() {
    if (!currentToken || opportunityScore === null) return;

    const item = {
      token: currentToken,
      score: opportunityScore,
      signal,
      confidence,
    };

    const updatedWatchlist = [...watchlist];

    const index = updatedWatchlist.findIndex(
      (coin) => coin.token === currentToken
    );

    if (index >= 0) {
      updatedWatchlist[index] = item;
    } else {
      updatedWatchlist.push(item);
    }

    setWatchlist(updatedWatchlist);

    localStorage.setItem("watchlist", JSON.stringify(updatedWatchlist));
  }

  function removeFromWatchlist(token) {
    const updatedWatchlist = watchlist.filter((item) => item.token !== token);

    setWatchlist(updatedWatchlist);

    localStorage.setItem("watchlist", JSON.stringify(updatedWatchlist));
  }

  async function handleAnalyze() {
    if (!query.trim()) {
      setError("Please enter a token or project.");
      return;
    }

    setLoading(true);
    setError("");

    setReport("");
    setMarket("");

    setOpportunityScore(null);
    setSignal("");
    setConfidence(null);
    setReason("");
    setExecutiveSummary("");
    setTradePlan(null);
    setShowFullReport(false);
    setShowExecutionPrep(false);
    setCopiedExecution(false);

    try {
      const data = await analyzeToken(query);

      setCurrentToken(query.toUpperCase());

      updateAnalysis(data);
    } catch (err) {
      setError("Unable to connect to SignalMint AI.");
    }

    setLoading(false);
  }

  async function analyzeTrendingToken(symbol, coingeckoId) {
    setQuery(symbol);

    setLoading(true);
    setError("");

    setReport("");
    setMarket("");

    setOpportunityScore(null);
    setSignal("");
    setConfidence(null);
    setReason("");
    setExecutiveSummary("");
    setTradePlan(null);
    setShowFullReport(false);
    setShowExecutionPrep(false);
    setCopiedExecution(false);

    try {
      const data = await analyzeToken(symbol, coingeckoId);

      setCurrentToken(symbol.toUpperCase());

      updateAnalysis(data);
    } catch (err) {
      setError("Unable to connect to SignalMint AI.");
    }

    setLoading(false);
  }

  useEffect(() => {
    async function loadDashboard() {
      // Load market snapshot independently
      try {
        const marketResponse = await getMarketSnapshot();
        setMarketSnapshot(marketResponse.data);
      } catch (err) {
        console.error("Market Snapshot Error:", err);
      }

      // Load trending independently
      try {
        const trendingResponse = await getTrendingTokens();
        setTrendingTokens(trendingResponse.data);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (err) {
        console.error("Trending Error:", err);
      }
    }

    const savedWatchlist = localStorage.getItem("watchlist");

    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist));
    }

    loadDashboard();
  }, []);

  return (
    <DashboardLayout>
      <div className="or-page-header">
        <h1>⭐ Opportunity Radar</h1>

        <p>
          Discover high-conviction crypto opportunities before the market
          catches on.
        </p>
      </div>

      {/* Watchlist - moved to top so it's always visible first */}

      {watchlist.length > 0 && (
        <div className="orw-watchlist">
          <h2 className="orw-watchlist-title">⭐ AI Watchlist</h2>

          <div className="orw-watchlist-head">
            <span>Token</span>
            <span>AI Score</span>
            <span>Signal</span>
            <span>Confidence</span>
            <span></span>
          </div>

          {watchlist.map((coin) => (
            <div key={coin.token} className="orw-watchlist-row">
              <div className="orw-token-cell">
                <div className="orw-avatar">{coin.token.charAt(0)}</div>
                <strong style={{ color: "#fff", fontSize: "15px" }}>
                  {coin.token}
                </strong>
              </div>

              <span
                className="orw-badge"
                style={{
                  background:
                    coin.score >= 90
                      ? "#2ee6b8"
                      : coin.score >= 70
                      ? "#ffd166"
                      : "#ff9f43",
                  color: "#101820",
                }}
              >
                {coin.score}/100
              </span>

              <span
                className="orw-badge"
                style={{
                  background:
                    coin.signal === "BUY"
                      ? "#1f4d3a"
                      : coin.signal === "SELL"
                      ? "#4d1f1f"
                      : "#4d4420",
                  color:
                    coin.signal === "BUY"
                      ? "#2ee6b8"
                      : coin.signal === "SELL"
                      ? "#ff5b5b"
                      : "#ffd166",
                }}
              >
                {coin.signal}
              </span>

              <span className="orw-conf-cell">🎯 {coin.confidence}%</span>

              <button
                className="orw-remove-btn"
                onClick={() => removeFromWatchlist(coin.token)}
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Global Market Snapshot */}

      {marketSnapshot && (
        <div style={{ marginTop: "30px" }}>
          <h2>🌍 Global Market Snapshot</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))",
              gap: "16px",
              marginTop: "20px",
            }}
          >
            <MetricCard
              title="BTC Dominance"
              value={`${marketSnapshot.btc_dominance.toFixed(2)}%`}
            />

            <MetricCard
              title="ETH Dominance"
              value={`${marketSnapshot.eth_dominance.toFixed(2)}%`}
            />

            <MetricCard
              title="Market Cap"
              value={`$${(marketSnapshot.total_market_cap / 1e12).toFixed(
                2
              )}T`}
            />

            <MetricCard
              title="24h Volume"
              value={`$${(marketSnapshot.total_volume / 1e9).toFixed(2)}B`}
            />
          </div>
        </div>
      )}

      {/* Trending Tokens */}

      <div style={{ marginTop: "40px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>🔥 Trending Tokens</h2>

          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#2ee6b8",
              border: "none",
              color: "#000",
              padding: "8px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Refresh
          </button>
          <p
            style={{
              color: "#888",
              fontSize: "12px",
              marginTop: "8px",
              textAlign: "right",
            }}
          >
            Last Updated: {lastUpdated || "--"}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))",
            gap: "16px",
            marginTop: "20px",
          }}
        >
          {trendingTokens.map((token, index) => (
            <div
              key={token.symbol}
              onClick={() => analyzeTrendingToken(token.symbol, token.id)}
              style={{
                cursor: "pointer",
                background: "#181818",
                border: "1px solid #2b2b2b",
                borderRadius: "14px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  color: "#888",
                  fontSize: "12px",
                  marginBottom: "8px",
                }}
              >
                #{index + 1} • {token.symbol}
              </div>

              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  marginBottom: "12px",
                }}
              >
                {token.name}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  marginBottom: "6px",
                }}
              >
                <span style={{ color: "#888" }}>Price</span>
                <span>
                  $
                  {Number(token.price).toLocaleString(undefined, {
                    maximumFractionDigits: 6,
                  })}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  marginBottom: "6px",
                }}
              >
                <span style={{ color: "#888" }}>24h</span>

                <span
                  style={{
                    color: token.change_24h >= 0 ? "#2ee6b8" : "#ff6666",
                    fontWeight: "600",
                  }}
                >
                  {token.change_24h >= 0 ? "+" : ""}
                  {token.change_24h.toFixed(2)}%
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                }}
              >
                <span style={{ color: "#888" }}>Rank</span>
                <span>#{token.rank}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analyze */}

      <div className="glass-card dashboard-section">
        <h3>Analyze a Token</h3>

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "20px",
          }}
        >
          <input
            className="search-input"
            type="text"
            placeholder="e.g. SOL, ETH, BTC"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "10px",
              border: "1px solid #333",
              background: "#1a1a1a",
              color: "white",
            }}
          />

          <button className="primary-btn" onClick={handleAnalyze}>
            Analyze
          </button>
        </div>

        {loading && <SignalLoader text="Analyzing market data and generating insights..." />}

        {error && (
          <p style={{ color: "#ff6666", marginTop: "20px" }}>{error}</p>
        )}

        {market && (
          <div style={{ marginTop: "30px" }}>
            <h2>Token Snapshot</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))",
                gap: "16px",
                marginTop: "20px",
              }}
            >
              <MetricCard
                title="Token"
                value={`${market.name} (${market.symbol})`}
              />

              <MetricCard
                title="Price"
                value={`$${market.price?.toLocaleString()}`}
              />

              <MetricCard
                title="24h Change"
                value={
                  market.change_24h != null
                    ? `${market.change_24h.toFixed(2)}%`
                    : "N/A"
                }
              />

              <MetricCard
                title="Market Cap"
                value={`$${(market.market_cap / 1e9).toFixed(2)}B`}
              />

              <MetricCard
                title="24h Volume"
                value={`$${(market.volume / 1e6).toFixed(2)}M`}
              />

              <MetricCard title="Rank" value={`#${market.coingecko_rank}`} />

              <MetricCard
                title="Bullish Sentiment"
                value={`${market.sentiment_up}%`}
              />

              <MetricCard
                title="Categories"
                value={`${market.categories?.length ?? 0}`}
              />
            </div>
          </div>
        )}

        {opportunityScore !== null && (
          <div
            style={{
              marginTop: "25px",
              padding: "24px",
              borderRadius: "16px",
              background: "linear-gradient(135deg,#101820,#171f2e)",
              border: "1px solid #2ee6b8",
              boxShadow: "0 0 20px rgba(46,230,184,0.15)",
              textAlign: "center",
            }}
          >
            <h2 style={{ color: "#2ee6b8", marginBottom: "15px" }}>
              🚦 AI Opportunity Score
            </h2>

            <div
              style={{
                fontSize: "56px",
                fontWeight: "bold",
                color:
                  opportunityScore >= 90
                    ? "#2ee6b8"
                    : opportunityScore >= 70
                    ? "#ffd166"
                    : opportunityScore >= 50
                    ? "#ff9f43"
                    : "#ff5b5b",
              }}
            >
              {opportunityScore}
              <span
                style={{
                  fontSize: "22px",
                  color: "#888",
                }}
              >
                /100
              </span>
            </div>

            <div
              style={{
                marginTop: "15px",
                fontSize: "26px",
                fontWeight: "700",
                color:
                  signal === "BUY"
                    ? "#2ee6b8"
                    : signal === "SELL"
                    ? "#ff5b5b"
                    : "#ffd166",
              }}
            >
              {signal === "BUY"
                ? "🟢 BUY"
                : signal === "SELL"
                ? "🔴 SELL"
                : "🟡 HOLD"}
            </div>

            <div
              style={{
                marginTop: "10px",
                color: "#bbb",
              }}
            >
              Confidence: {confidence}%
            </div>

            <p
              style={{
                marginTop: "20px",
                color: "#ddd",
                lineHeight: "1.7",
              }}
            >
              {reason}
            </p>

            <button
              onClick={addToWatchlist}
              style={{
                marginTop: "20px",
                padding: "12px 20px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                background: "#2ee6b8",
                color: "#101820",
                fontWeight: "bold",
                fontSize: "15px",
              }}
            >
              ⭐ Add to Watchlist
            </button>
          </div>
        )}

        {opportunityScore !== null && (
          <div className="oc-decision-card">
            <div className="tdm-section-label">🎯 AI Decision Center</div>

            {tradePlanLoading && (
              <>
                <div className="tdm-plan-skeleton" style={{ height: 44, width: 160 }} />
                <div
                  className="tdm-plan-grid"
                  style={{ marginTop: 16 }}
                >
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="tdm-plan-skeleton"
                      style={{ height: 70 }}
                    />
                  ))}
                </div>
              </>
            )}

            {!tradePlanLoading && tradePlan && (
              <>
                <div className={biasClass(tradePlan.overall_bias)}>
                  {tradePlan.overall_bias}
                </div>

                <div className="tdm-action-card">
                  <div className="tdm-action-label">🎯 Suggested Action</div>
                  <strong>{tradePlan.suggested_action}</strong>
                </div>

                <div className="tdm-plan-grid">
                  {[
                    ["🎯 Entry Zone", tradePlan.entry_zone],
                    ["💰 Take Profit", tradePlan.take_profit],
                    ["🛑 Stop Loss", tradePlan.stop_loss],
                    ["⏳ Holding Period", tradePlan.holding_period],
                    ["⚖️ Risk / Reward", tradePlan.risk_reward],
                  ].map(([title, value]) => (
                    <div key={title} className="tdm-plan-cell">
                      <span>{title}</span>
                      <strong>{cleanPlanValue(value)}</strong>
                    </div>
                  ))}
                </div>

                <div className="tdm-summary-card">
                  <div className="tdm-action-label">📝 AI Summary</div>
                  <div className="tdm-summary-text">
                    {tradePlan.summary || "No summary available."}
                  </div>
                </div>

                <div className="oc-execution-section">
                  {hasActionablePlan(tradePlan) ? (
                    <button
                      className="oc-execute-btn"
                      onClick={() => setShowExecutionPrep((prev) => !prev)}
                    >
                      🚀 {showExecutionPrep ? "Hide Execution" : "Prepare Execution"}
                    </button>
                  ) : (
                    <div className="oc-not-actionable">
                      ⏳ This is a monitor/wait recommendation, not a
                      ready-to-execute trade — there's no specific price
                      target yet. Check back once the AI identifies a
                      concrete entry point.
                    </div>
                  )}

                  {showExecutionPrep && hasActionablePlan(tradePlan) && (
                    <div className="oc-execution-card">
                      <div className="oc-execution-label">
                        Amount to allocate (USDT0)
                      </div>

                      <input
                        type="number"
                        className="oc-execution-amount-input"
                        value={executionAmount}
                        onChange={(e) => {
                          setExecutionAmount(e.target.value);
                          setCopiedExecution(false);
                        }}
                        min="1"
                      />

                      <div className="oc-execution-label" style={{ marginTop: 16 }}>
                        Instruction for your agent
                      </div>

                      <pre className="oc-execution-text">
                        {buildExecutionInstruction(
                          currentToken || query,
                          tradePlan,
                          executionAmount
                        )}
                      </pre>

                      <button
                        className="oc-copy-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            buildExecutionInstruction(
                              currentToken || query,
                              tradePlan,
                              executionAmount
                            )
                          );
                          setCopiedExecution(true);
                          setTimeout(() => setCopiedExecution(false), 2000);
                        }}
                      >
                        {copiedExecution ? "✓ Copied" : "📋 Copy Instruction"}
                      </button>

                      <p className="oc-execution-disclaimer">
                        SignalMint AI does not hold funds or execute trades
                        itself. This copies a ready-to-send instruction for
                        your own agent to execute using your own connected
                        wallet. Not every token or chain is guaranteed to be
                        supported by OKX DEX — your agent will confirm this
                        before proceeding.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {!tradePlanLoading && !tradePlan && (
              <p style={{ color: "#999" }}>
                Unable to generate a decision plan for this token.
              </p>
            )}
          </div>
        )}

        {opportunityScore !== null && (
          <ExecutiveSummary
            score={opportunityScore}
            signal={signal}
            confidence={confidence}
            reason={executiveSummary}
            catalysts={catalysts}
            risks={risks}
          />
        )}

        {report && (
          <div
            style={{
              marginTop: "25px",
              padding: "24px",
              background: "#181818",
              border: "1px solid #2b2b2b",
              borderRadius: "16px",
            }}
          >
            <button
              className="or-report-toggle"
              onClick={() => setShowFullReport((prev) => !prev)}
            >
              <span>🤖 Full SignalMint AI Report</span>
              <span className="or-report-toggle-arrow">
                {showFullReport ? "▲ Hide" : "▼ Read full report"}
              </span>
            </button>

            {showFullReport && (
              <div
                className="ai-report"
                style={{ fontSize: "15px", marginTop: "20px" }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default OpportunityRadar;
