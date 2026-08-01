import { useState } from "react";

function X402Docs() {
  const [open, setOpen] = useState(false);

  return (
    <section className="x402-section" id="x402">
      <button
        className="x402-toggle"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="x402-toggle-left">
          <span className="x402-icon">⚡</span>
          <div>
            <div className="x402-toggle-title">
              Real x402 Payments — Not a Mockup
            </div>
            <div className="x402-toggle-sub">
              Two services accept genuine on-chain payments. Click to see how it works.
            </div>
          </div>
        </div>
        <span className="x402-chevron">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="x402-body">
          <p className="x402-intro">
            SignalMint AI is one of the few OKX.AI submissions with genuine,
            tested x402 payment integration — not just an API that claims to
            accept payment, but a fully working loop verified end-to-end
            with real settled transactions on X Layer.
          </p>

          <div className="x402-steps">
            <div className="x402-step">
              <span className="x402-step-num">1</span>
              <div>
                <strong>Request without payment</strong>
                <p>
                  A caller (AI agent or a connected browser wallet) hits a
                  paid endpoint. No payment header means the server responds
                  with HTTP 402 — a structured challenge stating the exact
                  price, asset, and recipient.
                </p>
              </div>
            </div>

            <div className="x402-step">
              <span className="x402-step-num">2</span>
              <div>
                <strong>Sign a Permit2 authorization</strong>
                <p>
                  The payer's wallet signs an EIP-712 typed-data message
                  authorizing a transfer of 0.05 USDT0 on X Layer — via
                  Uniswap's audited Permit2 contract, not a custom transfer
                  mechanism.
                </p>
              </div>
            </div>

            <div className="x402-step">
              <span className="x402-step-num">3</span>
              <div>
                <strong>Verify and settle on-chain</strong>
                <p>
                  SignalMint's backend independently re-validates the price,
                  asset, and recipient before trusting the signature — a
                  buyer can't submit a signature for a lower amount and still
                  get the report. Once verified, the payment settles on X
                  Layer.
                </p>
              </div>
            </div>

            <div className="x402-step">
              <span className="x402-step-num">4</span>
              <div>
                <strong>Report delivered only after settlement</strong>
                <p>
                  The AI-generated report (Institutional Due Diligence or
                  Asset Battle Comparison) is only returned once the
                  on-chain transaction is confirmed — never before.
                </p>
              </div>
            </div>
          </div>

          <div className="x402-proof">
            <div className="x402-proof-label">🔗 Real on-chain proof</div>
            <a
              href="https://www.oklink.com/x-layer/tx/0xd96f3544f70b5f6c8ebaf52ece90ded1e0f6d9d6b85eca3616add636e34f3ad0"
              target="_blank"
              rel="noreferrer"
              className="x402-proof-link"
            >
              View a real settled payment transaction on X Layer explorer ↗
            </a>
          </div>

          <div className="x402-tiers">
            <div className="x402-tier">
              <span className="x402-tier-badge">AGENT</span>
              Available as paid A2MCP services on OKX.AI (Agent #9708)
            </div>
            <div className="x402-tier">
              <span className="x402-tier-badge">BROWSER</span>
              Also payable directly on this site via OKX Wallet — try it on
              Token Intelligence or Asset Battle
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default X402Docs;
