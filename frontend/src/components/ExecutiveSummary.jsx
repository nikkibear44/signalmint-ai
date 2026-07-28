function parseRisk(risk) {
  // Matches patterns like "Technology Risk: Medium — explanation text"
  const match = risk.match(/^(.+?Risk):\s*(Low|Medium|High)\s*[—-]\s*(.+)$/i);

  if (!match) {
    return { label: null, level: null, text: risk };
  }

  return {
    label: match[1].trim(),
    level: match[2].trim(),
    text: match[3].trim(),
  };
}

function riskBadgeClass(level) {
  if (!level) return "";
  const normalized = level.toLowerCase();

  if (normalized === "low") return "es-risk-badge es-risk-low";
  if (normalized === "medium") return "es-risk-badge es-risk-medium";
  if (normalized === "high") return "es-risk-badge es-risk-high";

  return "es-risk-badge";
}

function extractOverallRisk(risks) {
  // Handles lines like "*Overall Risk:* Medium" or "**Overall Risk:** Medium"
  const pattern = /overall risk:?\**\s*(Low|Medium|High)/i;

  let overallLevel = null;
  const remaining = [];

  risks.forEach((risk) => {
    const match = risk.match(pattern);

    if (match && !overallLevel) {
      overallLevel = match[1];
    } else {
      remaining.push(risk);
    }
  });

  return { overallLevel, remaining };
}

function isNoCatalystMessage(item) {
  return /no confirmed upcoming catalyst/i.test(item);
}

function ExecutiveSummary({
  reason,
  catalysts,
  risks,
}) {
  const { overallLevel, remaining: filteredRisks } = extractOverallRisk(risks);

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

        <div className="es-catalyst-grid">
          {catalysts.map((item, index) =>
            isNoCatalystMessage(item) ? (
              <div key={index} className="es-catalyst-neutral">
                <span className="es-info-icon">ℹ️</span>
                <span>{item}</span>
              </div>
            ) : (
              <div key={index} className="es-catalyst-card">
                <span className="es-check-icon">✓</span>
                <span>{item}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Risks */}

      <div>

        <div className="es-risk-heading-row">
          <h3 style={{ margin: 0 }}>⚠️ Key Risks</h3>

          {overallLevel && (
            <div className="es-overall-risk">
              <span>Overall Risk</span>
              <span className={riskBadgeClass(overallLevel)}>
                {overallLevel}
              </span>
            </div>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
            marginTop: 18,
          }}
        >
          {filteredRisks.map((risk, index) => {
            const parsed = parseRisk(risk);

            if (!parsed.label) {
              return (
                <div key={index} className="es-risk-card">
                  {risk}
                </div>
              );
            }

            return (
              <div key={index} className="es-risk-card">
                <div className="es-risk-header">
                  <span className="es-risk-label">{parsed.label}</span>
                  <span className={riskBadgeClass(parsed.level)}>
                    {parsed.level}
                  </span>
                </div>
                <p className="es-risk-text">{parsed.text}</p>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}

export default ExecutiveSummary;
