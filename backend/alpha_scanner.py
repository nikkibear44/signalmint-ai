import json

from trending import get_trending_tokens
from agent import ask_ai


def build_prompt(tokens):
    lines = []

    for coin in tokens:
        lines.append(
            f"""
Name: {coin["name"]}
Symbol: {coin["symbol"]}
Price: {coin["price"]}
24h Change: {coin["change_24h"]}%
Market Cap: {coin["market_cap"]}
"""
        )

    market_data = "\n".join(lines)

    return f"""
You are a professional crypto research analyst.

Below is a list of trending cryptocurrencies.

{market_data}

Rank the TOP 5 asymmetric investment opportunities over the next 3–12 months.

Do NOT rank projects solely because they have the largest market capitalization.

Consider:

- Growth potential
- Momentum
- Innovation
- Ecosystem strength
- Narrative
- Risk versus reward

Favor projects with the highest upside rather than the safest assets.

For each project provide:

- Rank
- Name
- Symbol
- AI Score (0-100)
- Risk (Low / Medium / High)
- Confidence (0-100)
- One short catalyst
- Three concise investment reasons based on the available market data and your crypto knowledge.

Return ONLY valid JSON.

Do not include markdown.

Do not include ```json.

Do not include explanations outside the JSON.

Example:

[
  {{
    "rank":1,
    "name":"Example",
    "symbol":"EX",
    "ai_score":92,
    "risk":"Medium",
    "confidence":90,
    "catalyst":"Growing ecosystem",
    "reasons":[
      "...",
      "...",
      "..."
    ]
  }}
]
"""

def scan_alpha():
    trending = get_trending_tokens()[:10]

    prompt = build_prompt(trending)

    response = ask_ai(prompt)

    try:
        ai_results = json.loads(response)

        # Create lookup table using symbol
        market_lookup = {
            coin["symbol"].upper(): coin
            for coin in trending
        }

        merged = []

        for item in ai_results:
            market = market_lookup.get(item["symbol"].upper(), {})

            merged.append({
                **item,
                "price": market.get("price"),
                "change_24h": market.get("change_24h"),
                "market_cap": market.get("market_cap"),
            })

        return merged

    except json.JSONDecodeError:
        return {
            "error": "Failed to parse AI response.",
            "raw_response": response,
        }