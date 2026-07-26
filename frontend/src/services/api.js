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