import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
  <img src={logo} alt="SignalMint Logo" className="navbar-logo-img" />

  <h2>
    SignalMint<span>AI</span>
  </h2>
</Link>

      <div className="navbar-menu">
        <a href="#services">Services</a>
        <a href="#why">Why</a>
        <a href="#architecture">Architecture</a>
        <a
          href="https://github.com/nikkibear44/signalmint-ai"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </div>

      <Link to="/dashboard" className="launch-button">
  Launch App
</Link>
    </nav>
  );
}

export default Navbar;