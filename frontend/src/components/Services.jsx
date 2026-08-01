import { Link } from "react-router-dom";
import { Star, BarChart3, Waves, Briefcase, Search, Swords } from "lucide-react";

function Services() {
  const services = [
    {
      Icon: Star,
      title: "Opportunity Radar",
      description:
        "Discover high-conviction crypto opportunities before the market catches on.",
      path: "/dashboard/opportunity-radar",
    },
    {
      Icon: BarChart3,
      title: "Alpha Scanner",
      description:
        "Scan today's market and generate AI-powered market intelligence.",
      path: "/dashboard/alpha-scanner",
    },
    {
      Icon: Waves,
      title: "Smart Wallet Tracker",
      description:
        "Track real-time buys and sells from top smart wallets on Solana and Robinhood Chain.",
      path: "/dashboard/smart-money",
    },
    {
      Icon: Briefcase,
      title: "Portfolio Doctor",
      description:
        "Connect your wallet for a live, AI-written breakdown of your real holdings.",
      path: "/dashboard/portfolio-doctor",
    },
    {
      Icon: Search,
      title: "Token Intelligence",
      description:
        "Ask a real question and get an institutional-grade due diligence report.",
      path: "/dashboard/token-intelligence",
    },
    {
      Icon: Swords,
      title: "Asset Battle",
      description:
        "Compare two crypto assets side by side with a neutral AI verdict.",
      path: "/dashboard/asset-battle",
    },
  ];

  return (
    <section className="services" id="services">
      <p className="section-tag">OUR SERVICES</p>

      <h2>
        AI services built for
        <br />
        modern crypto investors
      </h2>

      <div className="services-grid services-grid-6">
        {services.map(({ Icon, title, description, path }) => (
          <Link to={path} className="service-card" key={title}>
            <div className="service-hex-badge">
              <div className="service-hex-inner">
                <Icon size={26} />
              </div>
            </div>

            <h3>{title}</h3>

            <p>{description}</p>

            <button>Launch →</button>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default Services;
