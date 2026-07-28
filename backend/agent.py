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


def due_diligence(user_query):
    import json

    project = extract_project_name(user_query)

    if project.upper() == "UNKNOWN":
        project = user_query  # fall back to raw input as a last resort

    project_data = collect_project_data(project)

    live_data = json.dumps(project_data, indent=2)

    prompt = f"""
{DUE_DILIGENCE_PROMPT}

The user's original question was:
"{user_query}"

Before the full report, add this section FIRST, above "# Executive Summary":

# Direct Answer

Answer the user's original question directly in 2-4 concise sentences, using only the verified JSON data below. If their question can't be fully answered from the available data, say so explicitly rather than guessing.

---

The following JSON is the ONLY verified evidence.

{live_data}

Rules:

1. Treat this JSON as the only factual source.

2. Never infer missing information.

3. If a field is unavailable, write exactly:

"Not available from provided live data."

4. Categories are classifications only.
They do NOT prove architecture, technology, security, or implementation.

5. GitHub repository existence does NOT imply active development.

6. Current TVL does NOT imply TVL growth.

7. Never discuss historical TVL unless historical data exists.

Project:
{project}
"""

    return ask_ai(prompt)


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
