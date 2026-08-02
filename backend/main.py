from datetime import datetime, timezone
import json as _json

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel

import x402_payment

from market_snapshot import get_global_market
from trending import get_trending_tokens
from alpha_scanner import scan_alpha
from smart_money import get_smart_money
from wallet_portfolio import get_wallet_portfolio
from evm_portfolio import get_evm_portfolio
from robinhood_smart_money import get_robinhood_smart_money

from agent import (
    crypto_analysis,
    compare_tokens,
    narrative_detector,
    portfolio_review,
    due_diligence,
    generate_trade_plan,
    due_diligence_premium,
    compare_tokens_premium,
    build_portfolio_allocation,
    find_hidden_alpha,
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


def render_response(request, data):
    """
    Returns a nicely formatted, branded HTML page if the request came from a
    browser (Accept header includes text/html) - otherwise returns normal
    JSON, completely unchanged for real API/agent callers.
    """

    accept = request.headers.get("accept", "")

    if "text/html" not in accept:
        return data

    pretty_json = _json.dumps(data, indent=2, default=str)

    html = f"""
<!DOCTYPE html>
<html>
<head>
  <title>SignalMint AI - API Response</title>
  <style>
    body {{
      background: #0a0a0a;
      color: #e0e0e0;
      font-family: 'SF Mono', Consolas, monospace;
      padding: 32px;
      margin: 0;
    }}
    .header {{
      color: #2ee6b8;
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 20px;
      letter-spacing: 0.5px;
    }}
    pre {{
      background: #111;
      border: 1px solid #222;
      border-radius: 14px;
      padding: 24px;
      font-size: 13px;
      line-height: 1.7;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }}
  </style>
</head>
<body>
  <div class="header">⚡ SignalMint AI — API Response</div>
  <pre>{pretty_json}</pre>
</body>
</html>
"""

    return HTMLResponse(content=html)


# ===========================
# Request Models
# ===========================

class AnalyzeRequest(BaseModel):
    query: str
    coingecko_id: str | None = None


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


class PortfolioBuilderRequest(BaseModel):
    budget: float
    risk_tolerance: str


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

    result = crypto_analysis(data.query, known_coingecko_id=data.coingecko_id)

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
# Due Diligence (paid, x402)
# ===========================

def _x402_challenge_response(resource_url: str, description: str, status_code: int = 402, error: str = None) -> JSONResponse:
    payload = x402_payment.build_402_payload(
        resource_url=resource_url,
        description=description,
    )

    body = dict(payload)
    if error:
        body["error"] = error

    response = JSONResponse(status_code=status_code, content=body)
    response.headers["PAYMENT-REQUIRED"] = x402_payment.encode_header(payload)
    return response


@app.post("/x402/due-diligence")
def due_diligence_paid(data: DueDiligenceRequest, request: Request):

    if not data.project.strip():
        return {"error": "Project cannot be empty."}

    resource_url = str(request.url)
    description = "AI-generated crypto project due diligence report"

    payment_header = request.headers.get("PAYMENT-SIGNATURE") or request.headers.get("X-PAYMENT")

    if not payment_header:
        return _x402_challenge_response(resource_url, description)

    try:
        settlement = x402_payment.verify_and_settle(payment_header)
    except x402_payment.PaymentVerificationError as e:
        return _x402_challenge_response(resource_url, description, error=str(e))

    result = due_diligence_premium(data.project)

    response = response_template("x402/due-diligence")
    response.update(
        {
            "project": data.project,
            "report": result,
        }
    )

    resp = JSONResponse(content=response)
    resp.headers["PAYMENT-RESPONSE"] = x402_payment.encode_header(settlement)
    return resp


# ===========================
# Compare Tokens (paid, x402)
# ===========================

@app.post("/x402/compare")
def compare_paid(data: CompareRequest, request: Request):

    if not data.token1.strip() or not data.token2.strip():
        return {"error": "Both token1 and token2 are required."}

    resource_url = str(request.url)
    description = "AI-generated crypto token comparison report"

    payment_header = request.headers.get("PAYMENT-SIGNATURE") or request.headers.get("X-PAYMENT")

    if not payment_header:
        return _x402_challenge_response(resource_url, description)

    try:
        settlement = x402_payment.verify_and_settle(payment_header)
    except x402_payment.PaymentVerificationError as e:
        return _x402_challenge_response(resource_url, description, error=str(e))

    result = compare_tokens_premium(data.token1, data.token2)

    response = response_template("x402/compare")
    response.update(
        {
            "token1": data.token1,
            "token2": data.token2,
            "report": result,
        }
    )

    resp = JSONResponse(content=response)
    resp.headers["PAYMENT-RESPONSE"] = x402_payment.encode_header(settlement)
    return resp


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
def market_snapshot(request: Request):

    data = get_global_market()

    if not data:
        return render_response(request, {
            "success": False,
            "message": "Unable to fetch market snapshot."
        })

    return render_response(request, {
        "success": True,
        "data": data
    })


# ===========================
# Alpha Scanner
# ===========================

@app.get("/alpha-scanner")
async def alpha_scanner(request: Request):
    """
    Returns the top AI-ranked crypto opportunities. The top 5 picks
    also include a real, computed entry/TP/SL trade plan - kept to
    top 5 only for speed/cost, since each plan requires a real AI
    call.
    """

    data = scan_alpha()

    for pick in data[:5]:
        try:
            pick["trade_plan"] = generate_trade_plan(pick)
        except Exception as e:
            print(f"[Alpha Scanner] Trade plan generation failed for {pick.get('symbol')}: {e}")
            pick["trade_plan"] = None

    response = response_template("/alpha-scanner")
    response["results"] = data

    return render_response(request, response)


# ===========================
# Portfolio Builder
# ===========================

@app.post("/portfolio-builder")
def portfolio_builder(data: PortfolioBuilderRequest):

    if data.budget <= 0:
        return {"success": False, "message": "Budget must be greater than 0."}

    try:
        return build_portfolio_allocation(data.budget, data.risk_tolerance)
    except Exception as e:
        print(f"[Portfolio Builder Error] {e}")

        return {
            "success": False,
            "message": "Unable to build portfolio allocation.",
        }


# ===========================
# Hidden Alpha
# ===========================

@app.get("/hidden-alpha")
def hidden_alpha(request: Request):

    try:
        return render_response(request, find_hidden_alpha())
    except Exception as e:
        print(f"[Hidden Alpha Error] {e}")

        return render_response(request, {
            "success": False,
            "message": "Unable to find hidden alpha right now.",
        })


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
def trending(request: Request):

    return render_response(request, {
        "success": True,
        "data": get_trending_tokens(),
    })


# ===========================
# Smart Money
# ===========================

@app.get("/smart-money")
def smart_money(request: Request):

    return render_response(request, {
        "success": True,
        "results": get_smart_money(),
    })


# ===========================
# Robinhood Chain Smart Money
# ===========================

@app.get("/robinhood-smart-money")
def robinhood_smart_money(request: Request):

    try:
        return render_response(request, {
            "success": True,
            "results": get_robinhood_smart_money(),
        })
    except Exception as e:
        print(f"[Robinhood Smart Money Error] {e}")

        return render_response(request, {
            "success": False,
            "message": "Unable to fetch Robinhood Chain smart money feed.",
        })


# ===========================
# Wallet Portfolio (Solana)
# ===========================

@app.get("/wallet-portfolio/{address}")
def wallet_portfolio(address: str, request: Request):

    if not address.strip():
        return render_response(request, {"success": False, "message": "Wallet address is required."})

    try:
        data = get_wallet_portfolio(address)

        return render_response(request, {
            "success": True,
            "data": data,
        })
    except Exception as e:
        print(f"[Wallet Portfolio Error] {e}")

        return render_response(request, {
            "success": False,
            "message": "Unable to fetch wallet portfolio.",
        })


# ===========================
# EVM Portfolio (Robinhood Chain, Stable Mainnet)
# ===========================

@app.get("/evm-portfolio/{chain}/{address}")
def evm_portfolio(chain: str, address: str, request: Request):

    if not address.strip():
        return render_response(request, {"success": False, "message": "Wallet address is required."})

    try:
        return render_response(request, get_evm_portfolio(chain, address))
    except Exception as e:
        print(f"[EVM Portfolio Error] {e}")

        return render_response(request, {
            "success": False,
            "message": "Unable to fetch EVM wallet portfolio.",
        })
