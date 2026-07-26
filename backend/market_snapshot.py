import requests
import time

BASE_URL = "https://api.coingecko.com/api/v3"

CACHE = {
    "data": None,
    "timestamp": 0,
}

CACHE_DURATION = 60  # seconds


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
        response = requests.get(
            f"{BASE_URL}/global",
            timeout=10,
        )
        response.raise_for_status()

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
        print("Market Snapshot Error:", e)

        if CACHE["data"] is not None:
            print("Returning cached global market data")
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