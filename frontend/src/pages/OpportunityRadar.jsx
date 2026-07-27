import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  analyzeToken,
  getMarketSnapshot,
  getTrendingTokens,
} from "../services/api";
import MetricCard from "../components/MetricCard";
import "../styles/dashboard.css";
import ExecutiveSummary from "../components/ExecutiveSummary";

function OpportunityRadar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [opportunityScore, setOpportunityScore] = useState(null);
  const [signal, setSignal] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [reason, setReason] = useState("");

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

    setOpportunityScore(scoreMatch ? Number(scoreMatch[1]) : null);
    setSignal(signalMatch ? signalMatch[1] : "");
    setConfidence(confidenceMatch ? Number(confidenceMatch[1]) : null);

    // -------------------------
    // Executive Summary
    // -------------------------

    setReason(data.insights?.summary || "");

    // -------------------------
    // Key Catalysts
    // -------------------------

    if (data.insights?.catalysts) {
      setCatalysts(
        data.insights.catalysts
          .split("\n")
          .map((line) => line.replace(/^[-•*]\s*/, "").trim())
          .filter((line) => line.length > 0)
      );
    } else {
      setCatalysts([]);
    }

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

    try {
      const data = await analyzeToken(query);

      setCurrentToken(query.toUpperCase());

      updateAnalysis(data);
    } catch (err) {
      setError("Unable to connect to SignalMint AI.");
    }

    setLoading(false);
  }

  async function analyzeTrendingToken(symbol) {
    setQuery(symbol);

    setLoading(true);
    setError("");

    setReport("");
    setMarket("");

    setOpportunityScore(null);
    setSignal("");
    setConfidence(null);
    setReason("");

    try {
      const data = await analyzeToken(symbol);

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
              onClick={() => analyzeTrendingToken(token.symbol)}
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

        {loading && <p style={{ marginTop: "20px" }}>🔄 Analyzing...</p>}

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
                value={`${market.change_24h?.toFixed(2)}%`}
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
          <ExecutiveSummary
            score={opportunityScore}
            signal={signal}
            confidence={confidence}
            reason={reason}
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
            <h2
              style={{
                marginBottom: "20px",
                color: "#2ee6b8",
              }}
            >
              🤖 SignalMint AI Report
            </h2>

            <div className="ai-report" style={{ fontSize: "15px" }}>
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default OpportunityRadar;
