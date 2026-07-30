import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { Star, BarChart3, Waves, Briefcase, Search, Swords } from "lucide-react";

const tools = [
  {
    icon: Star,
    title: "Opportunity Radar",
    description:
      "Discover high-conviction crypto opportunities before the market catches on.",
    path: "/dashboard/opportunity-radar",
  },
  {
    icon: BarChart3,
    title: "Alpha Scanner",
    description: "AI automatically ranks today's best crypto opportunities.",
    path: "/dashboard/alpha-scanner",
  },
  {
    icon: Waves,
    title: "Smart Wallet Tracker",
    description: "Track real-time buys from top smart wallets on Solana.",
    path: "/dashboard/smart-money",
  },
  {
    icon: Briefcase,
    title: "Portfolio Doctor",
    description:
      "Connect your wallet for a live analysis of holdings, allocation, and risk.",
    path: "/dashboard/portfolio-doctor",
  },
  {
    icon: Search,
    title: "Token Intelligence",
    description: "Generate institutional-grade research for any token.",
    path: "/dashboard/token-intelligence",
  },
  {
    icon: Swords,
    title: "Asset Battle",
    description: "Compare two crypto assets side by side with AI.",
    path: "/dashboard/asset-battle",
  },
];

function Dashboard() {
  return (
    <DashboardLayout>
      <div className="dash-wrap">
        <div className="dash-header">
          <h1>SignalMint AI</h1>
          <p>Your AI-powered crypto research workspace.</p>
        </div>

        <div className="dash-grid">
          {tools.map((tool) => {
            const Icon = tool.icon;

            if (!tool.path) {
              return (
                <div key={tool.title} className="dash-card dash-card-disabled">
                  <div>
                    <Icon size={26} className="dash-card-icon" />
                    <h2>{tool.title}</h2>
                    <p>{tool.description}</p>
                  </div>
                  <span className="dash-soon-badge">Coming Soon</span>
                </div>
              );
            }

            return (
              <Link key={tool.title} to={tool.path} className="dash-card-link">
                <div className="dash-card">
                  <div>
                    <Icon size={26} className="dash-card-icon" />
                    <h2>{tool.title}</h2>
                    <p>{tool.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
