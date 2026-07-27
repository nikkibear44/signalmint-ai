# SignalMint AI

**One intelligence engine. AI-powered crypto research, opportunity discovery, whale tracking, and portfolio analysis — built for the OKX AI Genesis Hackathon.**

SignalMint AI turns live crypto market data into actionable intelligence. Instead of five disconnected tools, every feature shares one underlying intelligence engine — the same market data, AI reasoning, and analysis pipeline power everything you see.

🔗 **Live demo:** https://signalmint-ai.vercel.app/
🎥 **Demo video:** https://x.com/signalmint_ai/status/2081711659446669561?s=20
🆔 **OKX.AI Agent ID:** `#9708`

> **Note:** The backend runs on a free Render instance, which spins down after inactivity. The first request after idle time may take 30-50 seconds to respond while it wakes up — subsequent requests are fast.

---

## Why SignalMint AI

Most crypto tools either dump raw data on you or generate generic AI text with no real market grounding. SignalMint AI does neither:

- **📡 Live Market Data** — real-time data from CoinGecko, DexScreener, Helius, and DeFiLlama, not stale snapshots
- **🧠 AI Reasoning** — the AI analyzes actual market conditions and on-chain data, not just answering a prompt in a vacuum
- **⚡ One Intelligence Engine** — every tool shares the same underlying data and reasoning pipeline, so insights stay consistent across the platform
- **📄 Professional Reports** — structured, readable output built for traders and investors, not walls of JSON

---

## Features (Shipped)

### ⭐ Opportunity Radar
Analyzes any token and returns an AI Opportunity Score (0–100), a BUY/SELL/HOLD signal with confidence %, key catalysts, risk assessment, and a full research report. Includes a persistent AI Watchlist to track picks over time.

### 📊 Alpha Scanner
Automatically scans and ranks today's highest-conviction market opportunities. Each pick opens into a full AI-generated action plan — entry zone, take profit, stop loss, holding period, and risk/reward.

### 🐋 Smart Money (Whale Tracker)
Tracks real-time buy/sell activity from tracked whale wallets on Solana via Helius, with USD-valued trades, AI-generated insight per transaction, and a "Top Smart Money Picks Today" leaderboard ranked by real buy volume and wallet count.

### 💼 Portfolio Doctor
Connect an OKX Wallet and get a live analysis of real on-chain holdings — total value, per-token allocation, concentration risk scoring, and genuine AI-written portfolio advice (not templated text) generated from your actual holdings.

---

## Tech Stack

**Frontend:** React + Vite, React Router, `lucide-react` icons
**Backend:** FastAPI (Python), Uvicorn
**Data sources:** CoinGecko, DexScreener, Helius (Solana RPC + token metadata), DeFiLlama
**Wallet integration:** OKX Wallet (Solana provider)
**AI reasoning:** Custom prompt pipeline (`agent.py`, `prompts.py`) grounded in live market data
**Deployment:** Render (backend), Vercel (frontend)

---

## Architecture

```
Market Data (CoinGecko, DexScreener, Helius, DeFiLlama)
              │
              ▼
     Intelligence Engine (agent.py)
   AI reasoning grounded in real data
              │
              ▼
   ┌──────────┼──────────┬────────────┐
   ▼          ▼          ▼            ▼
Opportunity  Alpha    Smart Money  Portfolio
  Radar     Scanner    Tracker      Doctor
```

---

## Roadmap

This is what "done" actually looks like for SignalMint AI — both polishing what's shipped and completing what's already partially built.

### Phase 1 — Polish the 4 shipped features

| Feature | Planned improvements |
|---|---|
| **Opportunity Radar** | Historical score tracking per token (see how a score changed over time), configurable alert thresholds, multi-token comparison view |
| **Alpha Scanner** | Backtested accuracy tracking on past picks, filter by sector/market cap tier, personalized ranking based on user's risk profile |
| **Smart Money** | Expand tracked wallet list, let users add/track custom wallets, deduplicate transactions by signature, direct DexScreener chart links per token |
| **Portfolio Doctor** | Multi-chain support (currently Solana-only), rebalancing suggestions with specific target allocations, historical portfolio value tracking over time |

### Phase 2 — Ship the remaining 2 features

The backend logic for both already exists and is wired into the API (`main.py`) — only the frontend UI is left to build.

- **🔍 Token Intelligence** — institutional-grade due diligence reports. Backend: `due_diligence()` in `agent.py`, live at `POST /due-diligence`. Remaining: frontend page + report UI.
- **⚔️ Asset Battle** — side-by-side AI comparison of two tokens. Backend: `compare_tokens()` in `agent.py`, live at `POST /compare`. Remaining: frontend page + comparison UI.

### Phase 3 — Monetization

- Add x402-compliant payment verification to A2MCP endpoints (currently registered free) to enable pay-per-call pricing
- Explore premium tiers: deeper historical data, custom wallet tracking limits, priority AI report generation

### Phase 4 — Platform growth

- Multi-chain expansion beyond Solana (EVM chains via OKX Wallet's existing multi-chain support)
- Public API access for other agents/developers to build on top of SignalMint's intelligence engine
- Community features: shared watchlists, public leaderboards for top-performing picks

---

## Getting Started (Local Development)

### Backend
```bash
cd backend
pip install -r requirements.txt --break-system-packages
# Add your API keys to a .env file (HELIUS_API_KEY, etc.)
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
| `/smart-money` | GET | Live whale wallet transaction feed |
| `/wallet-portfolio/{address}` | GET | Real wallet holdings + AI portfolio analysis |
| `/market-snapshot` | GET | Global crypto market data |
| `/trending` | GET | Trending tokens |
| `/trade-plan` | POST | AI action plan for a specific coin |
| `/compare` | POST | AI comparison of two tokens *(backend ready, frontend pending)* |
| `/due-diligence` | POST | Institutional-grade project research *(backend ready, frontend pending)* |

---

## Built For

**OKX.AI Genesis Hackathon** — demonstrating how an agent-native economy works in practice, one Agent Service Provider at a time.

---

## License

MIT
