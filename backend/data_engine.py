from market import get_market_data
from defillama import get_protocol


def collect_project_data(project):
    cg = get_market_data(project)
    dl = get_protocol(project)

    verified = {
        "name": {
            "value": cg.get("name") if cg else None,
            "verified": True
        },

        "symbol": {
            "value": cg.get("symbol") if cg else None,
            "verified": True
        },

        "price": {
            "value": cg.get("price") if cg else None,
            "verified": True
        },

        "market_cap": {
            "value": cg.get("market_cap") if cg else None,
            "verified": True
        },

        "volume": {
            "value": cg.get("volume") if cg else None,
            "verified": True
        },

        "change_24h": {
            "value": cg.get("change_24h") if cg else None,
            "verified": True
        },

        "change_7d": {
            "value": cg.get("change_7d") if cg else None,
            "verified": True
        },

        "change_30d": {
            "value": cg.get("change_30d") if cg else None,
            "verified": True
        },

        "change_1y": {
            "value": cg.get("change_1y") if cg else None,
            "verified": True
        },

        "ath": {
            "value": cg.get("ath") if cg else None,
            "ath_change_percentage": cg.get("ath_change_percentage") if cg else None,
            "verified": True
        },

        "atl": {
            "value": cg.get("atl") if cg else None,
            "verified": True
        },

        "total_supply": {
            "value": cg.get("total_supply") if cg else None,
            "verified": True
        },

        "circulating_supply": {
            "value": cg.get("circulating_supply") if cg else None,
            "verified": True
        },

        "max_supply": {
            "value": cg.get("max_supply") if cg else None,
            "verified": True
        },

        "twitter_followers": {
            "value": cg.get("twitter_followers") if cg else None,
            "verified": True,
            "note": "Follower count is a static community size metric, not real-time attention/buzz."
        },

        "reddit_subscribers": {
            "value": cg.get("reddit_subscribers") if cg else None,
            "verified": True
        },

        "telegram_users": {
            "value": cg.get("telegram_users") if cg else None,
            "verified": True
        },

        "tvl": {
            "current": dl.get("tvl") if dl else None,
            "historical_available": False
        },

        "categories": {
            "value": cg.get("categories") if cg else [],
            "classification_only": True
        },

        "website": {
            "value": cg.get("homepage") if cg else None,
            "verified": True
        },

        "github": {
            "repository": dl.get("github") if dl else None,
            "activity_known": False
        },

        "twitter": {
            "account": dl.get("twitter") if dl else None,
            "verified": True
        }
    }

    unavailable = [
        "Team",
        "Founders",
        "Investors",
        "Funding Rounds",
        "Audit Reports",
        "Historical TVL",
        "Token Allocation",
        "Vesting Schedule",
        "Treasury",
        "Active Users",
        "Partnerships",
    ]

    return {
        "verified": verified,
        "unavailable": unavailable,
    }
