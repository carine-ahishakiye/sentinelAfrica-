from fastapi import APIRouter, HTTPException
from app.data.ingest import fetch_country_data
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

COUNTRIES = {
    # East Africa
    "RW": "Rwanda",
    "KE": "Kenya",
    "TZ": "Tanzania",
    "UG": "Uganda",
    "ET": "Ethiopia",
    "BI": "Burundi",
    "DJ": "Djibouti",
    "ER": "Eritrea",
    "SO": "Somalia",
    "SS": "South Sudan",
    # West Africa
    "NG": "Nigeria",
    "GH": "Ghana",
    "SN": "Senegal",
    "CI": "Côte d'Ivoire",
    "ML": "Mali",
    "BF": "Burkina Faso",
    "NE": "Niger",
    "TG": "Togo",
    "BJ": "Benin",
    "GN": "Guinea",
    # Central Africa
    "CM": "Cameroon",
    "CD": "DR Congo",
    "CG": "Congo",
    "GA": "Gabon",
    "TD": "Chad",
    "CF": "Central African Republic",
    # Southern Africa
    "ZA": "South Africa",
    "ZM": "Zambia",
    "ZW": "Zimbabwe",
    "BW": "Botswana",
    "MZ": "Mozambique",
    "AO": "Angola",
    "NA": "Namibia",
    "MW": "Malawi",
    # North Africa
    "EG": "Egypt",
    "MA": "Morocco",
    "DZ": "Algeria",
    "TN": "Tunisia",
    "LY": "Libya",
    "SD": "Sudan",
}

# Baseline fallback values per region when live data is unavailable
REGIONAL_BASELINES = {
    "RW": {"gdp_growth": 7.5, "inflation": 5.2, "trade_openness": 52.0, "export_diversification": 0.45, "fdi": 3.2},
    "KE": {"gdp_growth": 5.5, "inflation": 7.8, "trade_openness": 48.0, "export_diversification": 0.52, "fdi": 2.8},
    "TZ": {"gdp_growth": 5.1, "inflation": 4.5, "trade_openness": 38.0, "export_diversification": 0.38, "fdi": 2.1},
    "UG": {"gdp_growth": 5.8, "inflation": 6.2, "trade_openness": 41.0, "export_diversification": 0.35, "fdi": 2.4},
    "ET": {"gdp_growth": 6.1, "inflation": 22.0, "trade_openness": 28.0, "export_diversification": 0.28, "fdi": 3.5},
    "NG": {"gdp_growth": 3.1, "inflation": 18.5, "trade_openness": 35.0, "export_diversification": 0.22, "fdi": 1.8},
    "GH": {"gdp_growth": 3.8, "inflation": 23.0, "trade_openness": 58.0, "export_diversification": 0.41, "fdi": 2.6},
    "SN": {"gdp_growth": 4.9, "inflation": 3.8, "trade_openness": 55.0, "export_diversification": 0.48, "fdi": 3.0},
    "CM": {"gdp_growth": 3.9, "inflation": 4.1, "trade_openness": 42.0, "export_diversification": 0.39, "fdi": 1.9},
    "ZA": {"gdp_growth": 1.2, "inflation": 5.5, "trade_openness": 62.0, "export_diversification": 0.68, "fdi": 1.5},
    "EG": {"gdp_growth": 4.2, "inflation": 14.0, "trade_openness": 45.0, "export_diversification": 0.55, "fdi": 2.9},
    "MA": {"gdp_growth": 3.5, "inflation": 3.2, "trade_openness": 72.0, "export_diversification": 0.62, "fdi": 3.8},
    "BW": {"gdp_growth": 4.5, "inflation": 4.8, "trade_openness": 80.0, "export_diversification": 0.35, "fdi": 4.0},
    "DZ": {"gdp_growth": 3.8, "inflation": 9.2, "trade_openness": 40.0, "export_diversification": 0.25, "fdi": 1.2},
    "TN": {"gdp_growth": 2.4, "inflation": 8.3, "trade_openness": 88.0, "export_diversification": 0.60, "fdi": 2.5},
    "AO": {"gdp_growth": 3.4, "inflation": 12.0, "trade_openness": 65.0, "export_diversification": 0.18, "fdi": 2.2},
    "CI": {"gdp_growth": 6.2, "inflation": 3.1, "trade_openness": 68.0, "export_diversification": 0.44, "fdi": 3.3},
    "ZM": {"gdp_growth": 4.0, "inflation": 10.5, "trade_openness": 72.0, "export_diversification": 0.30, "fdi": 2.7},
}

# Default baseline for countries not in the map above
DEFAULT_BASELINE = {
    "gdp_growth": 3.5,
    "inflation": 8.0,
    "trade_openness": 45.0,
    "export_diversification": 0.35,
    "fdi": 2.0,
}

# Institutional & social scores grounded in published indices
# (World Bank Governance, UNDP HDI — approximated, 0–100 scale)
INSTITUTIONAL_SCORES = {
    "RW": 62, "KE": 45, "TZ": 44, "UG": 38, "ET": 35,
    "NG": 28, "GH": 55, "SN": 57, "CM": 33, "ZA": 58,
    "EG": 36, "MA": 52, "BW": 68, "DZ": 34, "TN": 51,
    "AO": 27, "CI": 42, "ZM": 46, "CD": 18, "ZW": 25,
    "MZ": 32, "ML": 31, "BF": 29, "SD": 15, "SS": 10,
    "LY": 20, "CF": 12, "TD": 19, "BI": 22, "SO": 8,
    "GA": 38, "CG": 30, "NA": 60, "MW": 40, "NE": 26,
    "BJ": 48, "TG": 36, "GN": 28, "ER": 14, "DJ": 35,
}

SOCIAL_SCORES = {
    "RW": 58, "KE": 52, "TZ": 48, "UG": 44, "ET": 40,
    "NG": 38, "GH": 56, "SN": 53, "CM": 46, "ZA": 62,
    "EG": 55, "MA": 60, "BW": 65, "DZ": 57, "TN": 63,
    "AO": 42, "CI": 49, "ZM": 47, "CD": 28, "ZW": 40,
    "MZ": 35, "ML": 33, "BF": 34, "SD": 25, "SS": 18,
    "LY": 48, "CF": 20, "TD": 22, "BI": 30, "SO": 15,
    "GA": 52, "CG": 44, "NA": 61, "MW": 43, "NE": 28,
    "BJ": 50, "TG": 45, "GN": 32, "ER": 30, "DJ": 40,
}


def compute_resilience(code: str, data: dict) -> dict:
    """
    Composite resilience index from four weighted pillars.

    Weights:
      Economic      35% — GDP growth, FDI, inflation drag
      Trade         25% — openness, export diversification
      Institutional 25% — governance quality (fixed index)
      Social        15% — human development proxy (fixed index)
    """
    baseline = REGIONAL_BASELINES.get(code, DEFAULT_BASELINE)

    gdp_growth             = data.get("gdp_growth",             baseline["gdp_growth"])
    inflation              = data.get("inflation",              baseline["inflation"])
    trade_openness         = data.get("trade_openness",         baseline["trade_openness"])
    export_diversification = data.get("export_diversification", baseline["export_diversification"])
    fdi                    = data.get("fdi",                    baseline["fdi"])

    # --- Economic pillar (0–100) ---
    economic = (
        (min(gdp_growth, 12) / 12) * 40
        + (min(fdi, 10) / 10) * 25
        - (min(inflation, 30) / 30) * 25
        + 30
    )
    economic = round(min(100, max(0, economic)), 1)

    # --- Trade pillar (0–100) ---
    trade = (
        (min(trade_openness, 100) / 100) * 60
        + export_diversification * 40
    )
    trade = round(min(100, max(0, trade)), 1)

    # --- Institutional & Social pillars ---
    institutional = INSTITUTIONAL_SCORES.get(code, 35)
    social        = SOCIAL_SCORES.get(code, 40)

    # --- Composite ---
    composite = round(
        economic        * 0.35
        + trade         * 0.25
        + institutional * 0.25
        + social        * 0.15,
        1
    )

    return {
        "composite": composite,
        "pillars": {
            "economic":      economic,
            "trade":         trade,
            "institutional": institutional,
            "social":        social,
        },
    }


def classify_tier(score: float) -> str:
    """
    Tier thresholds calibrated to actual score distribution across
    Africa's 40 tracked economies (max observed: ~60).

      strong     ≥ 55  — top performers (Rwanda, Senegal, Morocco…)
      moderate   ≥ 42  — solid but exposed (Kenya, South Africa…)
      developing ≥ 28  — structural gaps (majority of economies)
      fragile    < 28  — severe vulnerability
    """
    if score >= 55:
        return "strong"
    elif score >= 42:
        return "moderate"
    elif score >= 28:
        return "developing"
    else:
        return "fragile"


@router.get("/index")
def resilience_index():
    """Resilience index for all tracked African economies."""
    results = []
    errors  = []

    for code, name in COUNTRIES.items():
        try:
            data = fetch_country_data(code)
            res  = compute_resilience(code, data)
            results.append({
                "country_code":    code,
                "country":         name,
                "composite_score": res["composite"],
                "tier":            classify_tier(res["composite"]),
                "pillars":         res["pillars"],
            })
        except Exception as e:
            logger.warning("Resilience calc failed for %s: %s", code, e)
            errors.append(code)

    results.sort(key=lambda x: x["composite_score"], reverse=True)

    return {
        "data":   results,
        "total":  len(results),
        "errors": errors if errors else None,
    }