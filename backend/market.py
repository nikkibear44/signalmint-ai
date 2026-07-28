import os
import time
import requests

BASE_URL = "https://api.coingecko.com/api/v3"

COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; SignalMintAI/1.0; +https://signalmint-ai.vercel.app)",
    "Accept": "application/json",
}

if COINGECKO_API_KEY:
    HEADERS["x-cg-demo-api-key"] = COINGECKO_API_KEY


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
            print(f"[Market] Attempt {attempt + 1} failed: {e}")

            if attempt < retries:
                time.sleep(1.5 * (attempt + 1))

    raise last_error


def search_coin(query):
    """
    Search CoinGecko and return the best matching coin ID.
    """

    try:
        response = _fetch_with_retry(
            f"{BASE_URL}/search",
            params={"query": query},
        )

        coins = response.json().get("coins", [])

        if not coins:
            print(f"[Market] No search results for query: {query}")
            return None

        q = query.lower().strip()

        # 1. Exact CoinGecko ID
        for coin in coins:
            if coin["id"].lower() == q:
                return coin["id"]

        # 2. Exact project name
        for coin in coins:
            if coin["name"].lower() == q:
                return coin["id"]

        # 3. Exact symbol
        for coin in coins:
            if coin["symbol"].lower() == q:
                return coin["id"]

        # 4. Starts-with project name
        for coin in coins:
            if coin["name"].lower().startswith(q):
                return coin["id"]

        # 5. Starts-with symbol
        for coin in coins:
            if coin["symbol"].lower().startswith(q):
                return coin["id"]

        # 6. Fallback
        return coins[0]["id"]

    except Exception as e:
        print("[Market] CoinGecko Search Error (all retries failed):", e)
        return None


def get_market_data(query):
    """
    Returns rich project information from CoinGecko.
    """

    coin_id = search_coin(query)

    if not coin_id:
        return None

    try:
        response = _fetch_with_retry(
            f"{BASE_URL}/coins/{coin_id}",
            params={
                "localization": "false",
                "tickers": "false",
                "market_data": "true",
                "community_data": "false",
                "developer_data": "false",
                "sparkline": "false",
            },
        )

        data = response.json()

        market = data.get("market_data", {})

        return {
            "name": data.get("name"),
            "symbol": data.get("symbol", "").upper(),
            "description": (
                data.get("description", {}).get("en", "")[:1500]
            ),
            "homepage": (
                data.get("links", {}).get("homepage", [""])[0]
            ),
            "categories": data.get("categories", []),

            "price": market.get("current_price", {}).get("usd"),
            "market_cap": market.get("market_cap", {}).get("usd"),
            "volume": market.get("total_volume", {}).get("usd"),
            "change_24h": market.get("price_change_percentage_24h"),

            "genesis_date": data.get("genesis_date"),

            "coingecko_rank": data.get("market_cap_rank"),

            "sentiment_up": data.get(
                "sentiment_votes_up_percentage"
            ),

            "sentiment_down": data.get(
                "sentiment_votes_down_percentage"
            ),
        }

    except Exception as e:
        print("[Market] CoinGecko Error (all retries failed):", e)
        return None