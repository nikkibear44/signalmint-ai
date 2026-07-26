import requests

BASE_URL = "https://api.llama.fi"


def get_protocol(protocol_name):
    """
    Fetch protocol information from DefiLlama.
    Returns None if the protocol is not found.
    """
    try:
        response = requests.get(
            f"{BASE_URL}/protocol/{protocol_name.lower()}",
            timeout=10,
        )

        if response.status_code != 200:
            return None

        data = response.json()

        # DefiLlama returns historical TVL.
        # Keep only the latest TVL value.
        tvl_history = data.get("tvl", [])

        current_tvl = None
        if isinstance(tvl_history, list) and len(tvl_history) > 0:
            latest = tvl_history[-1]
            if isinstance(latest, dict):
                current_tvl = latest.get("totalLiquidityUSD")

        return {
            "tvl": current_tvl,
            "github": data.get("github"),
            "twitter": data.get("twitter"),
        }

    except Exception as e:
        print("DefiLlama Error:", e)
        return None