import { useEffect, useState } from "react";
import { getTradePlan } from "../services/api";

function cleanPlanValue(value) {
  if (!value) return "N/A";

  const normalized = String(value).trim().toLowerCase();

  if (normalized === "undefined" || normalized === "null" || normalized === "") {
    return "N/A";
  }

  return value;
}

function biasClass(bias) {
  const normalized = (bias || "").toLowerCase();

  if (normalized === "bullish") return "tdm-bias tdm-bias-bullish";
  if (normalized === "bearish") return "tdm-bias tdm-bias-bearish";
  return "tdm-bias tdm-bias-neutral";
}

function TokenDetailModal({ coin, onClose }) {
  const [tradePlan, setTradePlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => {
    if (!coin) return;

    async function loadTradePlan() {
      setLoadingPlan(true);
      setTradePlan(null);

      try {
        const data = await getTradePlan(coin);
        setTradePlan(data.report);
      } catch (err) {
        console.error(err);

        setTradePlan({
          overall_bias: "Neutral",
          suggested_action: "Failed to generate AI trade plan.",
          entry_zone: "-",
          take_profit: "-",
          stop_loss: "-",
          holding_period: "-",
          risk_reward: "-",
          summary: "Unable to contact AI service. Try refreshing.",
        });
      }

      setLoadingPlan(false);
    }

    loadTradePlan();
  }, [coin]);

  if (!coin) return null;

  return (
    <div className="tdm-overlay" onClick={onClose}>
      <div className="tdm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tdm-header">
          <div>
            <h1>{coin.name}</h1>
            <div className="tdm-symbol">{coin.symbol}</div>
          </div>

          <button className="tdm-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* AI Score */}
        <div className="tdm-section-label">AI Score</div>
        <div className="tdm-score">{coin.ai_score}</div>

        {/* Catalyst */}
        <div className="tdm-section-label">🚀 Primary Catalyst</div>
        <p style={{ color: "#ccc", lineHeight: 1.7 }}>{coin.catalyst}</p>

        {/* Thesis */}
        <div className="tdm-section-label">🧠 AI Investment Thesis</div>
        <ul className="tdm-thesis-list">
          {coin.reasons?.map((reason, index) => (
            <li key={index}>{reason}</li>
          ))}
        </ul>

        {/* Market */}
        <div className="tdm-section-label">📊 Market Data</div>
        <div className="tdm-market-grid">
          <div className="tdm-market-cell">
            <span>Price</span>
            <strong>${Number(coin.price).toLocaleString()}</strong>
          </div>

          <div className="tdm-market-cell">
            <span>24h</span>
            <strong
              style={{
                color: coin.change_24h >= 0 ? "#2ee6b8" : "#ff6666",
              }}
            >
              {coin.change_24h >= 0 ? "+" : ""}
              {coin.change_24h.toFixed(2)}%
            </strong>
          </div>

          <div className="tdm-market-cell">
            <span>Market Cap</span>
            <strong>${(coin.market_cap / 1e9).toFixed(2)}B</strong>
          </div>
        </div>

        <hr className="tdm-divider" />

        <div className="tdm-section-label">🤖 AI Action Plan</div>

        {loadingPlan && (
          <>
            <div className="tdm-plan-skeleton" style={{ height: 44, width: 160 }} />
            <div className="tdm-plan-skeleton" />
            <div
              className="tdm-plan-grid"
              style={{ marginTop: 0 }}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="tdm-plan-skeleton" style={{ height: 70 }} />
              ))}
            </div>
            <div className="tdm-plan-skeleton" style={{ height: 90 }} />
          </>
        )}

        {!loadingPlan && tradePlan && (
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
          </>
        )}
      </div>
    </div>
  );
}

export default TokenDetailModal;
