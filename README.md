# SignalMint AI

**One intelligence engine. Six AI-powered crypto tools. Built for the OKX AI Genesis Hackathon.**

SignalMint AI turns live crypto market data into actionable intelligence. Instead of disconnected tools, every feature shares one underlying intelligence engine — the same market data, AI reasoning, and analysis pipeline power everything you see.

🔗 **Live demo:** https://signalmint-ai.vercel.app
🆔 **OKX.AI Agent ID:** `#9708`

> **Note:** The backend runs on a free Render instance, which spins down after inactivity. The first request after idle time may take 30-50 seconds to respond while it wakes up — subsequent requests are fast.

---

## Real Track Record — Smart Money

SignalMint's Smart Money whale tracker isn't a backtest or a simulation — it's a live feed of real tracked wallets. Two real calls surfaced by the feature itself:

- **$CASHCAT** — flagged by tracked whale buying at approximately **$12K market cap**. Currently trading at a market cap over **$43M**.
- **$ANSEM (The Black Bull)** — flagged by tracked whale buying at approximately **$40K market cap**. Currently trading at a market cap over **$71M**.

These are real, personally tracked calls surfaced by the same whale-tracking infrastructure live on the site today — not backtested or cherry-picked after the fact.

---

## Why SignalMint AI

Most crypto tools either dump raw data on you or generate generic AI text with no real market grounding. SignalMint AI does neither:

- **📡 Live Market Data** — real-time data from CoinGecko, DexScreener, Helius, Blockscout, and on-chain RPC calls — with automatic fallback when one source doesn't have a token
- **🧠 AI Reasoning** — the AI analyzes actual market conditions and on-chain data, and is explicit about what's verified versus general knowledge — it never fabricates numbers it doesn't have
- **⚡ One Intelligence Engine** — every tool shares the same underlying data and reasoning pipeline, so insights stay consistent across the platform
- **💳 Real Payments** — two services are gated by genuine x402 payment verification on X Layer, tested end-to-end with real settled transactions, not mocked

---

## Wallet Safety

Connecting a wallet to Portfolio Doctor is **read-only by design**:

- **No private keys or seed phrases are ever requested.** Wallet connection uses each wallet's standard, public `connect()` API (Phantom for Solana, OKX Wallet for EVM chains) — the same read-only account-access request used by virtually every dapp, including Uniswap, OpenSea, and every major DeFi protocol.
- **No transaction signing happens anywhere in Portfolio Doctor.** The feature only reads your public wallet address, then queries public blockchain data (via Helius, Blockscout, and on-chain RPC calls) using that address alone — the same information anyone can already see on a public block explorer.
- **Nothing is executed on your behalf, anywhere in the product.** Even the "Prepare Execution" feature in Opportunity Radar never signs or sends a transaction itself — it only generates a ready-to-review instruction for your own agent to execute, with your own explicit confirmation at every step.
- **Verify it yourself — this is open source.** See [`WalletContext.jsx`](https://github.com/nikkibear44/signalmint-ai/blob/main/frontend/src/context/WalletContext.jsx) and [`PortfolioDoctor.jsx`](https://github.com/nikkibear44/signalmint-ai/blob/main/frontend/src/pages/PortfolioDoctor.jsx) directly in the repo. Search for `signTransaction`, `signMessage`, or `sendTransaction` — you won't find any of them in the wallet connection code, because they're never used.

---

## Features (All 6 Shipped)

### ⭐ Opportunity Radar
Analyzes any token and returns an AI Opportunity Score (0–100), a BUY/SELL/HOLD signal with confidence %, key catalysts, risk assessment, and a full research report. Includes an **AI Decision Center** with concrete entry zone/take profit/stop loss targets when real price data supports it, a persistent AI Watchlist, and a **Prepare Execution** flow that generates a ready-to-send trade instruction for your own agent to execute via OKX DEX — SignalMint never holds funds or executes trades itself.

### 📊 Alpha Scanner
Automatically scans and ranks today's highest-conviction market opportunities. Each pick opens into a full AI-generated action plan — entry zone, take profit, stop loss, holding period, and risk/reward.

### 🐋 Smart Money (Whale Tracker)
Tracks real-time buy/sell activity from tracked whale wallets across **Solana** and **Robinhood Chain**, with USD-valued trades, AI-generated insight per transaction, and a "Top Smart Money Picks Today" leaderboard ranked by real buy volume and wallet count. Auto-refreshes every 30 seconds.

### 💼 Portfolio Doctor
Connect a wallet and get a live analysis of real on-chain holdings — across **Solana** (Phantom), **Robinhood Chain**, and **Stable Mainnet** (OKX Wallet). Includes real ERC-20 token discovery via Blockscout + DexScreener pricing, concentration risk scoring, and genuine AI-written portfolio advice generated from actual holdings — not templated text.

### 🔍 Token Intelligence
Ask a real question — *"Is Uniswap a good long-term hold?"* — or just type a project name. Generates an institutional-grade due diligence report (Team & Backers, Technology, Tokenomics, Ecosystem, Adoption, Competitive Landscape, Bull/Bear Case, Risk Assessment) grounded in live verified data, with a natural-language extraction step so you don't need to know the exact token name. Cross-references analyzed tokens against SignalMint's own whale-tracking data — if a tracked wallet has traded the token, the report cites it as a real, verified signal.

### ⚔️ Asset Battle
Side-by-side AI comparison of two crypto assets — market position, strengths, weaknesses, and a neutral AI verdict, with real market data tables (price, market cap, volume, ATH/ATL, supply, sentiment).

---

## Paid Services (x402 on X Layer)

Two features are also available as **paid A2MCP services** on OKX.AI, gated by real x402 payment verification — tested locally and against the live production endpoint with genuine on-chain settled transactions before being registered:

| Service | Price | Endpoint |
|---|---|---|
| Institutional Due Diligence | 0.05 USDT0 | `/x402/due-diligence` |
| Asset Battle Comparison | 0.05 USDT0 | `/x402/compare` |

The remaining four services are registered as free A2MCP services on the same ASP (`#9708`).

---

## Tech Stack

**Frontend:** React + Vite, React Router, `lucide-react` icons, `remark-gfm` for markdown tables
**Backend:** FastAPI (Python), Uvicorn
**Data sources:** CoinGecko, DexScreener, Helius (Solana RPC + token metadata), Blockscout (Robinhood Chain), on-chain RPC calls (X Layer, Robinhood Chain, Stable Mainnet)
**Wallet integration:** OKX Wallet (EVM chains), Phantom (Solana)
**Payments:** x402 protocol via OKX Agent Payments Protocol, settled in USDT0 on X Layer
**AI reasoning:** Custom prompt pipeline (`agent.py`, `prompts.py`) grounded in live market data, with explicit verified-vs-general-knowledge labeling
**Deployment:** Render (backend), Vercel (frontend)

---

## Architecture

```
Market Data (CoinGecko, DexScreener, Helius, Blockscout, on-chain RPC)
              │
              ▼
     Intelligence Engine (agent.py)
   AI reasoning grounded in real data
              │
   ┌──────────┼──────────┬────────────┬──────────────┬─────────────┐
   ▼          ▼          ▼            ▼              ▼             ▼
Opportunity  Alpha    Smart Money  Portfolio      Token        Asset
  Radar     Scanner    Tracker      Doctor      Intelligence   Battle
```

---

## Roadmap

### ✅ Phase 1 — Core platform (shipped)
All 6 features live, multi-chain wallet support, real-time whale tracking, natural language due diligence.

### ✅ Phase 2 — Monetization (shipped)
Real x402 payment verification built and tested end-to-end (local + live production, on-chain verified) for 2 services. Registered as paid A2MCP services on OKX.AI.

### ✅ Phase 3 — Differentiation (shipped)
Whale-activity cross-linking in Token Intelligence, real on-chain supply lookups for tokens without CoinGecko listings, DexScreener fallback for low-cap/new tokens, historical price context (7d/30d/1y, ATH/ATL).

### 🔜 Phase 4 — Real social attention data
Currently, Token Intelligence and Hidden Alpha use community size (Twitter/Reddit/Telegram follower counts, via CoinGecko) as a limited social proxy — explicitly labeled as size, not real-time attention. Genuine social attention tracking (trending velocity, sentiment, mention volume) would require a paid data source like LunarCrush, Santiment, or Twitter's API v2 — evaluated but not yet integrated given cost.

### 🔜 Phase 5 — Expand paid tier
Add x402 payment to the remaining 4 services. Explore tiered pricing and a subscription pass alongside pay-per-call.

### 🔜 Phase 6 — Deeper chain coverage
Expand Portfolio Doctor's ERC-20 discovery to X layer mainnet and Stable Mainnet (currently native-token-only, pending a free block explorer API for that chain). Add more tracked whale wallets across both chains.

### 🔜 Phase 7 — Platform growth
Public API access for other agents/developers to build on SignalMint's intelligence engine. Community features: shared watchlists, public leaderboards for top-performing picks.

---

## Getting Started (Local Development)

### Backend
```bash
cd backend
pip install -r requirements.txt --break-system-packages
# Add your API keys to a .env file (HELIUS_API_KEY, COINGECKO_API_KEY, OPENAI_API_KEY, OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE)
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/analyze` | POST | Full AI analysis + Opportunity Score for a token |
| `/alpha-scanner` | GET | Today's AI-ranked top picks |
| `/smart-money` | GET | Live Solana whale wallet transaction feed |
| `/robinhood-smart-money` | GET | Live Robinhood Chain whale wallet transaction feed |
| `/wallet-portfolio/{address}` | GET | Real Solana wallet holdings + AI portfolio analysis |
| `/evm-portfolio/{chain}/{address}` | GET | Real EVM wallet holdings (Robinhood Chain, Stable Mainnet) |
| `/market-snapshot` | GET | Global crypto market data |
| `/trending` | GET | Trending tokens |
| `/trade-plan` | POST | AI action plan for a specific coin |
| `/compare` | POST | AI comparison of two tokens (free) |
| `/due-diligence` | POST | Institutional-grade project research (free) |
| `/x402/due-diligence` | POST | Paid due diligence report, x402-gated (0.05 USDT0) |
| `/x402/compare` | POST | Paid asset comparison, x402-gated (0.05 USDT0) |

---

## Built For

**OKX.AI Genesis Hackathon** — demonstrating how an agent-native economy works in practice, one Agent Service Provider at a time.

---

## License

MIT
