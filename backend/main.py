from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import crypto_analysis

app = FastAPI(
    title="Crypto Intelligence ASP",
    description="AI-powered crypto research assistant",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    query: str


@app.get("/")
def home():
    return {
        "status": "Crypto Intelligence ASP is running"
    }


@app.post("/analyze")
def analyze(data: AnalyzeRequest):

    query = data.query

    if not query.strip():
        return {
            "error": "Query cannot be empty."
        }

    result = crypto_analysis(query)

    return {
        "service": "Crypto Intelligence Analyst",
        "query": query,
        "report": result
    }