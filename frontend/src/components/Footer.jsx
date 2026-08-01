import { ExternalLink } from "lucide-react";

function GithubIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.535-1.53.115-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.65 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <h2>SignalMint</h2>
          <p>
            AI-powered crypto market intelligence built for modern
            investors.
          </p>
        </div>

        <div className="footer-columns">
          <div className="footer-col">
            <h4>Product</h4>
            <a href="/dashboard">Launch App</a>
            <a href="#services">Services</a>
            <a href="#why">Why SignalMint</a>
            <a href="#architecture">Architecture</a>
          </div>

          <div className="footer-col">
            <h4>Ecosystem</h4>
            <a
              href="https://solana.com"
              target="_blank"
              rel="noreferrer"
            >
              Solana <ExternalLink size={12} />
            </a>
            <a
              href="https://web3.okx.com/"
              target="_blank"
              rel="noreferrer"
            >
              OKX Wallet <ExternalLink size={12} />
            </a>
            <a
              href="https://dexscreener.com"
              target="_blank"
              rel="noreferrer"
            >
              DexScreener <ExternalLink size={12} />
            </a>
            <a
              href="https://www.helius.dev/"
              target="_blank"
              rel="noreferrer"
            >
              Helius <ExternalLink size={12} />
            </a>
          </div>

          <div className="footer-col">
            <h4>Resources</h4>
            <a
              href="https://github.com/nikkibear44/signalmint-ai"
              target="_blank"
              rel="noreferrer"
            >
              <GithubIcon /> GitHub
            </a>
            <a
              href="https://x.com/signalmint_ai"
              target="_blank"
              rel="noreferrer"
            >
              <XIcon /> Twitter
            </a>
            <a
              href="https://signalmint-ai.onrender.com"
              target="_blank"
              rel="noreferrer"
            >
              API Status <ExternalLink size={12} />
            </a>
            <a href="#x402">
              ⚡ x402 Payments
            </a>
          </div>
        </div>
      </div>

      <p className="copyright">
        © 2026 SignalMint. Built for the OKX AI Genesis Hackathon.
      </p>
    </footer>
  );
}

export default Footer;
