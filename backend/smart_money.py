import json
import os
import pathlib
import time
import requests

from dotenv import load_dotenv

load_dotenv()

HELIUS_API_KEY = os.getenv("HELIUS_API_KEY")
BASE_URL = "https://api.helius.xyz/v0"

wallet_file = pathlib.Path(__file__).parent / "wallets.json"

with open(wallet_file, "r", encoding="utf-8") as f:
    WALLETS = json.load(f)


# -------------------------------------------------------
# SOL PRICE
# -------------------------------------------------------

_sol_price_cache = {"price": 0, "ts": 0}

SOL_MINT = "So11111111111111111111111111111111111111112"


def get_sol_price():
    import time

    now = time.time()

    # Reuse cached price for 30 seconds instead of
    # hitting CoinGecko on every single SOL transfer
    if _sol_price_cache["price"] and now - _sol_price_cache["ts"] < 30:
        return _sol_price_cache["price"]

    try:
        response = requests.get(
            "https://api.coingecko.com/api/v3/simple/price",
            params={
                "ids": "solana",
                "vs_currencies": "usd",
            },
            timeout=10,
        )

        price = float(response.json()["solana"]["usd"])

        if price > 0:
            _sol_price_cache["price"] = price
            _sol_price_cache["ts"] = now
            return price

    except Exception as e:
        print(f"[SOL price] CoinGecko failed: {e}")

    # Fallback: pull SOL price from DexScreener instead
    try:
        response = requests.get(
            f"https://api.dexscreener.com/latest/dex/tokens/{SOL_MINT}",
            timeout=10,
        )

        pairs = response.json().get("pairs") or []

        if pairs:
            best = max(
                pairs,
                key=lambda pair: float(
                    (pair.get("liquidity") or {}).get("usd") or 0
                ),
            )

            price = float(best.get("priceUsd") or 0)

            if price > 0:
                _sol_price_cache["price"] = price
                _sol_price_cache["ts"] = now
                return price

    except Exception as e:
        print(f"[SOL price] DexScreener fallback failed: {e}")

    # Last resort: reuse stale cached price rather than 0
    return _sol_price_cache["price"]


# -------------------------------------------------------
# DEXSCREENER
# -------------------------------------------------------

def get_dexscreener_metadata(mint):

    # Wrapped SOL
    if mint == "So11111111111111111111111111111111111111112":
        return {
            "name": "Wrapped SOL",
            "symbol": "SOL",
            "logo": "",
            "price_usd": get_sol_price(),
        }

    try:
        response = requests.get(
            f"https://api.dexscreener.com/latest/dex/tokens/{mint}",
            timeout=10,
        )

        data = response.json()
        pairs = data.get("pairs") or []

        if not pairs:
            raise Exception("No pair found")

        # Choose the pair with the highest liquidity
        best = max(
            pairs,
            key=lambda pair: float(
                (pair.get("liquidity") or {}).get("usd") or 0
            ),
        )

        token = best.get("baseToken") or {}

        try:
            price = float(best.get("priceUsd") or 0)
        except Exception:
            price = 0

        return {
            "name": token.get("name", mint[:6]),
            "symbol": token.get("symbol", ""),
            "logo": "",
            "price_usd": price,
        }

    except Exception:
        return {
            "name": mint[:6],
            "symbol": "",
            "logo": "",
            "price_usd": 0,
        }


# -------------------------------------------------------
# HELIUS TOKEN METADATA (cached to avoid repeat lookups)
# -------------------------------------------------------

_token_metadata_cache = {}
_TOKEN_CACHE_TTL = 60  # seconds


def get_token_metadata(mint):
    now = time.time()

    cached = _token_metadata_cache.get(mint)
    if cached and (now - cached["ts"]) < _TOKEN_CACHE_TTL:
        return cached["data"]

    dex = get_dexscreener_metadata(mint)

    try:
        url = (
            f"{BASE_URL}/token-metadata"
            f"?api-key={HELIUS_API_KEY}"
        )

        response = requests.post(
            url,
            json={
                "mintAccounts": [mint],
                "includeOffChain": True,
                "disableCache": False,
            },
            timeout=10,
        )

        if response.status_code != 200:
            result = dex
        else:
            data = response.json()

            if not data:
                result = dex
            else:
                token = data[0]

                onchain = token.get("onChainMetadata") or {}
                metadata = onchain.get("metadata") or {}
                offchain = token.get("offChainMetadata") or {}

                result = {
                    "name": metadata.get("name") or dex["name"],
                    "symbol": metadata.get("symbol") or dex["symbol"],
                    "logo": offchain.get("image", ""),
                    "price_usd": dex["price_usd"],
                }

    except Exception:
        result = dex

    _token_metadata_cache[mint] = {"data": result, "ts": now}

    return result


# -------------------------------------------------------
# AI INSIGHT
# -------------------------------------------------------

def generate_ai_insight(value_usd):

    value_usd = float(value_usd or 0)

    if value_usd >= 1_000_000:
        return "🚨 Mega whale transaction detected. Extremely high conviction."

    elif value_usd >= 250_000:
        return "🐋 Large whale transaction. Significant smart-money activity."

    elif value_usd >= 50_000:
        return "💰 Strong accumulation from a notable wallet."

    elif value_usd >= 10_000:
        return "📈 Healthy smart-money position."

    elif value_usd >= 1_000:
        return "👀 Moderate-sized trade worth monitoring."

    elif value_usd >= 100:
        return "📝 Small accumulation."

    return "⚠️ Very small transfer. Signal confidence is low."


# -------------------------------------------------------
# SMART MONEY FEED
# -------------------------------------------------------

def get_smart_money():

    feed = []

    for wallet in WALLETS:

        url = (
            f"{BASE_URL}/addresses/"
            f"{wallet['address']}/transactions"
            f"?api-key={HELIUS_API_KEY}&limit=5"
        )

        try:
            response = requests.get(
                url,
                timeout=15,
            )

            if response.status_code != 200:
                continue

            transactions = response.json()

            for tx in transactions:

                timestamp = tx.get("timestamp")
                signature = tx.get("signature")

                for transfer in tx.get("tokenTransfers", []):

                    wallet_address = wallet["address"]

                    side = None

                    if transfer.get("toUserAccount") == wallet_address:
                        side = "BUY"

                    elif transfer.get("fromUserAccount") == wallet_address:
                        side = "SELL"

                    if side is None:
                        continue

                    mint = transfer.get("mint")

                    if not mint:
                        continue

                    metadata = get_token_metadata(mint)

                    amount = float(
                        transfer.get("tokenAmount") or 0
                    )

                    price = float(
                        metadata.get("price_usd") or 0
                    )

                    value_usd = round(
                        amount * price,
                        2,
                    )

                    # Skip spam transfers
                    if value_usd > 0 and value_usd < 10:
                        continue

                    feed.append(
                        {
                            "wallet": wallet["name"],
                            "wallet_address": wallet_address,

                            "side": side,

                            "mint": mint,

                            "name": metadata["name"],
                            "symbol": metadata["symbol"],
                            "logo": metadata["logo"],

                            "amount": amount,

                            "price_usd": price,

                            "value_usd": value_usd,

                            "signature": signature,

                            "timestamp": timestamp,

                            "ai_insight": generate_ai_insight(
                                value_usd
                            ),
                        }
                    )

        except Exception as e:
            print(
                f"[Smart Money Error] {wallet['name']}: {e}"
            )

    feed.sort(
        key=lambda x: x["timestamp"] or 0,
        reverse=True,
    )

    return feed