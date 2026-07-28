import json
import pathlib
import time
import requests

from smart_money import generate_ai_insight

EXPLORER_URL = "https://robinhoodchain.blockscout.com"
DEXSCREENER_CHAIN = "robinhood"

wallet_file = pathlib.Path(__file__).parent / "robinhood_wallets.json"

with open(wallet_file, "r", encoding="utf-8") as f:
    WALLETS = json.load(f)

_price_cache = {}
_PRICE_CACHE_TTL = 60  # seconds


def _get_dexscreener_price(contract_address):
    now = time.time()

    cached = _price_cache.get(contract_address)
    if cached and (now - cached["ts"]) < _PRICE_CACHE_TTL:
        return cached["price"]

    try:
        response = requests.get(
            f"https://api.dexscreener.com/latest/dex/tokens/{contract_address}",
            timeout=10,
        )
        response.raise_for_status()

        data = response.json()
        pairs = data.get("pairs") or []

        chain_pairs = [p for p in pairs if p.get("chainId") == DEXSCREENER_CHAIN]

        if not chain_pairs:
            price = 0
        else:
            best = max(
                chain_pairs,
                key=lambda p: float((p.get("liquidity") or {}).get("usd") or 0),
            )
            price = float(best.get("priceUsd") or 0)

        _price_cache[contract_address] = {"price": price, "ts": now}
        return price

    except Exception as e:
        print(f"[Robinhood Smart Money] DexScreener price failed for {contract_address}: {e}")
        return 0


def _extract_address_hash(value):
    """
    Blockscout represents from/to addresses either as a plain string
    or as an object like {"hash": "0x..."}. Handle both.
    """
    if not value:
        return None
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return value.get("hash") or value.get("address")
    return None


def _get_token_transfers(address, limit=10):
    try:
        response = requests.get(
            f"{EXPLORER_URL}/api/v2/addresses/{address}/token-transfers",
            params={"type": "ERC-20"},
            timeout=15,
        )
        response.raise_for_status()

        data = response.json()
        items = data.get("items", [])

        return items[:limit]

    except Exception as e:
        print(f"[Robinhood Smart Money] Token transfer fetch failed for {address}: {e}")
        return []


def get_robinhood_smart_money():
    feed = []

    for wallet in WALLETS:
        wallet_address = wallet["address"]

        transfers = _get_token_transfers(wallet_address, limit=10)

        for item in transfers:
            try:
                from_addr = _extract_address_hash(item.get("from"))
                to_addr = _extract_address_hash(item.get("to"))

                if not from_addr or not to_addr:
                    continue

                side = None

                if to_addr.lower() == wallet_address.lower():
                    side = "BUY"
                elif from_addr.lower() == wallet_address.lower():
                    side = "SELL"

                if side is None:
                    continue

                token = item.get("token", {}) or {}
                contract_address = token.get("address") or token.get("address_hash")
                symbol = token.get("symbol", "?")
                name = token.get("name", symbol)
                decimals = int(token.get("decimals") or 18)

                # Amount can appear under "total.value" or plain "value"
                total = item.get("total") or {}
                raw_amount = total.get("value") or item.get("value") or "0"

                try:
                    amount = int(raw_amount) / (10 ** decimals)
                except Exception:
                    continue

                if amount <= 0 or not contract_address:
                    continue

                price = _get_dexscreener_price(contract_address)
                value_usd = round(amount * price, 2)

                # Skip true dust (only when price is known and nonzero)
                if price > 0 and value_usd < 1:
                    continue

                tx_hash = item.get("tx_hash") or item.get("transaction_hash", "")
                timestamp = item.get("timestamp", "")

                feed.append(
                    {
                        "wallet": wallet["name"],
                        "wallet_address": wallet_address,
                        "side": side,
                        "mint": contract_address,
                        "name": name,
                        "symbol": symbol,
                        "logo": "",
                        "amount": amount,
                        "price_usd": price,
                        "value_usd": value_usd,
                        "price_unavailable": price == 0,
                        "signature": tx_hash,
                        "timestamp": timestamp,
                        "ai_insight": generate_ai_insight(value_usd),
                    }
                )

            except Exception as e:
                print(f"[Robinhood Smart Money] Error processing transfer: {e}")
                continue

    return feed