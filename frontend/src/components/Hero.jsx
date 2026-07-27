import { Link } from "react-router-dom";

function Hero() {
  return (
    <section className="hero">
      <div className="hero-glow" />

      <div className="hero-content">

        <p className="hero-badge">
          <span className="hero-badge-dot" />
          AI-Powered Crypto Intelligence
        </p>

        <h1>
          Market Intelligence
          <br />
          for Crypto
        </h1>

        <p className="hero-description">
          Transform live crypto market data into actionable
          intelligence using AI-powered research,
          opportunity discovery, and portfolio insights.
        </p>

        <div className="hero-buttons">
          <Link to="/dashboard" className="hero-cta-btn">
            Launch App
          </Link>

          <a
            href="https://github.com/nikkibear44/signalmint-ai"
            target="_blank"
            rel="noreferrer"
            className="secondary-btn"
          >
            View GitHub
          </a>
        </div>

      </div>
    </section>
  );
}

export default Hero;
