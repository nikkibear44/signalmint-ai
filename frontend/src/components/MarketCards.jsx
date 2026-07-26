function formatNumber(num) {
  if (num === null || num === undefined) return "N/A";

  if (num >= 1_000_000_000)
    return "$" + (num / 1_000_000_000).toFixed(2) + "B";

  if (num >= 1_000_000)
    return "$" + (num / 1_000_000).toFixed(2) + "M";

  if (num >= 1_000)
    return "$" + (num / 1_000).toFixed(2) + "K";

  return "$" + Number(num).toLocaleString();
}

export default function MarketCards({ market }) {
  if (!market) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "16px",
        marginBottom: "30px",
      }}
    >
      <Card title="💰 Price" value={`$${market.price ?? "N/A"}`} />

      <Card
        title="📈 24H Change"
        value={
          market.change_24h !== null && market.change_24h !== undefined
            ? `${market.change_24h}%`
            : "N/A"
        }
      />

      <Card
        title="🏦 Market Cap"
        value={formatNumber(market.market_cap)}
      />

      <Card
        title="🔄 Volume"
        value={formatNumber(market.volume)}
      />

      <Card
        title="🏆 Rank"
        value={
          market.coingecko_rank
            ? `#${market.coingecko_rank}`
            : "N/A"
        }
      />
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div
      style={{
        background: "#151515",
        borderRadius: "12px",
        padding: "20px",
        border: "1px solid #2b2b2b",
      }}
    >
      <div
        style={{
          color: "#888",
          fontSize: "14px",
          marginBottom: "10px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "24px",
          fontWeight: "700",
        }}
      >
        {value}
      </div>
    </div>
  );
}