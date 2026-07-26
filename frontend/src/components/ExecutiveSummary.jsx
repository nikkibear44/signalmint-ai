function ExecutiveSummary({
  reason,
  catalysts,
  risks,
}) {
  return (
    <div className="glass-card dashboard-section">

      <h2 className="section-title">
        🧠 AI Executive Summary
      </h2>

      {/* Summary */}

      <div
        style={{
          marginTop: 24,
          marginBottom: 32,
        }}
      >
        <h3
          style={{
            marginBottom: 14,
            color: "#fff",
          }}
        >
          Summary
        </h3>

        <p
          style={{
            color: "#d4d4d8",
            lineHeight: 1.9,
            fontSize: "16px",
            whiteSpace: "pre-wrap",
          }}
        >
          {reason}
        </p>
      </div>

      {/* Catalysts */}

      <div
        style={{
          marginBottom: 32,
        }}
      >
        <h3
          style={{
            marginBottom: 14,
          }}
        >
          🚀 Key Catalysts
        </h3>

        <ul
          style={{
            paddingLeft: 22,
            lineHeight: 1.8,
          }}
        >
          {catalysts.map((item, index) => (
            <li
              key={index}
              style={{
                marginBottom: 10,
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Risks */}

      <div>

        <h3
          style={{
            marginBottom: 18,
          }}
        >
          ⚠️ Key Risks
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {risks.map((risk, index) => (
            <div
              key={index}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: 16,
                lineHeight: 1.7,
                color: "#ddd",
              }}
            >
              {risk}
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}

export default ExecutiveSummary;