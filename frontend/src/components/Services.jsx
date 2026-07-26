import { Link } from "react-router-dom";

function Services() {
  const services = [
    {
      icon: "⭐",
      title: "Opportunity Radar",
      description:
        "Discover high-conviction crypto opportunities before the market catches on.",
      path: "/dashboard/opportunity-radar",
    },
    {
      icon: "📊",
      title: "Alpha Scanner",
      description:
        "Scan today's market and generate AI-powered market intelligence.",
      path: "/dashboard",
    },
    {
      icon: "🔍",
      title: "Token Intelligence",
      description:
        "Professional AI research with live market data, narratives, and risks.",
      path: "/dashboard",
    },
    {
      icon: "⚔️",
      title: "Asset Battle",
      description:
        "Compare two crypto assets side by side with AI insights.",
      path: "/dashboard",
    },
    {
      icon: "💼",
      title: "Portfolio Doctor",
      description:
        "Analyze allocation, diversification, and portfolio risk instantly.",
      path: "/dashboard",
    },
  ];

  return (
    <section className="services" id="services">
      <p className="section-tag">
        OUR SERVICES
      </p>

      <h2>
        AI services built for
        <br />
        modern crypto investors
      </h2>

      <div className="services-grid">
        {services.map((service) => (
          <Link
            to={service.path}
            className="service-card"
            key={service.title}
          >
            <div className="service-icon">
              {service.icon}
            </div>

            <h3>{service.title}</h3>

            <p>{service.description}</p>

            <button>
              Launch →
            </button>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default Services;