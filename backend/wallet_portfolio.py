import os
import requests
from dotenv import load_dotenv

from smart_money import get_token_metadata

try:
    from agent import portfolio_review
except Exception as e:
    print(f"[Wallet Portfolio] Could not import portfolio_review: {e}")
    portfolio_review = None

load_dotenv()

HELIUS_API_KEY = os.getenv("HELIUS_API_KEY")
RPC_URL = f"https://mainnet.helius-rpc.com/?api-key={HELIUS_API_KEY}"

TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
SOL_MINT = "So11111111111111111111111111111111111111112"


def _rpc(method, params):
    try:
        response = requests.post(
            RPC_URL,
            json={
                "jsonrpc": "2.0",
                "id": 1,
                "method": method,
                "params": params,
            },
            timeout=15,
        )

        data = response.json()

        if "error" in data:
            print(f"[Wallet Portfolio RPC Error] {method}: {data['error']}")
            return None

        return data.get("result")

    except Exception as e:
        print(f"[Wallet Portfolio RPC Exception] {method}: {e}")
        return None


def _get_sol_balance(address):
    result = _rpc("getBalance", [address])

    if not result:
        return 0

    lamports = result.get("value", 0)

    return lamports / 1_000_000_000


def _query_token_accounts(address, program_id):
    result = _rpc(
        "getTokenAccountsByOwner",
        [
            address,
            {"programId": program_id},
            {"encoding": "jsonParsed"},
        ],
    )

    if not result:
        print(f"[Wallet Portfolio] No result for program {program_id}")
        return []

    accounts = result.get("value", [])
    print(f"[Wallet Portfolio] Found {len(accounts)} accounts for program {program_id}")

    holdings = []

    for acc in accounts:
        try:
            info = acc["account"]["data"]["parsed"]["info"]
            mint = info["mint"]
            amount = float(info["tokenAmount"]["uiAmount"] or 0)

            if amount <= 0:
                continue

            holdings.append({"mint": mint, "amount": amount})
        except Exception:
            continue

    return holdings


def _get_spl_token_accounts(address):
    # Query both the classic SPL Token program and the newer
    # Token-2022 program, since tokens can live on either.
    classic = _query_token_accounts(address, TOKEN_PROGRAM_ID)
    token_2022 = _query_token_accounts(address, TOKEN_2022_PROGRAM_ID)

    return classic + token_2022


def get_wallet_portfolio(address):
    holdings = []

    # Native SOL balance
    sol_amount = _get_sol_balance(address)

    if sol_amount > 0:
        holdings.append({"mint": SOL_MINT, "amount": sol_amount})

    # SPL token balances
    holdings.extend(_get_spl_token_accounts(address))

    enriched = []
    total_value = 0

    for item in holdings:
        metadata = get_token_metadata(item["mint"])
        price = float(metadata.get("price_usd") or 0)
        value_usd = round(item["amount"] * price, 2)

        # Only skip TRUE dust (a known, nonzero price under $1).
        # If price is 0 (lookup failed / no pair found), still show
        # the holding instead of silently hiding it.
        if price > 0 and value_usd < 1:
            continue

        enriched.append(
            {
                "mint": item["mint"],
                "name": metadata.get("name"),
                "symbol": metadata.get("symbol"),
                "logo": metadata.get("logo", ""),
                "amount": item["amount"],
                "price_usd": price,
                "value_usd": value_usd,
                "price_unavailable": price == 0,
            }
        )

        total_value += value_usd

    # Allocation percentages
    for item in enriched:
        item["allocation_pct"] = (
            round((item["value_usd"] / total_value) * 100, 2)
            if total_value > 0
            else 0
        )

    enriched.sort(key=lambda x: x["value_usd"], reverse=True)

    # Simple concentration read on the largest holding
    top_pct = enriched[0]["allocation_pct"] if enriched else 0

    if top_pct >= 70:
        diversification = "Highly Concentrated"
        risk_note = (
            "Over 70% of this portfolio sits in a single asset. "
            "A downturn in that one token would heavily impact total value."
        )
    elif top_pct >= 40:
        diversification = "Concentrated"
        risk_note = (
            "A significant portion is held in one asset. "
            "Consider whether this concentration matches your risk tolerance."
        )
    elif enriched:
        diversification = "Diversified"
        risk_note = (
            "Holdings are spread across multiple assets, reducing single-token risk."
        )
    else:
        diversification = "Empty"
        risk_note = "No token balances found above the dust threshold."

    # -------------------------------------------------------
    # AI Narrative — feed the real holdings into the existing
    # portfolio_review() AI function as a plain-text summary
    # -------------------------------------------------------

    ai_narrative = None

    if portfolio_review and enriched:
        try:
            lines = [
                f"{item['symbol']} (${item['value_usd']}, "
                f"{item['allocation_pct']}% of portfolio)"
                for item in enriched
            ]

            summary_text = (
                f"Wallet holds {len(enriched)} token(s) worth "
                f"${round(total_value, 2)} total: "
                + ", ".join(lines)
                + f". Diversification profile: {diversification}."
            )

            ai_narrative = portfolio_review(summary_text)
        except Exception as e:
            print(f"[Wallet Portfolio] AI narrative generation failed: {e}")
            ai_narrative = None

    return {
        "address": address,
        "total_value_usd": round(total_value, 2),
        "holdings_count": len(enriched),
        "diversification": diversification,
        "risk_note": risk_note,
        "top_holding_pct": top_pct,
        "holdings": enriched,
        "ai_narrative": ai_narrative,
    }
