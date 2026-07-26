import requests

BASE_URL = "https://api.coingecko.com/api/v3"


def search_coin(query):
    """
    Search CoinGecko and return the best matching coin ID.
    """

    try:
        url = f"{BASE_URL}/search?query={query}"

        response = requests.get(url, timeout=10)
        response.raise_for_status()

        coins = response.json().get("coins", [])

        if not coins:
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
        print("CoinGecko Search Error:", e)
        return None


def get_market_data(query):
    """
    Returns rich project information from CoinGecko.
    """

    coin_id = search_coin(query)

    if not coin_id:
        return None

    try:
        url = f"{BASE_URL}/coins/{coin_id}"

        params = {
            "localization": "false",
            "tickers": "false",
            "market_data": "true",
            "community_data": "false",
            "developer_data": "false",
            "sparkline": "false",
        }

        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()

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
        print("CoinGecko Error:", e)
        return None