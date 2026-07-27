import os
import requests
from dotenv import load_dotenv

load_dotenv()

HELIUS_API_KEY = os.getenv("HELIUS_API_KEY")

# Replace with ONE wallet from wallets.json
WALLET = "ASnntwbUhxEQDg7C6j9gBq95VL3hwtV3htnzx66HKbJ"

url = (
    f"https://api.helius.xyz/v0/addresses/"
    f"{WALLET}/transactions"
    f"?api-key={HELIUS_API_KEY}&limit=3"
)

response = requests.get(url)

print("Status:", response.status_code)
print(response.text[:1000])