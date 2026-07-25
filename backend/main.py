from fastapi import FastAPI
from agent import crypto_analysis

app = FastAPI(
    title="Crypto Intelligence ASP",
    description="AI-powered crypto research assistant",
    version="1.0"
)


@app.get("/")
def home():
    return {
        "status": "Crypto Intelligence ASP is running"
    }


@app.post("/analyze")
def analyze(data: dict):

    query = data.get("query")

    result = crypto_analysis(query)

    return {
    "service": "Crypto Intelligence Analyst",
    "query": query,
    "report": result
}