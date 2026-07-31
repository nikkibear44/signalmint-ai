import { useEffect, useRef, useState } from "react";

/**
 * Browser-side x402 payment flow for SignalMint's paid endpoints.
 *
 * Wire format (challenge body, EIP-712 typed data, PAYMENT-SIGNATURE header
 * shape) confirmed against a real onchainos CLI payment tonight — captured
 * via a temporary debug log on the server, not guessed. See the constants
 * and buildTypedData()/buildPaymentPayload() below for exactly what was
 * observed.
 *
 * Isolated component: not wired into any page yet. Nothing here touches
 * TokenIntelligence.jsx, AssetBattle.jsx, x402_payment.py, or main.py.
 */

const API_BASE = "https://signalmint-ai.onrender.com";

const X_LAYER_CHAIN_ID_HEX = "0xc4"; // 196 decimal
const X_LAYER_ADD_PARAMS = {
  chainId: X_LAYER_CHAIN_ID_HEX,
  chainName: "X Layer",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: ["https://rpc.xlayer.tech"],
  blockExplorerUrls: ["https://www.oklink.com/x-layer"],
};

// Confirmed against real transaction receipts (eth_getTransactionReceipt
// `to` field) from tonight's CLI-driven payments — not just from docs.
const X402_PERMIT2_PROXY = "0x402085c248EeA27D92E8b30b2C58ed07f9E20001";
const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

const STEPS = {
  IDLE: "idle",
  CONNECTING: "connecting",
  SWITCHING_CHAIN: "switching_chain",
  REQUESTING_CHALLENGE: "requesting_challenge",
  BUILDING_PAYLOAD: "building_payload",
  AWAITING_SIGNATURE: "awaiting_signature",
  VERIFYING: "verifying",
  SUCCESS: "success",
  ERROR: "error",
};

const STEP_LABELS = {
  [STEPS.CONNECTING]: "Connecting to OKX Wallet...",
  [STEPS.SWITCHING_CHAIN]: "Switching to X Layer...",
  [STEPS.REQUESTING_CHALLENGE]: "Requesting payment terms...",
  [STEPS.BUILDING_PAYLOAD]: "Preparing payment...",
  [STEPS.AWAITING_SIGNATURE]: "Waiting for your signature in OKX Wallet...",
  [STEPS.VERIFYING]: "Verifying payment and generating report...",
};

// Cryptographically secure uint256, per Permit2's actual constraint
// (nonce <= 2^256-1, no built-in generator in Uniswap's own SDK — random
// is the universal convention since the bitmap space is enormous).
function randomUint256Decimal() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes); // NOT Math.random()
  let hex = "0x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return BigInt(hex).toString();
}

async function ensureXLayer(provider) {
  const currentChainId = await provider.request({ method: "eth_chainId" });

  if (currentChainId?.toLowerCase() === X_LAYER_CHAIN_ID_HEX) {
    return;
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: X_LAYER_CHAIN_ID_HEX }],
    });
  } catch (switchError) {
    // 4902 = chain not added to the wallet yet (standard EIP-3085 code)
    if (switchError?.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [X_LAYER_ADD_PARAMS],
      });
    } else {
      throw switchError;
    }
  }
}

function buildTypedData({ requirement, payerAddress, nonce, deadline, validAfter }) {
  return {
    domain: {
      name: "Permit2",
      chainId: 196,
      verifyingContract: PERMIT2_ADDRESS,
    },
    types: {
      // Required for the RAW eth_signTypedData_v4 JSON-RPC method (unlike
      // ethers.js's signer.signTypedData(), which injects this for you).
      // Without it, the wallet must infer the domain's type schema itself —
      // any difference in that inference produces a different domain
      // separator and an invalid signature, even though every value we
      // control (nonce/deadline/etc.) looks correct. Must match the exact
      // fields present in `domain` below (no version/salt — Permit2's own
      // domain never has those).
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      PermitWitnessTransferFrom: [
        { name: "permitted", type: "TokenPermissions" },
        { name: "spender", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
        { name: "witness", type: "Witness" },
      ],
      TokenPermissions: [
        { name: "token", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      Witness: [
        { name: "to", type: "address" },
        { name: "validAfter", type: "uint256" },
      ],
    },
    primaryType: "PermitWitnessTransferFrom",
    message: {
      permitted: {
        token: requirement.asset,
        amount: requirement.amount,
      },
      spender: X402_PERMIT2_PROXY,
      nonce,
      deadline,
      witness: {
        to: requirement.payTo,
        validAfter,
      },
    },
  };
}

// Matches x402_payment.py's decode_payment_signature() + _requirements_match()
// exactly — confirmed tonight via a captured real payload, not inferred.
function buildPaymentPayload({ challenge, requirement, payerAddress, signature, nonce, deadline, validAfter }) {
  return {
    x402Version: 2,
    resource: challenge.resource,
    accepted: requirement, // echoed verbatim — the server re-validates this itself, never trusts it blindly
    payload: {
      permit2Authorization: {
        deadline,
        from: payerAddress,
        nonce,
        permitted: {
          amount: requirement.amount,
          token: requirement.asset,
        },
        spender: X402_PERMIT2_PROXY,
        witness: {
          to: requirement.payTo,
          validAfter,
        },
      },
      signature,
    },
  };
}

function encodeHeader(payload) {
  return btoa(JSON.stringify(payload));
}

// Reload-survival guard. Not real server-backed idempotency (the backend
// has no persistence to check "was this already paid" against) — this is a
// client-side safety net: if a paid request was sent but we never got a
// definitive response (network failure, tab closed, page reloaded), we
// genuinely don't know whether it settled. Rather than silently allowing a
// blind retry in that case, we require explicit acknowledgement.
// Cleared as soon as we get ANY parsed response back — success or a clean
// error — since per the x402 spec's verification order (signature ->
// allowance -> balance -> deadline, all checked before settlement), a clean
// error response means we know for certain no funds moved.
const PENDING_TTL_MS = 10 * 60 * 1000; // stale beyond this = assume abandoned/failed, don't nag

function pendingKey(endpoint, requestBody) {
  return `x402-pending:${endpoint}:${JSON.stringify(requestBody)}`;
}

function readPendingMarker(endpoint, requestBody) {
  try {
    const raw = localStorage.getItem(pendingKey(endpoint, requestBody));
    if (!raw) return null;
    const marker = JSON.parse(raw);
    if (Date.now() - marker.startedAt > PENDING_TTL_MS) {
      localStorage.removeItem(pendingKey(endpoint, requestBody));
      return null;
    }
    return marker;
  } catch {
    return null;
  }
}

function writePendingMarker(endpoint, requestBody, nonce) {
  try {
    localStorage.setItem(
      pendingKey(endpoint, requestBody),
      JSON.stringify({ startedAt: Date.now(), nonce })
    );
  } catch {
    // localStorage unavailable (private mode etc.) — the in-mount ref guard
    // still covers the same-click case, just not the reload case.
  }
}

function clearPendingMarker(endpoint, requestBody) {
  try {
    localStorage.removeItem(pendingKey(endpoint, requestBody));
  } catch {
    // ignore
  }
}

/**
 * Props:
 * - endpoint: string, e.g. "/x402/due-diligence"
 * - requestBody: object sent as the JSON body (e.g. { project: "Solana" })
 * - onSuccess: (data) => void — called with the parsed JSON result on success
 * - dryRun: boolean, default true — when true, builds and console.logs the
 *   full payload instead of requesting a real signature or sending it.
 *   Flip to false only once the logged payload has been visually verified.
 */
function PayToUnlock({ endpoint, requestBody, onSuccess, dryRun = true, showResult = true }) {
  const [step, setStep] = useState(STEPS.IDLE);
  const [error, setError] = useState("");
  const [dryRunPayload, setDryRunPayload] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [pendingWarning, setPendingWarning] = useState(null); // marker from a prior unresolved attempt, if any

  // Synchronous re-entrancy lock — deliberately NOT React state. State
  // updates (setStep) are async, so two rapid clicks can both pass an
  // `isBusy` check before the first re-render disables the button. A ref
  // is checked and set synchronously, in the same tick as the click.
  const isPayingRef = useRef(false);

  // On mount (including after a reload mid-payment), check whether a
  // payment for this exact endpoint+requestBody was left unresolved.
  useEffect(() => {
    setPendingWarning(readPendingMarker(endpoint, requestBody));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, JSON.stringify(requestBody)]);

  async function handlePay({ overridePendingWarning = false } = {}) {
    if (isPayingRef.current) return; // same-click / double-invocation guard
    if (pendingWarning && !overridePendingWarning) return; // must explicitly acknowledge first
    isPayingRef.current = true;

    setError("");
    setDryRunPayload(null);
    setSuccessData(null);

    const provider = window?.okxwallet;

    if (!provider) {
      setError("OKX Wallet not detected. Install the OKX Wallet browser extension.");
      setStep(STEPS.ERROR);
      isPayingRef.current = false;
      return;
    }

    try {
      // 1. Connect — always confirm the LIVE active account, never trust a
      // cached WalletContext value. eth_requestAccounts is safe to call even
      // when already connected (it won't re-prompt); if the extension's
      // active account was switched since a previous connection, this is
      // what catches it instead of silently signing with a stale address.
      setStep(STEPS.CONNECTING);
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const payerAddress = accounts?.[0];

      if (!payerAddress) {
        throw new Error("No account returned by OKX Wallet.");
      }

      // 2. Ensure X Layer
      setStep(STEPS.SWITCHING_CHAIN);
      await ensureXLayer(provider);

      // 3. Get the 402 challenge (read from the JSON body, not headers —
      // PAYMENT-REQUIRED isn't in Access-Control-Expose-Headers yet, so
      // the browser can't read it from response.headers; the body already
      // carries the same challenge, so we use that instead).
      setStep(STEPS.REQUESTING_CHALLENGE);
      const challengeResp = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (challengeResp.status !== 402) {
        throw new Error(
          `Expected a 402 payment challenge, got HTTP ${challengeResp.status}.`
        );
      }

      const challenge = await challengeResp.json();
      const requirement = challenge?.accepts?.[0];

      if (!requirement) {
        throw new Error("Server's 402 response had no accepts[] entry.");
      }

      // 4. Build the payload
      setStep(STEPS.BUILDING_PAYLOAD);
      const nonce = randomUint256Decimal();
      const nowSec = Math.floor(Date.now() / 1000);
      const validAfter = String(nowSec);
      const deadline = String(nowSec + (requirement.maxTimeoutSeconds || 60));

      const typedData = buildTypedData({
        requirement,
        payerAddress,
        nonce,
        deadline,
        validAfter,
      });

      if (dryRun) {
        // eslint-disable-next-line no-console
        console.log("[PayToUnlock] dry-run typed data:", typedData);
        const previewPayload = buildPaymentPayload({
          challenge,
          requirement,
          payerAddress,
          signature: "0x<not signed — dry run>",
          nonce,
          deadline,
          validAfter,
        });
        // eslint-disable-next-line no-console
        console.log("[PayToUnlock] dry-run PAYMENT-SIGNATURE payload:", previewPayload);
        setDryRunPayload(previewPayload);
        setStep(STEPS.IDLE);
        return;
      }

      // 5. Request the signature
      setStep(STEPS.AWAITING_SIGNATURE);
      const typedDataString = JSON.stringify(typedData);

      let signature;
      try {
        signature = await provider.request({
          method: "eth_signTypedData_v4",
          params: [payerAddress, typedDataString],
        });
      } catch (signError) {
        if (signError?.code === 4001) {
          throw new Error("Signature request was rejected.");
        }
        throw signError;
      }

      // 6. Build the header and retry
      setStep(STEPS.VERIFYING);
      const paymentPayload = buildPaymentPayload({
        challenge,
        requirement,
        payerAddress,
        signature,
        nonce,
        deadline,
        validAfter,
      });

      // Mark BEFORE sending — from this point on, funds may move. If we
      // reload or the tab dies before a response comes back, this is what
      // lets a future mount know the outcome is unknown rather than assuming
      // it's safe to pay again.
      writePendingMarker(endpoint, requestBody, nonce);
      setPendingWarning(null);

      let paidResp;
      let paidData;
      try {
        paidResp = await fetch(`${API_BASE}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "PAYMENT-SIGNATURE": encodeHeader(paymentPayload),
          },
          body: JSON.stringify(requestBody),
        });
        paidData = await paidResp.json();
      } catch (networkErr) {
        // Ambiguous: never got a parseable response, so we genuinely don't
        // know whether settlement happened. Deliberately do NOT clear the
        // pending marker here — that's the whole point of it.
        throw new Error(
          "Payment status unknown — the request failed before a response came back " +
          "(network error or timeout). Do NOT retry blindly: check your wallet balance " +
          "first. Original error: " + (networkErr?.message || networkErr)
        );
      }

      // We have a definitive, parsed response — per the x402 spec's
      // verification order (signature -> allowance -> balance -> deadline,
      // all before settlement), any response we can parse at all means we
      // know the real outcome, success or failure. Safe to clear either way.
      clearPendingMarker(endpoint, requestBody);

      if (!paidResp.ok) {
        throw new Error(paidData?.error || `Payment failed (HTTP ${paidResp.status}).`);
      }

      setStep(STEPS.SUCCESS);
      setSuccessData(paidData);
      onSuccess?.(paidData);
    } catch (err) {
      console.error("[PayToUnlock]", err);
      setError(err?.message || "Payment failed.");
      setStep(STEPS.ERROR);
    } finally {
      isPayingRef.current = false;
    }
  }

  const isBusy = step !== STEPS.IDLE && step !== STEPS.SUCCESS && step !== STEPS.ERROR;

  if (pendingWarning) {
    const ageMinutes = Math.floor((Date.now() - pendingWarning.startedAt) / 60000);
    return (
      <div style={{ border: "1px solid #b8860b", borderRadius: 8, padding: 16, background: "#2a2000" }}>
        <p style={{ color: "#ffcc66", fontWeight: "bold", margin: 0 }}>
          ⚠️ A payment attempt for this exact request started {ageMinutes < 1 ? "less than a minute" : `${ageMinutes} minute(s)`} ago
          and never received a confirmed response (page reload, closed tab, or network drop).
        </p>
        <p style={{ color: "#ffcc66", marginTop: 8 }}>
          We don't know if it settled. Please check your wallet balance before paying again —
          retrying blindly could charge you twice.
        </p>
        <button
          onClick={() => handlePay({ overridePendingWarning: true })}
          style={{ marginTop: 12 }}
          disabled={isBusy}
        >
          {isBusy ? STEP_LABELS[step] || "Working..." : "I checked — proceed anyway"}
        </button>
        <button
          onClick={() => {
            clearPendingMarker(endpoint, requestBody);
            setPendingWarning(null);
          }}
          style={{ marginTop: 12, marginLeft: 8 }}
          disabled={isBusy}
        >
          Dismiss (I confirmed it failed / already got my report)
        </button>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #333", borderRadius: 8, padding: 16 }}>
      <button onClick={() => handlePay()} disabled={isBusy}>
        {isBusy
          ? STEP_LABELS[step] || "Working..."
          : step === STEPS.SUCCESS
          ? "Paid — run again"
          : dryRun
          ? "Preview payment payload (dry run)"
          : "Pay to unlock"}
      </button>

      {step === STEPS.SUCCESS && successData && (
        <p style={{ color: "#4caf50", marginTop: 8, fontWeight: "bold" }}>
          ✅ Payment settled — report received below.
        </p>
      )}

      {error && (
        <p style={{ color: "#ff6b6b", marginTop: 8 }}>{error}</p>
      )}

      {showResult && successData && (
        <pre
          style={{
            marginTop: 12,
            padding: 12,
            background: "#111",
            color: "#0f0",
            fontSize: 12,
            overflowX: "auto",
            borderRadius: 6,
            whiteSpace: "pre-wrap",
          }}
        >
          {JSON.stringify(successData, null, 2)}
        </pre>
      )}

      {dryRunPayload && (
        <pre
          style={{
            marginTop: 12,
            padding: 12,
            background: "#111",
            color: "#0f0",
            fontSize: 12,
            overflowX: "auto",
            borderRadius: 6,
          }}
        >
          {JSON.stringify(dryRunPayload, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default PayToUnlock;
