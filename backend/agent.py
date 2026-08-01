import os
import re
import json

from openai import OpenAI
from dotenv import load_dotenv
from market import get_market_data
from prompts import (
    TOKEN_ANALYSIS_PROMPT,
    DUE_DILIGENCE_PROMPT,
)
from data_engine import collect_project_data

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def ask_ai(prompt):
    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )

    return response.choices[0].message.content


def ask_ai_premium(prompt):
    """
    Used for paid tier requests only - a stronger model for genuinely
    deeper reasoning, distinct from the free tier's ask_ai().
    """

    response = client.chat.completions.create(
        model="gpt-4.1",
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )

    return response.choices[0].message.content


def extract_section(report, section_name):
    headings = [
        "Executive Summary",
        "Market Snapshot",
        "Project Overview",
        "Investment Thesis",
        "Bull Case",
        "Bear Case",
        "Key Catalysts",
        "Competitive Landscape",
        "Risk Assessment",
        "AI Confidence",
        "Final Verdict",
    ]

    try:
        current = headings.index(section_name)
    except ValueError:
        return ""

    next_heading = None

    if current < len(headings) - 1:
        next_heading = headings[current + 1]

    if next_heading:
        pattern = (
            rf"{re.escape(section_name)}\s*"
            rf"([\s\S]*?)"
            rf"(?={re.escape(next_heading)})"
        )
    else:
        pattern = (
            rf"{re.escape(section_name)}\s*"
            rf"([\s\S]*)"
        )

    match = re.search(pattern, report, re.IGNORECASE)

    if not match:
        return ""

    content = match.group(1).strip()

    # Remove markdown separators anywhere at the end
    content = re.sub(r"\n+\s*---+\s*", "\n", content)
    content = re.sub(r"\n+\s*##+\s*", "\n", content)
    content = re.sub(r"\n+\s*#+\s*", "\n", content)

    # Remove trailing blank lines
    content = content.strip()

    return content


def remove_section(report, section_name):
    """
    Removes a whole section (its heading + body) from the report text.
    Used to strip sections that are already shown separately in the
    compact Executive Summary card, so the full report doesn't repeat them.
    """

    pattern = (
        rf"#{{1,3}}\s*{re.escape(section_name)}\s*"
        rf"[\s\S]*?"
        rf"(?=\n#{{1,3}}\s|\Z)"
    )

    cleaned = re.sub(pattern, "", report, count=1, flags=re.IGNORECASE)

    # Clean up any resulting stray horizontal rules or extra blank lines
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)

    return cleaned.strip()


def crypto_analysis(query):

    market = get_market_data(query.strip())

    market_info = "No live market data available."
    source_label = "Verified CoinGecko Information"

    if market:

        source = market.get("source")

        if source == "dexscreener":
            source_label = (
                "Live DEX Trading Data (DexScreener - this token is not "
                "yet listed on CoinGecko, so fundamentals like team/"
                "description/rank are unavailable; price/volume data "
                "reflects live on-chain trading)"
            )

        categories = ", ".join(market.get("categories", []))
        if not categories:
            categories = "N/A"

        market_info = f"""
Name: {market.get("name", "N/A")}
Symbol: {market.get("symbol", "N/A")}
Categories: {categories}

Description:
{market.get("description", "N/A")}

Homepage:
{market.get("homepage", "N/A")}

Current Price:
{market.get("price", "N/A")} USD

24h Change:
{market.get("change_24h", "N/A")}%

Market Cap:
{market.get("market_cap", "N/A")}

24h Volume:
{market.get("volume", "N/A")}

CoinGecko Rank:
{market.get("coingecko_rank", "N/A")}

Genesis Date:
{market.get("genesis_date", "N/A")}
"""

    prompt = f"""
{TOKEN_ANALYSIS_PROMPT}

Project:

{query}

{source_label}:

{market_info}

Use the verified information above as the factual source whenever applicable.
If the verified information conflicts with your prior knowledge, prefer the verified information.
Do not invent blockchain, partnerships, tokenomics, investors, or roadmap items.
"""

    print("=" * 80)
    print("MARKET INFO SENT TO GPT:")
    print(market_info)
    print("=" * 80)

    report = ask_ai(prompt)

    print("\n================ GPT REPORT ================\n")
    print(report)
    print("\n===========================================\n")

    bull_case = extract_section(report, "Bull Case")
    bear_case = extract_section(report, "Bear Case")
    catalysts = extract_section(report, "Key Catalysts")
    risk_assessment = extract_section(report, "Risk Assessment")
    ai_confidence = extract_section(report, "AI Confidence")
    summary = extract_section(report, "Executive Summary")

    print("SUMMARY:")
    print(repr(summary))

    print("CATALYSTS:")
    print(repr(catalysts))

    print("RISKS:")
    print(repr(risk_assessment))

    # Strip sections from the full report that are already shown
    # separately in the compact Executive Summary card, so the two
    # don't repeat the same content.
    report_cleaned = report
    report_cleaned = remove_section(report_cleaned, "Executive Summary")
    report_cleaned = remove_section(report_cleaned, "Key Catalysts")
    report_cleaned = remove_section(report_cleaned, "Risk Assessment")

    return {
        "market": market,
        "report": report_cleaned,
        "insights": {
            "summary": summary,
            "bull_case": bull_case,
            "bear_case": bear_case,
            "catalysts": catalysts,
            "risk_assessment": risk_assessment,
            "ai_confidence": ai_confidence,
        },
    }


def compare_tokens(token1, token2):

    market1 = get_market_data(token1.strip())
    market2 = get_market_data(token2.strip())

    print("\n" + "=" * 80)
    print("COMPARE DEBUG")
    print("=" * 80)
    print("TOKEN 1:", repr(token1))
    print("MARKET 1:", market1)
    print("-" * 80)
    print("TOKEN 2:", repr(token2))
    print("MARKET 2:", market2)
    print("=" * 80 + "\n")

    prompt = f"""
Compare these crypto assets.

Token 1:
{token1}

Market Data:
{market1}

Token 2:
{token2}

Market Data:
{market2}

Return Markdown with:

# Token Comparison

## Overview

## Market Comparison

## Strengths

## Weaknesses

## AI Verdict

Stay neutral.
"""

    return ask_ai(prompt)


def compare_tokens_premium(token1, token2):
    """
    Paid tier version - uses a stronger model and adds genuinely
    deeper comparative analysis sections not present in the free
    comparison report.
    """

    market1 = get_market_data(token1.strip())
    market2 = get_market_data(token2.strip())

    prompt = f"""
Compare these crypto assets. This is a PREMIUM comparison report.

Token 1:
{token1}

Market Data:
{market1}

Token 2:
{token2}

Market Data:
{market2}

Return Markdown with:

# Token Comparison

## Overview

## Market Comparison

## Strengths

## Weaknesses

## Risk-Adjusted Comparison

Compare the two assets specifically on a risk-adjusted basis - not just which has more upside, but which offers better return potential relative to its volatility and downside risk, using only the market data provided.

## Scenario Analysis

Reason through how each asset would likely perform under three different market conditions: a broad crypto bull market, a broad bear market, and a sideways/range-bound market. Base this on their market position and characteristics shown in the data, not invented price targets.

## Portfolio Fit

Discuss what type of investor or portfolio strategy each asset better suits (e.g. core holding vs. speculative satellite position, growth-oriented vs. value-oriented), based on their risk profile and market characteristics.

## AI Verdict

Stay neutral throughout. Never invent numbers not present in the supplied market data.
"""

    return ask_ai_premium(prompt)


def narrative_detector(narrative):

    prompt = f"""
Analyze this crypto narrative.

Narrative:
{narrative}

Return Markdown with:

# Narrative Analysis

## Overview

## Current Momentum

## Leading Projects

## Bull Case

## Bear Case

## Key Risks

## AI Outlook

Only mention real projects.
Do not invent project names.
"""

    return ask_ai(prompt)


def portfolio_review(portfolio):

    prompt = f"""
You are a professional crypto portfolio analyst.

Portfolio:

{portfolio}

Return Markdown.

# Portfolio Review

## Portfolio Summary

## Allocation Analysis

## Diversification

## Strengths

## Weaknesses

## Risk Score

## Suggestions

## AI Verdict

Do not provide financial advice.
"""

    return ask_ai(prompt)


def extract_project_name(user_query):
    """
    Extracts the actual project/token name from a natural-language
    question, so the free-text search box can accept full questions
    like "Is Solana a good long-term hold?" instead of requiring a
    bare project name.
    """

    prompt = f"""
Extract ONLY the crypto project or token name being asked about in this question.

Question:
{user_query}

Rules:
- Return ONLY the project/token name, nothing else.
- No explanation, no punctuation, no extra words.
- If multiple projects are mentioned, return the PRIMARY one being asked about.
- If no specific project is identifiable, return exactly: UNKNOWN
"""

    result = ask_ai(prompt).strip()

    return result


def _get_recent_whale_activity(symbol):
    """
    Cross-references the analyzed token against SignalMint's existing
    Smart Money whale feeds (Solana + Robinhood Chain). Each chain is
    wrapped in its own strict try/except with no hard dependency -
    if either is slow or fails, due_diligence() still returns the
    full report normally without that piece.
    """

    if not symbol:
        return None

    combined = {
        "buy_wallets": 0,
        "sell_wallets": 0,
        "total_buy_value_usd": 0,
        "chains": [],
    }

    # Solana
    try:
        from smart_money import get_smart_money

        feed = get_smart_money()

        matches = [
            tx for tx in feed
            if (tx.get("symbol") or "").upper() == symbol.upper()
        ]

        if matches:
            buys = [tx for tx in matches if tx.get("side") == "BUY"]
            sells = [tx for tx in matches if tx.get("side") == "SELL"]

            combined["buy_wallets"] += len(set(tx.get("wallet") for tx in buys))
            combined["sell_wallets"] += len(set(tx.get("wallet") for tx in sells))
            combined["total_buy_value_usd"] += sum(
                tx.get("value_usd") or 0 for tx in buys
            )
            combined["chains"].append("Solana")

    except Exception as e:
        print(f"[Due Diligence] Solana whale cross-check skipped: {e}")

    # Robinhood Chain
    try:
        from robinhood_smart_money import get_robinhood_smart_money

        feed = get_robinhood_smart_money()

        matches = [
            tx for tx in feed
            if (tx.get("symbol") or "").upper() == symbol.upper()
        ]

        if matches:
            buys = [tx for tx in matches if tx.get("side") == "BUY"]
            sells = [tx for tx in matches if tx.get("side") == "SELL"]

            combined["buy_wallets"] += len(set(tx.get("wallet") for tx in buys))
            combined["sell_wallets"] += len(set(tx.get("wallet") for tx in sells))
            combined["total_buy_value_usd"] += sum(
                tx.get("value_usd") or 0 for tx in buys
            )
            combined["chains"].append("Robinhood Chain")

    except Exception as e:
        print(f"[Due Diligence] Robinhood Chain whale cross-check skipped: {e}")

    if not combined["chains"]:
        return None

    combined["total_buy_value_usd"] = round(combined["total_buy_value_usd"], 2)

    return combined


def due_diligence(user_query):
    import json

    project = extract_project_name(user_query)

    if project.upper() == "UNKNOWN":
        project = user_query  # fall back to raw input as a last resort

    project_data = collect_project_data(project)

    # Cross-reference against tracked whale activity - real
    # differentiated data most due diligence tools won't have.
    symbol = project_data.get("verified", {}).get("symbol", {}).get("value")
    whale_activity = _get_recent_whale_activity(symbol)

    if whale_activity:
        project_data["tracked_whale_activity"] = whale_activity

    live_data = json.dumps(project_data, indent=2)

    prompt = f"""
{DUE_DILIGENCE_PROMPT}

The user's original question was:
"{user_query}"

Before the full report, add this section FIRST, above "# Executive Summary":

# Direct Answer

Answer the user's original question directly in 2-4 concise sentences, using only the verified JSON data below. If their question can't be fully answered from the available data, say so explicitly rather than guessing.

If the JSON below includes a "tracked_whale_activity" field, mention it naturally in the Adoption & Traction section as a real, verified signal - include which chain(s) it was tracked on (from the "chains" field), e.g. "X tracked whale wallets bought this token on [chain], totaling $Y." Do not mention it if that field is absent.

---

The following JSON is the ONLY verified evidence for QUANTITATIVE data (price, market cap, TVL, volume, rank).

{live_data}

Rules:

1. For price, market cap, volume, TVL, and any other NUMBER: treat the JSON above as the ONLY source. Never invent or estimate a number not present in the JSON.

2. For qualitative context (Team & Backers, Tokenomics utility/purpose, Competitive Landscape, general project background): if the project is WELL-ESTABLISHED and its founders/backers/competitors are broadly, publicly documented (e.g. major well-known protocols), you MAY state those well-known facts from general knowledge - but you MUST prefix that section's content with "(From general knowledge, not live-verified):" so the reader knows this isn't sourced from the JSON above.

3. If the project is small, new, or genuinely obscure enough that you don't have confident, well-established knowledge of it, do NOT guess. Write exactly:

"Not available from provided live data."

4. Never invent specific numbers (funding amounts, token allocation percentages, investor names) even for well-known projects unless you're confident they're accurate, widely-reported facts. When in doubt, omit rather than guess.

5. Categories are classifications only.
They do NOT prove architecture, technology, security, or implementation.

6. GitHub repository existence does NOT imply active development.

7. Current TVL does NOT imply TVL growth.

8. Never discuss historical TVL unless historical data exists.

Project:
{project}
"""

    return ask_ai(prompt)


def due_diligence_premium(user_query):
    """
    Paid tier version - uses a stronger model and adds genuinely
    deeper analysis sections not present in the free report, rather
    than just re-running the same prompt behind a paywall.
    """

    import json

    project = extract_project_name(user_query)

    if project.upper() == "UNKNOWN":
        project = user_query

    project_data = collect_project_data(project)

    symbol = project_data.get("verified", {}).get("symbol", {}).get("value")
    whale_activity = _get_recent_whale_activity(symbol)

    if whale_activity:
        project_data["tracked_whale_activity"] = whale_activity

    live_data = json.dumps(project_data, indent=2)

    prompt = f"""
{DUE_DILIGENCE_PROMPT}

This is a PREMIUM institutional report. In addition to every section already defined above, add these THREE extra sections at the end, after "AI Confidence":

## Extended Competitive Analysis

Identify 5 competitors (not 3), with deeper strategic analysis for each: not just strength/weakness, but what would need to change for this project to lose ground to that competitor specifically, and what structural moat (if any) protects against that.

## Scenario Analysis

Reason through three qualitative scenarios - Bull, Base, and Bear - describing what would realistically need to happen in each case (adoption trends, competitive dynamics, macro conditions). Do NOT give specific price targets or numbers not in the verified data - describe the conditions and trajectory qualitatively.

## Institutional Considerations

Discuss factors specifically relevant to institutional-size positions: liquidity depth relative to typical institutional order sizes (using the verified volume/market cap data), correlation considerations with broader crypto market movements, and portfolio role (e.g. core holding vs. satellite/speculative allocation) based on the project's risk profile established earlier in the report.

The user's original question was:
"{user_query}"

Before the full report, add this section FIRST, above "# Executive Summary":

# Direct Answer

Answer the user's original question directly in 2-4 concise sentences, using only the verified JSON data below. If their question can't be fully answered from the available data, say so explicitly rather than guessing.

If the JSON below includes a "tracked_whale_activity" field, mention it naturally in the Adoption & Traction section as a real, verified signal - include which chain(s) it was tracked on (from the "chains" field), e.g. "X tracked whale wallets bought this token on [chain], totaling $Y." Do not mention it if that field is absent.

---

The following JSON is the ONLY verified evidence for QUANTITATIVE data (price, market cap, TVL, volume, rank).

{live_data}

Rules:

1. For price, market cap, volume, TVL, and any other NUMBER: treat the JSON above as the ONLY source. Never invent or estimate a number not present in the JSON.

2. For qualitative context (Team & Backers, Tokenomics utility/purpose, Competitive Landscape, general project background): if the project is WELL-ESTABLISHED and its founders/backers/competitors are broadly, publicly documented (e.g. major well-known protocols), you MAY state those well-known facts from general knowledge - but you MUST prefix that section's content with "(From general knowledge, not live-verified):" so the reader knows this isn't sourced from the JSON above.

3. If the project is small, new, or genuinely obscure enough that you don't have confident, well-established knowledge of it, do NOT guess. Write exactly:

"Not available from provided live data."

4. Never invent specific numbers (funding amounts, token allocation percentages, investor names) even for well-known projects unless you're confident they're accurate, widely-reported facts. When in doubt, omit rather than guess.

5. Categories are classifications only.
They do NOT prove architecture, technology, security, or implementation.

6. GitHub repository existence does NOT imply active development.

7. Current TVL does NOT imply TVL growth.

8. Never discuss historical TVL unless historical data exists.

Project:
{project}
"""

    return ask_ai_premium(prompt)




def generate_trade_plan(coin):
    name = coin.get("name", "Unknown")
    symbol = coin.get("symbol", "N/A")
    price = coin.get("price", "N/A")
    change_24h = coin.get("change_24h", "N/A")
    market_cap = coin.get("market_cap", "N/A")
    catalyst = coin.get("catalyst", "No confirmed upcoming catalyst.")
    reasons = coin.get("reasons") or ["No specific reasons provided."]

    prompt = f"""
You are an elite crypto analyst.

Create an actionable trade plan using ONLY the information below.

Token:
{name} ({symbol})

Current Price:
{price}

24h Change:
{change_24h}%

Market Cap:
{market_cap}

Catalyst:
{catalyst}

Reasons:
{chr(10).join("- " + r for r in reasons)}

Return ONLY valid JSON.

Use this exact schema:

{{
  "overall_bias": "",
  "suggested_action": "",
  "entry_zone": "",
  "take_profit": "",
  "stop_loss": "",
  "holding_period": "",
  "risk_reward": "",
  "summary": ""
}}

Rules:
- Return JSON only.
- No Markdown.
- No code fences.
- No extra text.
- Keep every value concise.
- Base the response only on the supplied token information.
- If price, market cap, or 24h change is "N/A", explicitly account for that limited data in your summary rather than inventing numbers.
- For entry_zone, take_profit, stop_loss, holding_period, and risk_reward: if you do not have a real price to calculate specific dollar figures, do NOT write "N/A" and do NOT invent numbers. Instead give short, honest QUALITATIVE guidance for that field, for example:
  - entry_zone: "Wait for price discovery" or "Accumulate only on confirmed volume"
  - take_profit: "Reassess once price data is available"
  - stop_loss: "Exit if project shows signs of abandonment"
  - holding_period: "Long-term, pending market listing"
  - risk_reward: "Unquantifiable without price data"
- Never write "undefined", "null", "unknown", or leave a field blank.
- Only use specific dollar figures (e.g. "$0.05-$0.06") when a real current price was actually supplied above. Never fabricate a price-based figure when price is "N/A".
"""

    response = ask_ai(prompt)

    try:
        return json.loads(response)
    except Exception:
        return {
            "overall_bias": "Unknown",
            "suggested_action": "Unable to generate plan.",
            "entry_zone": "-",
            "take_profit": "-",
            "stop_loss": "-",
            "holding_period": "-",
            "risk_reward": "-",
            "summary": response,
        }


def build_portfolio_allocation(budget, risk_tolerance):
    """
    Given a budget and risk tolerance, allocates across today's
    top-ranked Alpha Scanner opportunities. Percentages are computed
    deterministically in Python (never trust an LLM to do exact math
    that must sum to 100%) - the AI's job is only to explain the
    reasoning, using the real numbers already computed.
    """

    from alpha_scanner import scan_alpha

    candidates = scan_alpha()

    if not candidates:
        return {
            "success": False,
            "message": "No opportunities available right now. Try again shortly.",
        }

    # Filter pool by risk tolerance
    risk_tolerance = (risk_tolerance or "medium").lower()

    if risk_tolerance == "low":
        pool = [c for c in candidates if c.get("risk") in ("Low", "Medium")]
    elif risk_tolerance == "high":
        pool = candidates
    else:
        pool = [c for c in candidates if c.get("risk") in ("Low", "Medium", "High")]

    if not pool:
        pool = candidates  # fallback if filter emptied it

    pool = pool[:5]  # top 5 after filtering

    # Weight allocation by AI Opportunity Score, normalized to 100%
    total_score = sum(c.get("ai_score", 50) for c in pool) or 1
    allocations = []

    for c in pool:
        weight = c.get("ai_score", 50) / total_score
        pct = round(weight * 100, 1)
        usd = round(budget * weight, 2)

        allocations.append(
            {
                "name": c.get("name"),
                "symbol": c.get("symbol"),
                "ai_score": c.get("ai_score"),
                "risk": c.get("risk"),
                "price": c.get("price"),
                "change_24h": c.get("change_24h"),
                "catalyst": c.get("catalyst"),
                "allocation_pct": pct,
                "allocation_usd": usd,
            }
        )

    # Fix rounding drift so percentages sum to exactly 100
    diff = round(100 - sum(a["allocation_pct"] for a in allocations), 1)
    if allocations:
        allocations[-1]["allocation_pct"] = round(
            allocations[-1]["allocation_pct"] + diff, 1
        )
        allocations[-1]["allocation_usd"] = round(
            budget - sum(a["allocation_usd"] for a in allocations[:-1]), 2
        )

    allocations_summary = "\n".join(
        f"- {a['name']} ({a['symbol']}): {a['allocation_pct']}% (${a['allocation_usd']}) "
        f"- AI Score {a['ai_score']}, Risk: {a['risk']}, Price: ${a['price']}, "
        f"24h: {a['change_24h']}%, Catalyst: {a['catalyst']}"
        for a in allocations
    )

    prompt = f"""
You are an AI portfolio construction assistant.

A user has ${budget} to invest with a {risk_tolerance} risk tolerance.

Based on today's top AI-ranked opportunities, the following allocation has
already been computed (percentages and dollar amounts are FINAL - do not
recalculate or change them):

{allocations_summary}

Write a clear explanation covering:

1. Overall strategy - why this allocation fits a {risk_tolerance} risk tolerance
2. For EACH asset: one or two sentences on why it's included and at that weight
3. Suggested entry approach - using the real price data given, suggest whether
   to enter immediately or scale in gradually (do not invent specific price
   targets not derivable from the data given)
4. Key risks across the overall allocation, not just per-asset
5. A brief closing note reminding this is not financial advice

Never invent numbers not provided above. Keep it concise and well-organized
with clear headers.
"""

    narrative = ask_ai(prompt)

    return {
        "success": True,
        "budget": budget,
        "risk_tolerance": risk_tolerance,
        "allocations": allocations,
        "narrative": narrative,
    }


def find_hidden_alpha():
    """
    Surfaces tokens where real signal strength and real whale buying
    exist, but market cap is low (an honest proxy for "under the
    radar" - we do NOT track actual social/narrative attention data,
    so this is explicitly labeled as a market-cap-based proxy, not a
    claim of measured social sentiment).
    """

    from alpha_scanner import scan_alpha

    candidates = scan_alpha()
    results = []

    for c in candidates:
        symbol = c.get("symbol")

        if c.get("ai_score", 0) < 70:
            continue

        whale_activity = _get_recent_whale_activity(symbol)

        has_whale_buying = bool(
            whale_activity and whale_activity.get("buy_wallets", 0) > 0
        )

        if not has_whale_buying:
            continue

        results.append(
            {
                "name": c.get("name"),
                "symbol": symbol,
                "ai_score": c.get("ai_score"),
                "market_cap": c.get("market_cap"),
                "price": c.get("price"),
                "change_24h": c.get("change_24h"),
                "risk": c.get("risk"),
                "catalyst": c.get("catalyst"),
                "whale_buy_wallets": whale_activity.get("buy_wallets"),
                "whale_buy_usd": whale_activity.get("total_buy_value_usd"),
                "whale_chains": whale_activity.get("chains"),
            }
        )

    # Lowest market cap first among qualifying picks - our honest
    # "most likely overlooked" proxy.
    results.sort(key=lambda r: r.get("market_cap") or float("inf"))

    top_results = results[:5]

    if not top_results:
        return {
            "success": True,
            "results": [],
            "narrative": (
                "No tokens currently show both a strong AI signal and "
                "real tracked whale buying at the same time. This is "
                "expected most of the time - genuine overlaps are rare "
                "by design."
            ),
        }

    summary = "\n".join(
        f"- {r['name']} ({r['symbol']}): AI Score {r['ai_score']}, "
        f"Market Cap ${r['market_cap']:,.0f}, {r['whale_buy_wallets']} "
        f"whale wallet(s) bought ${r['whale_buy_usd']} on {', '.join(r['whale_chains'])}, "
        f"Catalyst: {r['catalyst']}"
        for r in top_results
    )

    prompt = f"""
You are identifying potentially overlooked crypto opportunities.

The following tokens ALL have real, verified signals:
- A strong AI Opportunity Score (70+)
- Real tracked whale wallets actively buying (not simulated)
- Relatively low market cap compared to typical large-cap tokens

{summary}

For each token, write 1-2 sentences on why the combination of real
whale buying + decent market signal + low market cap makes it worth
a closer look. Be honest: low market cap does NOT prove something is
truly "undiscovered" by the broader market - it's a proxy, not
certainty. Do not claim social media attention is low; we do not
measure that. Never invent numbers not provided above.

End with a brief overall note reminding the reader that low market
cap also means higher risk and lower liquidity.
"""

    narrative = ask_ai(prompt)

    return {
        "success": True,
        "results": top_results,
        "narrative": narrative,
    }

