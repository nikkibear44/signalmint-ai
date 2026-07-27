import { Satellite, Brain, Zap, FileText } from "lucide-react";

function Why() {
  return (
    <section className="why" id="why">

      <p className="section-tag">
        WHY SIGNALMINT
      </p>

      <h2>
        One Intelligence Engine.
        <br />
        Three AI Services.
      </h2>

      <div className="why-grid">

        <div className="why-card">
          <div className="why-icon-badge">
            <Satellite size={22} />
          </div>
          <h3>Live Market Data</h3>
          <p>
            Real-time crypto market data collected from trusted sources.
          </p>
        </div>

        <div className="why-card">
          <div className="why-icon-badge">
            <Brain size={22} />
          </div>
          <h3>AI Reasoning</h3>
          <p>
            AI analyzes market data instead of simply answering prompts.
          </p>
        </div>

        <div className="why-card">
          <div className="why-icon-badge">
            <Zap size={22} />
          </div>
          <h3>One Intelligence Engine</h3>
          <p>
            Every service shares the same market intelligence engine.
          </p>
        </div>

        <div className="why-card">
          <div className="why-icon-badge">
            <FileText size={22} />
          </div>
          <h3>Professional Reports</h3>
          <p>
            Generate structured reports for traders and investors.
          </p>
        </div>

      </div>

    </section>
  );
}

export default Why;
