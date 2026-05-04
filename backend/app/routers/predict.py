from fastapi import APIRouter
from app.models.risk_model import compute_risk_scores
from app.data.ingest import fetch_country_data, fetch_all_countries

router = APIRouter()

COUNTRIES = {
    "DZ": "Algeria",
    "AO": "Angola",
    "BJ": "Benin",
    "BW": "Botswana",
    "BF": "Burkina Faso",
    "BI": "Burundi",
    "CV": "Cabo Verde",
    "CM": "Cameroon",
    "CF": "Central African Republic",
    "TD": "Chad",
    "KM": "Comoros",
    "CD": "Congo (Democratic Republic)",
    "CG": "Congo (Republic)",
    "CI": "Côte d’Ivoire",
    "DJ": "Djibouti",
    "EG": "Egypt",
    "GQ": "Equatorial Guinea",
    "ER": "Eritrea",
    "SZ": "Eswatini",
    "ET": "Ethiopia",
    "GA": "Gabon",
    "GM": "Gambia",
    "GH": "Ghana",
    "GN": "Guinea",
    "GW": "Guinea-Bissau",
    "KE": "Kenya",
    "LS": "Lesotho",
    "LR": "Liberia",
    "LY": "Libya",
    "MG": "Madagascar",
    "MW": "Malawi",
    "ML": "Mali",
    "MR": "Mauritania",
    "MU": "Mauritius",
    "MA": "Morocco",
    "MZ": "Mozambique",
    "NA": "Namibia",
    "NE": "Niger",
    "NG": "Nigeria",
    "RW": "Rwanda",
    "ST": "São Tomé and Príncipe",
    "SN": "Senegal",
    "SC": "Seychelles",
    "SL": "Sierra Leone",
    "SO": "Somalia",
    "ZA": "South Africa",
    "SS": "South Sudan",
    "SD": "Sudan",
    "TZ": "Tanzania",
    "TG": "Togo",
    "TN": "Tunisia",
    "UG": "Uganda",
    "ZM": "Zambia",
    "ZW": "Zimbabwe",
}



@router.get("/supply-chain")
def predict_supply_chain():
    """
    Returns supply chain risk scores for all tracked African countries.
    Uses parallel World Bank enrichment — responds in ~2s instead of ~60s.
    """
    # ── Fetch all country data IN PARALLEL ──
    all_data = fetch_all_countries(list(COUNTRIES.keys()))

    results = []
    for code, name in COUNTRIES.items():
        data = all_data.get(code, {})
        score, factors = compute_risk_scores(data)
        results.append({
            "country_code": code,
            "country": name,
            "risk_score": round(score, 1),
            "risk_level": "high" if score >= 65 else "medium" if score >= 40 else "low",
            "factors": factors,
        })

    results.sort(key=lambda x: x["risk_score"], reverse=True)
    return {"data": results, "total": len(results)}


@router.get("/supply-chain/{country_code}")
def predict_single_country(country_code: str):
    """
    Detailed risk breakdown for a single country.
    Returns instantly if already cached from the list call.
    """
    code = country_code.upper()
    if code not in COUNTRIES:
        return {"error": f"Country code {code} not supported"}

    data = fetch_country_data(code)   # instant if cached
    score, factors = compute_risk_scores(data)
    return {
        "country_code": code,
        "country": COUNTRIES[code],
        "risk_score": round(score, 1),
        "risk_level": "high" if score >= 65 else "medium" if score >= 40 else "low",
        "factors": factors,
        "raw_data": data,
    }