import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Star,
  BarChart3,
  Waves,
  Briefcase,
  Search,
  Swords,
  ChevronLeft,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import logo from "../assets/logo.png";

const navItems = [
  { label: "Opportunity Radar", icon: Star, path: "/dashboard/opportunity-radar" },
  { label: "Alpha Scanner", icon: BarChart3, path: "/dashboard/alpha-scanner" },
  { label: "Smart Money", icon: Waves, path: "/dashboard/smart-money" },
  { label: "Portfolio Doctor", icon: Briefcase, path: "/dashboard/portfolio-doctor" },
  { label: "Token Intelligence", icon: Search, path: null },
  { label: "Asset Battle", icon: Swords, path: null },
];

function getInitialCollapsed() {
  try {
    return localStorage.getItem("sidebarCollapsed") === "true";
  } catch {
    return false;
  }
}

function shortAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function DashboardLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);
  const {
    address,
    connecting,
    error,
    connect,
    disconnect,
    evmAddress,
    connectEvm,
    disconnectEvm,
  } = useWallet();

  const isToolPage = location.pathname !== "/dashboard";

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebarCollapsed", String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }

  return (
    <div className="dashboard-layout">
      <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
        <div className="sidebar-top">
          <Link
            to="/"
            className="sidebar-logo"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <img src={logo} alt="SignalMint" className="sidebar-logo-img" />
            {!collapsed && <h2>SignalMint</h2>}
          </Link>

          <button
            className="sidebar-toggle"
            onClick={toggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Wallet connect - Solana (Phantom) */}
        <div className="wallet-box">
          {!collapsed && <div className="wallet-chain-label">Solana</div>}

          {address ? (
            <button
              className="wallet-btn wallet-connected"
              onClick={disconnect}
              title="Click to disconnect"
            >
              <span className="wallet-dot" />
              {!collapsed && shortAddress(address)}
            </button>
          ) : (
            <button
              className="wallet-btn"
              onClick={connect}
              disabled={connecting}
            >
              {connecting ? (
                "Connecting..."
              ) : collapsed ? (
                <Wallet size={16} />
              ) : (
                "Connect Phantom"
              )}
            </button>
          )}
        </div>

        {/* Wallet connect - EVM (OKX Wallet) */}
        <div className="wallet-box">
          {!collapsed && <div className="wallet-chain-label">EVM (OKX)</div>}

          {evmAddress ? (
            <button
              className="wallet-btn wallet-connected"
              onClick={disconnectEvm}
              title="Click to disconnect"
            >
              <span className="wallet-dot" />
              {!collapsed && shortAddress(evmAddress)}
            </button>
          ) : (
            <button
              className="wallet-btn"
              onClick={connectEvm}
              disabled={connecting}
            >
              {connecting ? (
                "Connecting..."
              ) : collapsed ? (
                <Wallet size={16} />
              ) : (
                "Connect OKX Wallet"
              )}
            </button>
          )}

          {!collapsed && error && <p className="wallet-error">{error}</p>}
        </div>

        <nav>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            if (!item.path) {
              return (
                <p
                  key={item.label}
                  className="nav-disabled"
                  title="Coming soon"
                >
                  <Icon size={18} />
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                </p>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`nav-link ${isActive ? "nav-link-active" : ""}`}
                title={item.label}
              >
                <Icon size={18} />
                {!collapsed && <span className="nav-label">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="dashboard-content">
        {isToolPage && (
          <button
            onClick={() => navigate("/dashboard")}
            className="dash-back-btn"
          >
            <ChevronLeft size={14} style={{ marginRight: 6 }} />
            Back to Dashboard
          </button>
        )}

        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;
