function MetricCard({ title, value, large = true }) {
  return (
    <div
      style={{
        background: "#181818",
        border: "1px solid #2b2b2b",
        borderRadius: "14px",
        padding: "18px",
      }}
    >
      <div
        style={{
          color: "#888",
          fontSize: "13px",
          marginBottom: "8px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: large ? "24px" : "15px",
          fontWeight: "700",
          lineHeight: "1.5",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default MetricCard;