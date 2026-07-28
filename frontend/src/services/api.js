const API_BASE = "http://127.0.0.1:8000";

export async function analyzeToken(query) {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to analyze token.");
  }

  return response.json();
}

export async function getMarketSnapshot() {
  const response = await fetch(`${API_BASE}/market-snapshot`);

  if (!response.ok) {
    throw new Error("Failed to fetch market snapshot.");
  }

  return response.json();
}

export async function getTrendingTokens() {
  const response = await fetch(`${API_BASE}/trending`);

  if (!response.ok) {
    throw new Error("Failed to fetch trending tokens.");
  }

  return response.json();
}

export async function getAlphaScanner() {
  const response = await fetch(`${API_BASE}/alpha-scanner`);

  if (!response.ok) {
    throw new Error("Failed to fetch Alpha Scanner.");
  }

  return response.json();
}

export async function getTradePlan(coin) {
  const response = await fetch(`${API_BASE}/trade-plan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      coin,
    }),
  });

  return response.json();
}

export async function getSmartMoney() {
  const response = await fetch(`${API_BASE}/smart-money`);

  if (!response.ok) {
    throw new Error("Failed to fetch Smart Money feed.");
  }

  return response.json();
}

export async function getWalletPortfolio(address) {
  const response = await fetch(`${API_BASE}/wallet-portfolio/${address}`);

  if (!response.ok) {
    throw new Error("Failed to fetch wallet portfolio.");
  }

  return response.json();
}