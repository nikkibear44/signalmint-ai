import requests

COINGECKO_API = "https://api.coingecko.com/api/v3"


def get_global_market():
    """Fetch global crypto market data."""

    url = f"{COINGECKO_API}/global"
    response = requests.get(url, timeout=10)
    response.raise_for_status()

    data = response.json()["data"]

    return {
        "market_cap_usd": data["total_market_cap"]["usd"],
        "volume_usd": data["total_volume"]["usd"],
        "btc_dominance": round(
            data["market_cap_percentage"]["btc"], 2
        ),
        "active_cryptocurrencies": data["active_cryptocurrencies"],
        "markets": data["markets"],
    }


def get_trending():
    """Fetch trending coins."""

    url = f"{COINGECKO_API}/search/trending"
    response = requests.get(url, timeout=10)
    response.raise_for_status()

    coins = response.json()["coins"]

    trending = []

    for coin in coins:
        item = coin["item"]

        trending.append({
            "name": item["name"],
            "symbol": item["symbol"],
            "market_cap_rank": item.get("market_cap_rank"),
        })

    return trending


def get_market_movers():
    """Fetch top gainers and losers."""

    url = f"{COINGECKO_API}/coins/markets"

    params = {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": 100,
        "page": 1,
        "sparkline": "false",
        "price_change_percentage": "24h",
    }

    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()

    coins = response.json()

    sorted_coins = sorted(
        coins,
        key=lambda x: x.get("price_change_percentage_24h", 0),
    )

    losers = sorted_coins[:5]

    gainers = sorted_coins[-5:][::-1]

    return {
        "gainers": gainers,
        "losers": losers,
    }


def build_market_snapshot():
    """Create a complete market snapshot."""

    global_data = get_global_market()
    trending = get_trending()
    movers = get_market_movers()

    snapshot = {
        "global": global_data,
        "trending": trending,
        "gainers": movers["gainers"],
        "losers": movers["losers"],
    }

    return snapshot