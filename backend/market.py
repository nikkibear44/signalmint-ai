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

HELIUS_API_KEY = os.getenv("HELIUS_API_KEY")
SOLANA_RPC_URL = f"https://mainnet.helius-rpc.com/?api-key={HELIUS_API_KEY}"


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
            print(f"[Market] No CoinGecko search results for query: {query}")
            return None

        q = query.lower().strip()

        def best_ranked(candidates):
            """
            Among multiple matches at the same tier, prefer the one with
            the lowest (best) market_cap_rank - avoids picking an obscure
            token that happens to share a name/symbol with a major one.
            Coins with no rank at all are treated as worst-ranked.
            """
            ranked = [c for c in candidates if c.get("market_cap_rank")]
            if ranked:
                return min(ranked, key=lambda c: c["market_cap_rank"])["id"]
            return candidates[0]["id"]

        # 1. Exact CoinGecko ID
        exact_id_matches = [c for c in coins if c["id"].lower() == q]
        if exact_id_matches:
            return best_ranked(exact_id_matches)

        # 2. Exact project name
        exact_name_matches = [c for c in coins if c["name"].lower() == q]
        if exact_name_matches:
            return best_ranked(exact_name_matches)

        # 3. Exact symbol
        exact_symbol_matches = [c for c in coins if c["symbol"].lower() == q]
        if exact_symbol_matches:
            return best_ranked(exact_symbol_matches)

        # 4. Starts-with project name
        name_prefix_matches = [c for c in coins if c["name"].lower().startswith(q)]
        if name_prefix_matches:
            return best_ranked(name_prefix_matches)

        # 5. Starts-with symbol
        symbol_prefix_matches = [c for c in coins if c["symbol"].lower().startswith(q)]
        if symbol_prefix_matches:
            return best_ranked(symbol_prefix_matches)

        # 6. Fallback
        return coins[0]["id"]

    except Exception as e:
        print("[Market] CoinGecko Search Error (all retries failed):", e)
        return None


def _get_coingecko_data(coin_id):
    response = _fetch_with_retry(
        f"{BASE_URL}/coins/{coin_id}",
        params={
            "localization": "false",
            "tickers": "false",
            "market_data": "true",
            "community_data": "true",
            "developer_data": "false",
            "sparkline": "false",
        },
    )

    data = response.json()
    market = data.get("market_data", {})

    # Safe homepage extraction - CoinGecko can return an EMPTY list
    # (not just a missing key), which crashes [0] indexing if not
    # handled explicitly.
    homepage_list = data.get("links", {}).get("homepage") or [""]
    homepage = homepage_list[0] if homepage_list else ""

    return {
        "name": data.get("name"),
        "symbol": data.get("symbol", "").upper(),
        "description": (
            data.get("description", {}).get("en", "")[:1500]
        ),
        "homepage": homepage,
        "categories": data.get("categories", []),

        "price": market.get("current_price", {}).get("usd"),
        "market_cap": market.get("market_cap", {}).get("usd"),
        "volume": market.get("total_volume", {}).get("usd"),
        "change_24h": market.get("price_change_percentage_24h"),
        "change_7d": market.get("price_change_percentage_7d"),
        "change_30d": market.get("price_change_percentage_30d"),
        "change_1y": market.get("price_change_percentage_1y"),

        "ath": market.get("ath", {}).get("usd"),
        "ath_change_percentage": market.get("ath_change_percentage", {}).get("usd"),
        "atl": market.get("atl", {}).get("usd"),

        "total_supply": market.get("total_supply"),
        "circulating_supply": market.get("circulating_supply"),
        "max_supply": market.get("max_supply"),

        "twitter_followers": data.get("community_data", {}).get("twitter_followers"),
        "reddit_subscribers": data.get("community_data", {}).get("reddit_subscribers"),
        "telegram_users": data.get("community_data", {}).get("telegram_channel_user_count"),

        "genesis_date": data.get("genesis_date"),
        "coingecko_rank": data.get("market_cap_rank"),
        "sentiment_up": data.get("sentiment_votes_up_percentage"),
        "sentiment_down": data.get("sentiment_votes_down_percentage"),

        "source": "coingecko",
    }


def _get_solana_onchain_supply(mint_address):
    """
    Reads a token's total supply directly from its on-chain mint
    account. Fully verified, works for ANY SPL token regardless of
    whether it has a team, website, or CoinGecko listing - including
    anonymous pump.fun-style memecoins.
    """

    try:
        response = requests.post(
            SOLANA_RPC_URL,
            json={
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getTokenSupply",
                "params": [mint_address],
            },
            timeout=10,
        )
        response.raise_for_status()

        result = response.json().get("result")

        if not result:
            return None

        ui_amount = result.get("value", {}).get("uiAmount")
        return ui_amount

    except Exception as e:
        print(f"[Market] On-chain supply lookup failed for {mint_address}: {e}")
        return None


def _search_dexscreener(query):
    """
    Fallback for tokens not yet indexed by CoinGecko - searches
    DexScreener's live DEX pair data directly. Common for very new
    or low-cap tokens that trade on-chain before getting a CoinGecko
    listing.
    """

    try:
        response = requests.get(
            "https://api.dexscreener.com/latest/dex/search",
            params={"q": query},
            headers=HEADERS,
            timeout=10,
        )
        response.raise_for_status()

        pairs = response.json().get("pairs") or []

        if not pairs:
            print(f"[Market] No DexScreener results for query: {query}")
            return None

        # Pick the pair with the highest liquidity as the most reliable
        best = max(
            pairs,
            key=lambda p: float((p.get("liquidity") or {}).get("usd") or 0),
        )

        token = best.get("baseToken") or {}
        chain_id = best.get("chainId")
        mint_address = token.get("address")

        try:
            price = float(best.get("priceUsd") or 0)
        except Exception:
            price = None

        volume = (best.get("volume") or {}).get("h24")
        change_24h = (best.get("priceChange") or {}).get("h24")
        fdv = best.get("fdv") or best.get("marketCap")

        # For Solana tokens, try to get a real on-chain supply number -
        # verified, works even for anonymous tokens with no team.
        total_supply = None
        if chain_id == "solana" and mint_address and HELIUS_API_KEY:
            total_supply = _get_solana_onchain_supply(mint_address)

        return {
            "name": token.get("name") or query,
            "symbol": (token.get("symbol") or "").upper(),
            "description": "",
            "homepage": "",
            "categories": [],

            "price": price,
            "market_cap": fdv,
            "volume": volume,
            "change_24h": change_24h,

            "total_supply": total_supply,
            "circulating_supply": None,
            "max_supply": None,

            "genesis_date": None,
            "coingecko_rank": None,
            "sentiment_up": None,
            "sentiment_down": None,

            "source": "dexscreener",
        }

    except Exception as e:
        print("[Market] DexScreener fallback failed:", e)
        return None


def get_market_data(query, known_coingecko_id=None):
    """
    Returns rich project information. Tries CoinGecko first (broader
    fundamentals, more established tokens), falls back to DexScreener
    for very new/low-cap tokens CoinGecko hasn't indexed yet.

    If known_coingecko_id is provided (e.g. from a trending card where
    we already know the exact correct ID), skip the ambiguous
    name/symbol search entirely and fetch that ID directly - avoids
    the "pump" -> wrong obscure token class of bug.
    """

    if known_coingecko_id:
        try:
            return _get_coingecko_data(known_coingecko_id)
        except Exception as e:
            print(f"[Market] Direct ID lookup failed for {known_coingecko_id}: {e}")
            # fall through to normal search-based lookup below

    coin_id = search_coin(query)

    if coin_id:
        try:
            return _get_coingecko_data(coin_id)
        except Exception as e:
            print("[Market] CoinGecko Error (all retries failed):", e)
            # fall through to DexScreener fallback below

    print(f"[Market] Falling back to DexScreener for query: {query}")
    return _search_dexscreener(query)
