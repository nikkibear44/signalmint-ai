import { Link } from "react-router-dom";

function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">

        <p className="hero-badge">
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
          <Link to="/dashboard" className="primary-btn">
  Launch App
</Link>

          <button className="secondary-btn">
            View GitHub
          </button>
        </div>

      </div>
    </section>
  );
}

export default Hero;