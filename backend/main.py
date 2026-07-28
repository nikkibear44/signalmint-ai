from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from market_snapshot import get_global_market
from trending import get_trending_tokens
from alpha_scanner import scan_alpha
from smart_money import get_smart_money
from wallet_portfolio import get_wallet_portfolio
from evm_portfolio import get_evm_portfolio

from agent import (
    crypto_analysis,
    compare_tokens,
    narrative_detector,
    portfolio_review,
    due_diligence,
    generate_trade_plan,
)

from router import detect_intent

app = FastAPI(
    title="SignalMint AI",
    description="AI-powered crypto research platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===========================
# Request Models
# ===========================

class AnalyzeRequest(BaseModel):
    query: str


class CompareRequest(BaseModel):
    token1: str
    token2: str


class NarrativeRequest(BaseModel):
    narrative: str


class PortfolioRequest(BaseModel):
    portfolio: str


class DueDiligenceRequest(BaseModel):
    project: str


class QueryRequest(BaseModel):
    query: str

class TradePlanRequest(BaseModel):
    coin: dict


# ===========================
# Helpers
# ===========================

def response_template(endpoint: str):
    return {
        "service": "SignalMint AI",
        "version": "1.0.0",
        "endpoint": endpoint,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


# ===========================
# Root
# ===========================

@app.get("/")
def home():
    return {
        "service": "SignalMint AI",
        "status": "running",
        "version": "1.0.0",
        "message": "AI-powered crypto research platform",
    }


# ===========================
# Analyze Token
# ===========================

@app.post("/analyze")
def analyze(data: AnalyzeRequest):

    if not data.query.strip():
        return {"error": "Query cannot be empty."}

    result = crypto_analysis(data.query)

    response = response_template("analyze")
    response.update(
        {
            "query": data.query,
            "market": result.get("market"),
            "report": result.get("report"),
            "insights": result.get("insights"),
        }
    )

    return response


# ===========================
# Compare Tokens
# ===========================

@app.post("/compare")
def compare(data: CompareRequest):

    result = compare_tokens(data.token1, data.token2)

    response = response_template("compare")
    response.update(
        {
            "token1": data.token1,
            "token2": data.token2,
            "report": result,
        }
    )

    return response


# ===========================
# Narrative
# ===========================

@app.post("/narrative")
def narrative(data: NarrativeRequest):

    if not data.narrative.strip():
        return {"error": "Narrative cannot be empty."}

    result = narrative_detector(data.narrative)

    response = response_template("narrative")
    response.update(
        {
            "narrative": data.narrative,
            "report": result,
        }
    )

    return response


# ===========================
# Portfolio
# ===========================

@app.post("/portfolio")
def portfolio(data: PortfolioRequest):

    if not data.portfolio.strip():
        return {"error": "Portfolio cannot be empty."}

    result = portfolio_review(data.portfolio)

    response = response_template("portfolio")
    response.update(
        {
            "portfolio": data.portfolio,
            "report": result,
        }
    )

    return response


# ===========================
# Due Diligence
# ===========================

@app.post("/due-diligence")
def due_diligence_report(data: DueDiligenceRequest):

    if not data.project.strip():
        return {"error": "Project cannot be empty."}

    result = due_diligence(data.project)

    response = response_template("due-diligence")
    response.update(
        {
            "project": data.project,
            "report": result,
        }
    )

    return response


# ===========================
# Smart Router
# ===========================

@app.post("/query")
def smart_query(data: QueryRequest):

    if not data.query.strip():
        return {"error": "Query cannot be empty."}

    route = detect_intent(data.query)

    if route["intent"] == "analyze":
        result = crypto_analysis(route["query"])

        return {
            "intent": "analyze",
            "market": result["market"],
            "report": result["report"],
            "insights": result.get("insights"),
        }

    elif route["intent"] == "compare":
        report = compare_tokens(route["token1"], route["token2"])

        return {
            "intent": "compare",
            "report": report,
        }

    elif route["intent"] == "narrative":
        report = narrative_detector(route["narrative"])

        return {
            "intent": "narrative",
            "report": report,
        }

    elif route["intent"] == "portfolio":
        report = portfolio_review(route["portfolio"])

        return {
            "intent": "portfolio",
            "report": report,
        }

    return {"error": "Unknown intent"}


# ===========================
# Market Snapshot
# ===========================

@app.get("/market-snapshot")
def market_snapshot():

    data = get_global_market()

    if not data:
        return {
            "success": False,
            "message": "Unable to fetch market snapshot."
        }

    return {
        "success": True,
        "data": data
    }


# ===========================
# Alpha Scanner
# ===========================

@app.get("/alpha-scanner")
async def alpha_scanner():
    """
    Returns the top AI-ranked crypto opportunities.
    """

    data = scan_alpha()

    response = response_template("/alpha-scanner")
    response["results"] = data

    return response


# ===========================
# AI Trade Plan
# ===========================

@app.post("/trade-plan")
def trade_plan(data: TradePlanRequest):

    report = generate_trade_plan(data.coin)

    response = response_template("trade-plan")
    response["report"] = report

    return response


# ===========================
# Trending Tokens
# ===========================

@app.get("/trending")
def trending():

    return {
        "success": True,
        "data": get_trending_tokens(),
    }


# ===========================
# Smart Money
# ===========================

@app.get("/smart-money")
def smart_money():

    return {
        "success": True,
        "results": get_smart_money(),
    }


# ===========================
# Wallet Portfolio (Solana)
# ===========================

@app.get("/wallet-portfolio/{address}")
def wallet_portfolio(address: str):

    if not address.strip():
        return {"success": False, "message": "Wallet address is required."}

    try:
        data = get_wallet_portfolio(address)

        return {
            "success": True,
            "data": data,
        }
    except Exception as e:
        print(f"[Wallet Portfolio Error] {e}")

        return {
            "success": False,
            "message": "Unable to fetch wallet portfolio.",
        }


# ===========================
# EVM Portfolio (Robinhood Chain, Stable Mainnet)
# ===========================

@app.get("/evm-portfolio/{chain}/{address}")
def evm_portfolio(chain: str, address: str):

    if not address.strip():
        return {"success": False, "message": "Wallet address is required."}

    try:
        return get_evm_portfolio(chain, address)
    except Exception as e:
        print(f"[EVM Portfolio Error] {e}")

        return {
            "success": False,
            "message": "Unable to fetch EVM wallet portfolio.",
        }