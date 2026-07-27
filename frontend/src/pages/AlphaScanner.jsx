import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { getAlphaScanner } from "../services/api";
import TokenDetailModal from "../components/TokenDetailModal";

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

function AlphaScanner() {
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState([]);
  const [error, setError] = useState("");
  const [selectedCoin, setSelectedCoin] = useState(null);

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

  useEffect(() => {
    loadScanner();
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

        {loading && <h2>🔄 Running AI scan...</h2>}

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
