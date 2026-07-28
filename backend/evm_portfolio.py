import os
import requests

from agent import portfolio_review

COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")

COINGECKO_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; SignalMintAI/1.0; +https://signalmint-ai.vercel.app)",
    "Accept": "application/json",
}

if COINGECKO_API_KEY:
    COINGECKO_HEADERS["x-cg-demo-api-key"] = COINGECKO_API_KEY


# -------------------------------------------------------
# Chain configs — add more EVM chains here later
# (Robinhood Chain, X Layer, etc.) by adding a new entry.
# -------------------------------------------------------

CHAINS = {
    "robinhood": {
        "name": "Robinhood Chain",
        "rpc_url": "https://rpc.mainnet.chain.robinhood.com",
        "native_symbol": "ETH",
        "coingecko_id": "ethereum",
        "chain_id": 4663,
        "badge_color": "#00C805",  # Robinhood brand green
        "badge_letter": "R",
    },
    "stable": {
        "name": "Stable Mainnet",
        "rpc_url": "https://rpc.stable.xyz",
        "native_symbol": "USDT0",
        "coingecko_id": "usdt0",
        "chain_id": 988,
        "badge_color": "#26A17B",  # Tether/stablecoin green
        "badge_letter": "S",
    },
}


def _rpc_call(rpc_url, method, params):
    try:
        response = requests.post(
            rpc_url,
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
            print(f"[EVM Portfolio] RPC error on {method}: {data['error']}")
            return None

        return data.get("result")

    except Exception as e:
        print(f"[EVM Portfolio] RPC exception on {method}: {e}")
        return None


def _get_native_balance(rpc_url, address):
    result = _rpc_call(rpc_url, "eth_getBalance", [address, "latest"])

    if not result:
        return 0

    try:
        wei = int(result, 16)
        return wei / 1_000_000_000_000_000_000  # wei -> ETH-denominated
    except Exception:
        return 0


def _get_token_price_usd(coingecko_id):
    try:
        response = requests.get(
            "https://api.coingecko.com/api/v3/simple/price",
            params={"ids": coingecko_id, "vs_currencies": "usd"},
            headers=COINGECKO_HEADERS,
            timeout=10,
        )
        response.raise_for_status()

        data = response.json()
        return float(data.get(coingecko_id, {}).get("usd", 0))

    except Exception as e:
        print(f"[EVM Portfolio] Price lookup failed for {coingecko_id}: {e}")
        return 0


def get_evm_portfolio(chain_key, address):
    chain = CHAINS.get(chain_key)

    if not chain:
        return {
            "success": False,
            "message": f"Unsupported chain: {chain_key}",
        }

    native_amount = _get_native_balance(chain["rpc_url"], address)
    price = _get_token_price_usd(chain["coingecko_id"])
    value_usd = round(native_amount * price, 2)

    holdings = []

    if native_amount > 0:
        holdings.append(
            {
                "symbol": chain["native_symbol"],
                "amount": native_amount,
                "price_usd": price,
                "value_usd": value_usd,
                "allocation_pct": 100 if value_usd > 0 else 0,
            }
        )

    ai_narrative = None

    if holdings:
        try:
            summary_text = (
                f"Wallet on {chain['name']} holds "
                f"{native_amount:.6f} {chain['native_symbol']} "
                f"worth ${value_usd}. This is the only asset on this chain "
                f"detected so far (ERC-20 token scanning not yet supported "
                f"for this chain)."
            )
            ai_narrative = portfolio_review(summary_text)
        except Exception as e:
            print(f"[EVM Portfolio] AI narrative failed: {e}")

    return {
        "success": True,
        "data": {
            "chain": chain["name"],
            "chain_key": chain_key,
            "badge_color": chain["badge_color"],
            "badge_letter": chain["badge_letter"],
            "address": address,
            "total_value_usd": value_usd,
            "holdings_count": len(holdings),
            "holdings": holdings,
            "ai_narrative": ai_narrative,
            "note": (
                "Currently shows native token balance only. "
                "ERC-20 token support coming soon."
            ),
        },
    }