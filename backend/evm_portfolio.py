import os
import requests

from agent import portfolio_review

COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")

COINGECKO_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; SignalMintAI/1.0; +https://signalmint-ai.vercel.app)",
    "Accept": "application/json",
}

if COINGECKO_API_KEY:
    COINGECKO_HEADERS["x-cg-demo-api-key"] = COINGECKO_API_KEY


# -------------------------------------------------------
# Chain configs
# -------------------------------------------------------

CHAINS = {
    "robinhood": {
        "name": "Robinhood Chain",
        "rpc_url": "https://rpc.mainnet.chain.robinhood.com",
        "native_symbol": "ETH",
        "coingecko_id": "ethereum",
        "chain_id": 4663,
        "badge_color": "#00C805",
        "badge_letter": "R",
        # Blockscout explorer instance for this chain - free, no API key
        "explorer_url": "https://robinhoodchain.blockscout.com",
        # DexScreener's chain slug for this network
        "dexscreener_chain": "robinhood",
    },
    "stable": {
        "name": "Stable Mainnet",
        "rpc_url": "https://rpc.stable.xyz",
        "native_symbol": "USDT0",
        "coingecko_id": "usdt0",
        "chain_id": 988,
        "badge_color": "#26A17B",
        "badge_letter": "S",
        # No free explorer API available yet for this chain
        "explorer_url": None,
        "dexscreener_chain": "stable",
    },
}


# Symbols that should be pegged near $1 if genuine - used to flag
# likely scam tokens impersonating a real stablecoin's name/symbol.
STABLECOIN_SYMBOLS = {"USDT", "USDC", "USDG", "DAI", "BUSD", "USDT0", "USDE"}


def _is_likely_fake_stablecoin(symbol, price):
    if symbol.upper() not in STABLECOIN_SYMBOLS:
        return False
    if price <= 0:
        return False
    # A genuine stablecoin should be close to $1 - flag if off by more
    # than 20%, a strong signal of a scam token reusing the same name.
    return price < 0.80 or price > 1.20


def _rpc_call(rpc_url, method, params):
    try:
        response = requests.post(
            rpc_url,
            json={
                "jsonrpc": "2.0",
                "id": 1,
                "method": method,
                "params": params,
            },
            timeout=15,
        )
        data = response.json()

        if "error" in data:
            print(f"[EVM Portfolio] RPC error on {method}: {data['error']}")
            return None

        return data.get("result")

    except Exception as e:
        print(f"[EVM Portfolio] RPC exception on {method}: {e}")
        return None


def _get_native_balance(rpc_url, address):
    result = _rpc_call(rpc_url, "eth_getBalance", [address, "latest"])

    if not result:
        return 0

    try:
        wei = int(result, 16)
        return wei / 1_000_000_000_000_000_000  # wei -> ETH-denominated
    except Exception:
        return 0


def _get_native_price_usd(coingecko_id):
    try:
        response = requests.get(
            "https://api.coingecko.com/api/v3/simple/price",
            params={"ids": coingecko_id, "vs_currencies": "usd"},
            headers=COINGECKO_HEADERS,
            timeout=10,
        )
        response.raise_for_status()

        data = response.json()
        return float(data.get(coingecko_id, {}).get("usd", 0))

    except Exception as e:
        print(f"[EVM Portfolio] Price lookup failed for {coingecko_id}: {e}")
        return 0


def _get_erc20_holdings(explorer_url, address):
    """
    Fetch ERC-20 token balances for an address via a self-hosted
    Blockscout instance's free public API (no key needed).
    """

    try:
        response = requests.get(
            f"{explorer_url}/api/v2/addresses/{address}/tokens",
            params={"type": "ERC-20"},
            timeout=15,
        )
        response.raise_for_status()

        data = response.json()
        items = data.get("items", [])

        holdings = []

        for item in items:
            token = item.get("token", {})
            decimals = int(token.get("decimals") or 18)
            raw_value = item.get("value", "0")

            # Blockscout's field name for the contract address has varied
            # across versions - try both to be safe.
            contract_address = token.get("address") or token.get("address_hash")

            try:
                amount = int(raw_value) / (10 ** decimals)
            except Exception:
                continue

            if amount <= 0:
                continue

            if not contract_address:
                print(
                    f"[EVM Portfolio DEBUG] No contract address found for "
                    f"token: {token}"
                )
                continue

            holdings.append(
                {
                    "symbol": token.get("symbol", "?"),
                    "name": token.get("name", token.get("symbol", "?")),
                    "contract_address": contract_address,
                    "amount": amount,
                }
            )

        return holdings

    except Exception as e:
        print(f"[EVM Portfolio] Blockscout token fetch failed: {e}")
        return []


def _get_dexscreener_price(chain_slug, contract_address):
    try:
        response = requests.get(
            f"https://api.dexscreener.com/latest/dex/tokens/{contract_address}",
            timeout=10,
        )
        response.raise_for_status()

        data = response.json()
        pairs = data.get("pairs") or []

        chain_pairs = [p for p in pairs if p.get("chainId") == chain_slug]

        if not chain_pairs:
            return 0

        best = max(
            chain_pairs,
            key=lambda p: float((p.get("liquidity") or {}).get("usd") or 0),
        )

        return float(best.get("priceUsd") or 0)

    except Exception as e:
        print(f"[EVM Portfolio] DexScreener price failed for {contract_address}: {e}")
        return 0


def get_evm_portfolio(chain_key, address):
    chain = CHAINS.get(chain_key)

    if not chain:
        return {
            "success": False,
            "message": f"Unsupported chain: {chain_key}",
        }

    holdings = []
    total_value = 0

    # Native token
    native_amount = _get_native_balance(chain["rpc_url"], address)
    native_price = _get_native_price_usd(chain["coingecko_id"])
    native_value = round(native_amount * native_price, 2)

    if native_amount > 0:
        holdings.append(
            {
                "symbol": chain["native_symbol"],
                "name": chain["native_symbol"],
                "amount": native_amount,
                "price_usd": native_price,
                "value_usd": native_value,
            }
        )
        total_value += native_value

    # ERC-20 tokens (only for chains with a free explorer API set up)
    erc20_supported = bool(chain.get("explorer_url"))

    if erc20_supported:
        tokens = _get_erc20_holdings(chain["explorer_url"], address)

        for token in tokens:
            price = _get_dexscreener_price(
                chain["dexscreener_chain"], token["contract_address"]
            )
            value_usd = round(token["amount"] * price, 2)

            # Note: unlike Solana's spam-token filtering, we deliberately
            # do NOT hide small-value holdings here - on a brand-new chain,
            # showing real (even tiny) priced positions is more useful
            # than hiding them.

            holdings.append(
                {
                    "symbol": token["symbol"],
                    "name": token["name"],
                    "contract_address": token["contract_address"],
                    "amount": token["amount"],
                    "price_usd": price,
                    "value_usd": value_usd,
                    "price_unavailable": price == 0,
                    "possible_scam_token": _is_likely_fake_stablecoin(
                        token["symbol"], price
                    ),
                }
            )
            total_value += value_usd

    # Allocation percentages
    for h in holdings:
        h["allocation_pct"] = (
            round((h["value_usd"] / total_value) * 100, 2)
            if total_value > 0
            else 0
        )

    ai_narrative = None

    if holdings:
        try:
            lines = [
                f"{h['symbol']} (${h['value_usd']}, {h['allocation_pct']}%)"
                + (" [WARNING: price far from $1 despite stablecoin-like name - likely a scam token impersonating a real stablecoin, not the genuine asset]" if h.get("possible_scam_token") else "")
                for h in holdings
            ]
            summary_text = (
                f"Wallet on {chain['name']} holds {len(holdings)} asset(s) "
                f"worth ${round(total_value, 2)} total: " + ", ".join(lines) + "."
                + (
                    " Some holdings are flagged as possible scam tokens impersonating "
                    "a real stablecoin's name - explicitly warn the user about these "
                    "specific flagged tokens, and note that the contract address should "
                    "be checked against the official token before trusting it."
                    if any(h.get("possible_scam_token") for h in holdings)
                    else ""
                )
            )
            ai_narrative = portfolio_review(summary_text)
        except Exception as e:
            print(f"[EVM Portfolio] AI narrative failed: {e}")

    note = (
        None
        if erc20_supported
        else "Currently shows native token balance only. ERC-20 token support coming soon for this chain."
    )

    return {
        "success": True,
        "data": {
            "chain": chain["name"],
            "chain_key": chain_key,
            "badge_color": chain["badge_color"],
            "badge_letter": chain["badge_letter"],
            "address": address,
            "total_value_usd": round(total_value, 2),
            "holdings_count": len(holdings),
            "holdings": holdings,
            "ai_narrative": ai_narrative,
            "note": note,
        },
    }
