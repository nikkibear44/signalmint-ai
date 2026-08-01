import {
  Database,
  TrendingUp,
  Sun,
  Boxes,
  Link2,
  Star,
  BarChart3,
  Waves,
  Briefcase,
  Search,
  Swords,
  Brain,
} from "lucide-react";

const DATA_SOURCES = [
  { Icon: Database, label: "CoinGecko" },
  { Icon: TrendingUp, label: "DexScreener" },
  { Icon: Sun, label: "Helius (Solana)" },
  { Icon: Boxes, label: "Blockscout" },
  { Icon: Link2, label: "On-Chain RPC" },
];

const FEATURES = [
  { Icon: Star, label: "Opportunity Radar" },
  { Icon: BarChart3, label: "Alpha Scanner" },
  { Icon: Waves, label: "Smart Money" },
  { Icon: Briefcase, label: "Portfolio Doctor" },
  { Icon: Search, label: "Token Intelligence" },
  { Icon: Swords, label: "Asset Battle" },
];

function Architecture() {
  return (
    <section className="architecture" id="architecture">
      <p className="section-tag">HOW IT WORKS</p>

      <h2>
        One engine.
        <br />
        Six intelligent tools.
      </h2>

      <div className="arch-diagram">
        {/* Data sources row */}
        <div className="arch-sources-row">
          {DATA_SOURCES.map(({ Icon, label }) => (
            <div key={label} className="arch-source-pill">
              <Icon size={15} />
              {label}
            </div>
          ))}
        </div>

        <div className="arch-connector-line" />

        {/* Central engine node */}
        <div className="arch-engine-node">
          <div className="arch-engine-pulse">
            <span className="signal-ring signal-ring-1" />
            <span className="signal-ring signal-ring-2" />
            <span className="signal-ring signal-ring-3" />
          </div>
          <div className="arch-engine-content">
            <Brain size={34} className="arch-engine-icon" />
            <h3>Intelligence Engine</h3>
            <p>Real data, grounded AI reasoning</p>
          </div>
        </div>

        <div className="arch-connector-line" />

        {/* Features grid */}
        <div className="arch-features-grid">
          {FEATURES.map(({ Icon, label }) => (
            <div key={label} className="arch-feature-card">
              <Icon size={22} className="arch-feature-icon" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Architecture;
