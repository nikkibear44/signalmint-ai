import requests
import time

COINGECKO_API = "https://api.coingecko.com/api/v3"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; SignalMintAI/1.0; +https://signalmint-ai.vercel.app)",
    "Accept": "application/json",
}

CACHE = {
    "data": None,
    "timestamp": 0,
}

CACHE_DURATION = 120  # seconds


def _fetch_with_retry(url, params=None, retries=2, timeout=15):
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
            print(f"[Trending] Attempt {attempt + 1} failed: {e}")

            if attempt < retries:
                time.sleep(1.5 * (attempt + 1))

    raise last_error


def get_trending_tokens():
    global CACHE

    # Return cached data if it's still fresh
    if (
        CACHE["data"] is not None
        and time.time() - CACHE["timestamp"] < CACHE_DURATION
    ):
        print("Using cached trending data")
        return CACHE["data"]

    try:
        # Get trending list
        trending = _fetch_with_retry(f"{COINGECKO_API}/search/trending")

        data = trending.json()

        # Collect all CoinGecko IDs
        coin_ids = [coin["item"]["id"] for coin in data["coins"]]

        # Fetch ALL market data in ONE request
        markets = _fetch_with_retry(
            f"{COINGECKO_API}/coins/markets",
            params={
                "vs_currency": "usd",
                "ids": ",".join(coin_ids),
            },
        )

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
                    "categories": market.get("categories", []),
                    "coingecko_rank": market.get("market_cap_rank"),
                }
            )

        CACHE["data"] = tokens
        CACHE["timestamp"] = time.time()

        print("Fetched fresh trending data")

        return tokens

    except Exception as e:
        print("Trending Error (all retries failed):", e)

        if CACHE["data"] is not None:
            print("Returning stale cached trending data instead of empty")
            return CACHE["data"]

        return []