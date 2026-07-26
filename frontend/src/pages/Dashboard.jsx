import DashboardLayout from "../layouts/DashboardLayout";

function Dashboard() {
  return (
    <DashboardLayout>
      <div className="dashboard-page">

        {/* Hero */}
        <section className="hero-section">
          <h1>🟠 SignalMint AI</h1>
          <p>
            AI-powered crypto intelligence using verified live market data.
          </p>
        </section>

        {/* Search */}
        <section className="search-section">
          <input
            type="text"
            placeholder="Search token (e.g. Hyperliquid)"
          />

          <button>Analyze</button>
        </section>

        {/* Stats */}
        <section className="stats-grid">

          <div className="stat-card">
            <span>💰 Price</span>
            <h2>--</h2>
          </div>

          <div className="stat-card">
            <span>🏦 Market Cap</span>
            <h2>--</h2>
          </div>

          <div className="stat-card">
            <span>🔒 TVL</span>
            <h2>--</h2>
          </div>

          <div className="stat-card">
            <span>📈 Volume</span>
            <h2>--</h2>
          </div>

        </section>

        {/* Report */}
        <section className="report-card">

          <h2>AI Report</h2>

          <p>
            Analyze any token to generate an institutional-grade crypto report.
          </p>

        </section>

      </div>
    </DashboardLayout>
  );
}

export default Dashboard;