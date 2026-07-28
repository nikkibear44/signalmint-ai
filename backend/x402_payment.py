"""
x402 payment verification against OKX's OnchainOS facilitator
(https://web3.okx.com/api/v6/pay/x402) on X Layer.

Scheme: "exact" + Permit2 (synchronous, single signature, settles immediately).
Permit2 is used instead of native EIP-3009 because USDT0 does not implement
transferWithAuthorization; Permit2 works against any standard ERC-20 via a
one-time allowance, which onchainos wallet clients already handle automatically.
"""

import base64
import hashlib
import hmac
import json
import os
from datetime import datetime, timezone

import requests
from dotenv import load_dotenv

load_dotenv()

FACILITATOR_BASE = "https://web3.okx.com/api/v6/pay/x402"

NETWORK = "eip155:196"  # X Layer mainnet

# USDT0 on X Layer — confirmed on-chain via eth_call decimals()/symbol()
# against 0x779ded0c9e1022225f8e0630b35a9b54be713736 (source: OKX onchainos
# payments dev-docs "Supported Stablecoins on X Layer" list).
ASSET_USDT0 = "0x779ded0c9e1022225f8e0630b35a9b54be713736"
ASSET_DECIMALS = 6

PAY_TO = os.getenv("X402_PAY_TO", "0x27800a3c6d2245ff91e8b08a8b155a39d129e905")
PRICE_USDT0 = os.getenv("X402_DUE_DILIGENCE_PRICE", "0.05")

OKX_API_KEY = os.getenv("OKX_API_KEY")
OKX_SECRET_KEY = os.getenv("OKX_SECRET_KEY")
OKX_PASSPHRASE = os.getenv("OKX_PASSPHRASE")


class PaymentVerificationError(Exception):
    """Raised when the facilitator rejects verification or settlement."""


def _price_to_atomic(price_str: str) -> str:
    return str(int(round(float(price_str) * (10 ** ASSET_DECIMALS))))


def _timestamp() -> str:
    now = datetime.now(timezone.utc)
    return now.strftime("%Y-%m-%dT%H:%M:%S.") + f"{now.microsecond // 1000:03d}Z"


def _signed_headers(method: str, request_path: str, body: str) -> dict:
    if not (OKX_API_KEY and OKX_SECRET_KEY and OKX_PASSPHRASE):
        raise PaymentVerificationError(
            "OKX_API_KEY / OKX_SECRET_KEY / OKX_PASSPHRASE are not configured."
        )

    ts = _timestamp()
    prehash = f"{ts}{method}{request_path}{body}"
    sign = base64.b64encode(
        hmac.new(OKX_SECRET_KEY.encode(), prehash.encode(), hashlib.sha256).digest()
    ).decode()

    return {
        "OK-ACCESS-KEY": OKX_API_KEY,
        "OK-ACCESS-SIGN": sign,
        "OK-ACCESS-PASSPHRASE": OKX_PASSPHRASE,
        "OK-ACCESS-TIMESTAMP": ts,
        "Content-Type": "application/json",
    }


def build_payment_requirements() -> dict:
    """The single canonical price/asset/recipient this server will accept."""
    return {
        "scheme": "exact",
        "network": NETWORK,
        "amount": _price_to_atomic(PRICE_USDT0),
        "asset": ASSET_USDT0,
        "payTo": PAY_TO,
        "maxTimeoutSeconds": 60,
        "extra": {"assetTransferMethod": "permit2"},
    }


def build_402_payload(resource_url: str, description: str) -> dict:
    requirements = build_payment_requirements()
    return {
        "x402Version": 2,
        "resource": {
            "url": resource_url,
            "description": description,
            "mimeType": "application/json",
        },
        "accepts": [requirements],
    }


def encode_header(payload: dict) -> str:
    return base64.b64encode(json.dumps(payload).encode()).decode()


def decode_payment_signature(header_value: str) -> dict:
    try:
        return json.loads(base64.b64decode(header_value))
    except Exception as exc:
        raise PaymentVerificationError(f"Malformed payment signature header: {exc}")


def _requirements_match(accepted: dict, expected: dict) -> bool:
    """
    Never trust the buyer's echoed `accepted` block for price/asset/recipient —
    only the server's own build_payment_requirements() is authoritative.
    Without this check a buyer could submit a signed payment for a lower
    amount (or a different asset/recipient) and still get the paid report.
    """
    return (
        accepted.get("scheme") == expected["scheme"]
        and accepted.get("network") == expected["network"]
        and accepted.get("asset") == expected["asset"]
        and accepted.get("payTo") == expected["payTo"]
        and int(accepted.get("amount", 0)) >= int(expected["amount"])
    )


def _facilitator_call(path: str, payment_payload: dict, payment_requirements: dict) -> dict:
    body = json.dumps(
        {
            "x402Version": 2,
            "paymentPayload": payment_payload,
            "paymentRequirements": payment_requirements,
        }
    )
    headers = _signed_headers("POST", path, body)
    resp = requests.post(f"https://web3.okx.com{path}", data=body, headers=headers, timeout=15)

    try:
        data = resp.json()
    except ValueError:
        raise PaymentVerificationError(f"Facilitator returned non-JSON (HTTP {resp.status_code})")

    if str(data.get("code")) not in ("0", "None"):
        raise PaymentVerificationError(data.get("msg") or f"Facilitator error {data.get('code')}")

    return data.get("data", {})


def verify_and_settle(payment_signature_header: str) -> dict:
    """
    Full pay-gate: decode -> validate against our own price -> verify signature
    -> settle on-chain. Raises PaymentVerificationError on any failure; the
    caller (the endpoint) is responsible for turning that into a 402.
    Returns the settle response dict (payer, transaction, status, ...) on success.
    """
    payment_payload = decode_payment_signature(payment_signature_header)
    accepted = payment_payload.get("accepted", {})
    expected = build_payment_requirements()

    if not _requirements_match(accepted, expected):
        raise PaymentVerificationError(
            "Submitted payment does not match this endpoint's required price/asset/recipient."
        )

    verify_result = _facilitator_call("/api/v6/pay/x402/verify", payment_payload, accepted)
    if not verify_result.get("isValid"):
        raise PaymentVerificationError(
            verify_result.get("invalidReason") or "Payment signature failed verification."
        )

    settle_result = _facilitator_call("/api/v6/pay/x402/settle", payment_payload, accepted)
    if not settle_result.get("success"):
        raise PaymentVerificationError(
            settle_result.get("errorReason") or "Payment settlement failed."
        )

    return settle_result
