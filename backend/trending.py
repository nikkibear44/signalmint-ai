import requests
import time

COINGECKO_API = "https://api.coingecko.com/api/v3"

CACHE = {
    "data": None,
    "timestamp": 0,
}

CACHE_DURATION = 60  # seconds


def get_trending_tokens():
    global CACHE

    # Return cached data if it's still fresh
    if (
        CACHE["data"] is not None
        and time.time() - CACHE["timestamp"] < CACHE_DURATION
    ):
        print("Using cached trending data")
        return CACHE["data"]

    # Get trending list
    trending = requests.get(
        f"{COINGECKO_API}/search/trending",
        timeout=15,
    )

    trending.raise_for_status()

    data = trending.json()

    # Collect all CoinGecko IDs
    coin_ids = []

    for coin in data["coins"]:
        coin_ids.append(coin["item"]["id"])

    # Fetch ALL market data in ONE request
    markets = requests.get(
        f"{COINGECKO_API}/coins/markets",
        params={
            "vs_currency": "usd",
            "ids": ",".join(coin_ids),
        },
        timeout=15,
    )

    markets.raise_for_status()

    market_data = markets.json()

    tokens = []

    for market in market_data:
        tokens.append(
            {
                "name": market["name"],
                "symbol": market["symbol"].upper(),
                "rank": market["market_cap_rank"],
                "price": market["current_price"],
                "change_24h": market["price_change_percentage_24h"],
                "market_cap": market["market_cap"],
            }
        )

    CACHE["data"] = tokens
    CACHE["timestamp"] = time.time()

    print("Fetched fresh trending data")

    return tokens