"""
recommendations.py — Data-driven sector recommendations router.

Replaces the hardcoded RECOMMENDATIONS dict with a live pipeline:
  1. fetch_country_data()  →  real World Bank indicators
  2. rank_sectors()        →  scored sectors derived from those indicators

The old hardcoded dict is gone. Every score is now computed, not invented.
"""

from fastapi import APIRouter
# NEW (correct)
from ..data.ingest import fetch_country_data
from ..data.scorer import rank_sectors

router = APIRouter()


@router.get("/{country_code}")
def recommend_diversification(country_code: str, top_n: int = 5):
    """
    Returns ranked diversification opportunities for a country,
    scored directly from World Bank macroeconomic indicators.

    Query params:
        top_n   how many sectors to return (default 5, max 7)
    """
    code = country_code.upper()
    top_n = max(1, min(top_n, 7))   # guard: 1–7

    # Step 1: get real indicators (live WB API or regional fallback)
    indicators = fetch_country_data(code)

    # Step 2: score all sectors against those indicators
    ranked = rank_sectors(indicators, top_n=top_n)

    return {
        "country_code": code,
        "indicators_used": indicators,          # full transparency on inputs
        "recommendations": ranked,
        "basis": (
            "Scores computed from World Bank indicators: "
            "GDP growth, inflation, trade openness, FDI, "
            "export diversification, import dependency, commodity exposure."
        ),
        "data_source": "World Bank API (api.worldbank.org/v2) with regional fallbacks",
    }