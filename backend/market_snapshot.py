import os
import requests
import time

BASE_URL = "https://api.coingecko.com/api/v3"

COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; SignalMintAI/1.0; +https://signalmint-ai.vercel.app)",
    "Accept": "application/json",
}

if COINGECKO_API_KEY:
    HEADERS["x-cg-demo-api-key"] = COINGECKO_API_KEY

CACHE = {
    "data": None,
    "timestamp": 0,
}

CACHE_DURATION = 120  # seconds - increased to reduce repeat calls


def _fetch_with_retry(url, params=None, retries=2, timeout=10):
    last_error = None

    for attempt in range(retries + 1):
        try:
            response = requests.get(
                url,
                params=params,
                headers=HEADERS,
                timeout=timeout,
            )
            response.raise_for_status()
            return response

        except Exception as e:
            last_error = e
            print(f"[Market Snapshot] Attempt {attempt + 1} failed: {e}")

            if attempt < retries:
                time.sleep(1.5 * (attempt + 1))  # backoff: 1.5s, 3s

    raise last_error


def get_global_market():
    """
    Fetch global crypto market statistics from CoinGecko.
    """

    global CACHE

    # Return cached data if still fresh
    if (
        CACHE["data"] is not None
        and time.time() - CACHE["timestamp"] < CACHE_DURATION
    ):
        print("Using cached global market data")
        return CACHE["data"]

    try:
        response = _fetch_with_retry(f"{BASE_URL}/global")

        data = response.json()["data"]

        result = {
            "active_cryptocurrencies": data.get("active_cryptocurrencies"),
            "markets": data.get("markets"),
            "total_market_cap": data.get("total_market_cap", {}).get("usd"),
            "total_volume": data.get("total_volume", {}).get("usd"),
            "btc_dominance": data.get("market_cap_percentage", {}).get("btc"),
            "eth_dominance": data.get("market_cap_percentage", {}).get("eth"),
            "market_cap_change_24h": data.get(
                "market_cap_change_percentage_24h_usd"
            ),
        }

        CACHE["data"] = result
        CACHE["timestamp"] = time.time()

        print("Fetched fresh global market data")

        return result

    except Exception as e:
        print("Market Snapshot Error (all retries failed):", e)

        if CACHE["data"] is not None:
            print("Returning stale cached global market data instead of zeros")
            return CACHE["data"]

        return {
            "active_cryptocurrencies": 0,
            "markets": 0,
            "total_market_cap": 0,
            "total_volume": 0,
            "btc_dominance": 0,
            "eth_dominance": 0,
            "market_cap_change_24h": 0,
        }