function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">

      <aside className="sidebar">
        <h2>SignalMint</h2>

        <nav>
          <p>⭐ Opportunity Radar</p>
          <p>📊 Alpha Scanner</p>
          <p>🔍 Token Intelligence</p>
          <p>⚔️ Asset Battle</p>
          <p>💼 Portfolio Doctor</p>
        </nav>
      </aside>

      <main className="dashboard-content">
        {children}
      </main>

    </div>
  );
}

export default DashboardLayout;