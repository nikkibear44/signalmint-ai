import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { getSmartMoney, getRobinhoodSmartMoney } from "../services/api";

const CHAINS = {
  solana: {
    label: "Solana",
    badgeColor: "#9945FF",
    badgeLetter: "S",
    tokenExplorer: (mint) => `https://solscan.io/token/${mint}`,
    addressExplorer: (address) => `https://solscan.io/account/${address}`,
  },
  robinhood: {
    label: "Robinhood Chain",
    badgeColor: "#00C805",
    badgeLetter: "R",
    tokenExplorer: (mint) => `https://robinhoodchain.blockscout.com/token/${mint}`,
    addressExplorer: (address) =>
      `https://robinhoodchain.blockscout.com/address/${address}`,
  },
};

function formatUsd(value) {
  const num = Number(value) || 0;

  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }

  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  }

  return `$${num.toFixed(2)}`;
}

function shortAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function buildTopPicks(feed) {
  const byToken = {};

  feed.forEach((tx) => {
    if (tx.side !== "BUY") return;

    const key = tx.mint;

    if (!byToken[key]) {
      byToken[key] = {
        mint: tx.mint,
        name: tx.name,
        symbol: tx.symbol,
        totalBuyUsd: 0,
        wallets: new Set(),
      };
    }

    byToken[key].totalBuyUsd += Number(tx.value_usd) || 0;
    byToken[key].wallets.add(tx.wallet);
  });

  const ranked = Object.values(byToken)
    .map((token) => ({
      ...token,
      walletCount: token.wallets.size,
      score: token.totalBuyUsd + token.wallets.size * 500,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return ranked;
}

function SmartMoney() {
  const [selectedChain, setSelectedChain] = useState("solana");
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const chain = CHAINS[selectedChain];

  useEffect(() => {
    async function loadFeed() {
      setLoading(true);
      setError("");

      try {
        const data =
          selectedChain === "solana"
            ? await getSmartMoney()
            : await getRobinhoodSmartMoney();

        setFeed(data.results || []);
      } catch (err) {
        setError("Unable to load Smart Money feed.");
      }

      setLoading(false);
    }

    loadFeed();
  }, [selectedChain]);

  const topPicks = useMemo(() => buildTopPicks(feed), [feed]);

  return (
    <DashboardLayout>
      <div className="sm-header">
        <h1>🐋 Smart Wallet Tracker</h1>
        <p>
          Live buy and sell activity from tracked whale wallets, with
          estimated USD value and AI-generated insight per trade.
        </p>
      </div>

      {/* Chain selector */}
      <div className="pd-chain-tabs">
        {Object.entries(CHAINS).map(([key, c]) => (
          <button
            key={key}
            className={`pd-chain-tab ${
              selectedChain === key ? "pd-chain-tab-active" : ""
            }`}
            onClick={() => setSelectedChain(key)}
          >
            <span className="pd-chain-dot" style={{ background: c.badgeColor }}>
              {c.badgeLetter}
            </span>
            {c.label}
          </button>
        ))}
      </div>

      {error && <div className="sm-error">{error}</div>}

      {!error && (
        <>
          <div className="sm-section-label">Top Smart Money Picks Today</div>

          {loading && (
            <div className="sm-picks-grid">
              {[0, 1, 2].map((i) => (
                <div key={i} className="sm-pick-card sm-skeleton-row" />
              ))}
            </div>
          )}

          {!loading && topPicks.length === 0 && (
            <div className="sm-empty">
              No strong buy signals detected yet today.
            </div>
          )}

          {!loading && topPicks.length > 0 && (
            <div className="sm-picks-grid">
              {topPicks.map((pick, index) => (
                <div key={pick.mint} className="sm-pick-card">
                  <div className="sm-pick-rank">#{index + 1} PICK</div>
                  <a
                    className="sm-pick-name sm-link"
                    href={chain.tokenExplorer(pick.mint)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {pick.name} ({pick.symbol}) ↗
                  </a>

                  <div className="sm-pick-stat">
                    <span>Total Buy Volume</span>
                    <span>{formatUsd(pick.totalBuyUsd)}</span>
                  </div>

                  <div className="sm-pick-stat">
                    <span>Whale Wallets Buying</span>
                    <span>{pick.walletCount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="sm-section-label">Live Feed</div>

          {loading && (
            <div className="sm-table-wrap">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="sm-skeleton-row" />
              ))}
            </div>
          )}

          {!loading && feed.length === 0 && (
            <div className="sm-empty">No recent whale activity found.</div>
          )}

          {!loading && feed.length > 0 && (
            <div className="sm-table-wrap">
              <table className="sm-table">
                <thead>
                  <tr>
                    <th>Wallet</th>
                    <th>Side</th>
                    <th>Token</th>
                    <th>Amount</th>
                    <th>Price</th>
                    <th>Value</th>
                    <th>Insight</th>
                  </tr>
                </thead>

                <tbody>
                  {feed.map((tx, index) => (
                    <tr key={`${tx.signature}-${tx.mint}-${index}`}>
                      <td>
                        <div className="sm-wallet-name">{tx.wallet}</div>
                        <a
                          className="sm-wallet-address sm-link"
                          href={chain.addressExplorer(tx.wallet_address)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {shortAddress(tx.wallet_address)} ↗
                        </a>
                      </td>

                      <td>
                        <span
                          className={`sm-badge ${
                            tx.side === "BUY"
                              ? "sm-badge-buy"
                              : "sm-badge-sell"
                          }`}
                        >
                          {tx.side}
                        </span>
                      </td>

                      <td>
                        <a
                          className="sm-link"
                          href={chain.tokenExplorer(tx.mint)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {tx.name} ({tx.symbol}) ↗
                        </a>
                      </td>

                      <td>
                        {Number(tx.amount).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      <td>
                        {tx.price_unavailable
                          ? "Price unavailable"
                          : `$${Number(tx.price_usd).toLocaleString(undefined, {
                              maximumFractionDigits: 6,
                            })}`}
                      </td>

                      <td>{formatUsd(tx.value_usd)}</td>

                      <td>
                        <span className="sm-insight">{tx.ai_insight}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

export default SmartMoney;
