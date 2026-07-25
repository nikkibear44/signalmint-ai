import requests

COINGECKO_IDS = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "SOL": "solana",
    "SUI": "sui",
    "BNB": "binancecoin",
}


def get_market_data(symbol):

    symbol = symbol.upper()

    coin = COINGECKO_IDS.get(symbol)

    if not coin:
        return None

    url = (
        "https://api.coingecko.com/api/v3/simple/price"
        f"?ids={coin}"
        "&vs_currencies=usd"
        "&include_market_cap=true"
        "&include_24hr_vol=true"
        "&include_24hr_change=true"
    )

    data = requests.get(url).json()

    if coin not in data:
        return None

    info = data[coin]

    return {
        "price": info["usd"],
        "market_cap": info["usd_market_cap"],
        "volume": info["usd_24h_vol"],
        "change": info["usd_24h_change"],
    }