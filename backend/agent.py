import os
from openai import OpenAI
from dotenv import load_dotenv
from market import get_market_data

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


def crypto_analysis(query):

    market = get_market_data(query.strip())

    market_info = ""

    if market:
        market_info = f"""
Current Market Data

Price: ${market['price']}
24h Change: {market['change']:.2f}%
Market Cap: ${market['market_cap']:,.0f}
24h Volume: ${market['volume']:,.0f}
"""

    prompt = f"""
You are Crypto Intelligence Analyst, an expert Web3 research assistant.

Analyze:

{query}

{market_info}

If the user provides only a token symbol (example: SOL, ETH, BTC, ANSEM),
identify the corresponding project automatically.

Return a structured report in this format:

# Crypto Intelligence Report

## Overview
(2–3 concise sentences)

## Main Narratives
- Bullet 1
- Bullet 2
- Bullet 3

## Bull Case
- Bullet 1
- Bullet 2
- Bullet 3

## Bear Case
- Bullet 1
- Bullet 2
- Bullet 3

## Risk Level
Choose one: Low / Medium / High

Explain briefly why.

## Final Summary
(2–3 concise sentences)

Do not provide financial advice.
Always present balanced arguments.
Keep the report concise and professional.
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response.choices[0].message.content