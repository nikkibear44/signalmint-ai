import re

NARRATIVES = {
    "ai",
    "artificial intelligence",
    "depin",
    "defi",
    "rwa",
    "real world assets",
    "gamefi",
    "socialfi",
    "desci",
    "restaking",
    "layer 2",
    "layer2",
    "l2",
    "bitcoin defi",
    "memecoin",
    "meme",
    "privacy",
    "oracle",
    "payments",
    "stablecoin",
}


def detect_intent(query: str):
    query = query.strip()
    lower = query.lower()

    # ------------------------
    # COMPARE
    # ------------------------
    if " vs " in lower:

        clean = re.sub(
            r"^(compare|compare\s+between)\s+",
            "",
            query,
            flags=re.IGNORECASE,
        )

        parts = re.split(
            r"\s+vs\s+",
            clean,
            flags=re.IGNORECASE,
        )

        if len(parts) == 2:
            return {
                "intent": "compare",
                "token1": parts[0].strip(),
                "token2": parts[1].strip(),
            }

    # ------------------------
    # DUE DILIGENCE
    # ------------------------
    if lower.startswith("due diligence"):

        project = re.sub(
            r"^due diligence\s*",
            "",
            query,
            flags=re.IGNORECASE,
        )

        return {
            "intent": "due",
            "project": project.strip(),
        }

    # ------------------------
    # RESEARCH
    # ------------------------
    if lower.startswith("research"):

        project = re.sub(
            r"^research\s*",
            "",
            query,
            flags=re.IGNORECASE,
        )

        return {
            "intent": "due",
            "project": project.strip(),
        }

    # ------------------------
    # PORTFOLIO
    # ------------------------
    if "%" in query or "portfolio" in lower:
        return {
            "intent": "portfolio",
            "portfolio": query,
        }

    # ------------------------
    # NARRATIVE
    # ------------------------
    if lower in NARRATIVES:
        return {
            "intent": "narrative",
            "narrative": query,
        }

    # ------------------------
    # DEFAULT
    # ------------------------
    return {
        "intent": "analyze",
        "query": query,
    }