"""
ingest.py — Real World Bank API data fetcher (fast bulk version).

Instead of 7 separate HTTP requests per country, we fetch all indicators
in ONE request per country using the WB bulk indicator endpoint.
50 countries × 1 request = ~50 requests in parallel → done in ~5–8s total.
"""

import logging
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger(__name__)

WB_BASE = "https://api.worldbank.org/v2"
TIMEOUT = 10
MRV     = 3   # fetch last 3 years, take first non-null

# All indicators in ONE semicolon-separated bulk request
BULK_INDICATORS = (
    "NY.GDP.MKTP.KD.ZG"      # gdp_growth
    ";FP.CPI.TOTL.ZG"        # inflation
    ";NE.TRD.GNFS.ZS"        # trade_openness
    ";BX.KLT.DINV.WD.GD.ZS"  # fdi
    ";TX.VAL.MANF.ZS.UN"     # manufactures_exports → export_diversification
    ";TM.VAL.MRCH.GD.ZS"     # import_dependency
    ";TT.PRI.MRCH.XD.WD"     # terms_of_trade → commodity_exposure
)

WB_FIELD_MAP = {
    "NY.GDP.MKTP.KD.ZG":     "gdp_growth",
    "FP.CPI.TOTL.ZG":        "inflation",
    "NE.TRD.GNFS.ZS":        "trade_openness",
    "BX.KLT.DINV.WD.GD.ZS": "fdi",
    "TX.VAL.MANF.ZS.UN":     "manufactures_exports",
    "TM.VAL.MRCH.GD.ZS":     "import_dependency",
    "TT.PRI.MRCH.XD.WD":     "terms_of_trade",
}

# ── Regional fallbacks (used only when API fails for a country) ──
FALLBACK = {
    "RW": {"gdp_growth": 7.5,  "inflation": 5.2,  "trade_openness": 52.0, "fdi": 3.2, "export_diversification": 0.45, "import_dependency": 68.0, "commodity_exposure": 0.30},
    "KE": {"gdp_growth": 5.5,  "inflation": 7.8,  "trade_openness": 48.0, "fdi": 2.8, "export_diversification": 0.52, "import_dependency": 58.0, "commodity_exposure": 0.35},
    "TZ": {"gdp_growth": 5.1,  "inflation": 4.5,  "trade_openness": 38.0, "fdi": 2.1, "export_diversification": 0.38, "import_dependency": 62.0, "commodity_exposure": 0.42},
    "UG": {"gdp_growth": 5.8,  "inflation": 6.2,  "trade_openness": 41.0, "fdi": 2.4, "export_diversification": 0.35, "import_dependency": 67.0, "commodity_exposure": 0.38},
    "ET": {"gdp_growth": 6.1,  "inflation": 22.0, "trade_openness": 28.0, "fdi": 3.5, "export_diversification": 0.28, "import_dependency": 72.0, "commodity_exposure": 0.55},
    "NG": {"gdp_growth": 3.1,  "inflation": 18.5, "trade_openness": 35.0, "fdi": 1.8, "export_diversification": 0.22, "import_dependency": 78.0, "commodity_exposure": 0.81},
    "GH": {"gdp_growth": 3.8,  "inflation": 23.0, "trade_openness": 58.0, "fdi": 2.6, "export_diversification": 0.41, "import_dependency": 65.0, "commodity_exposure": 0.63},
    "SN": {"gdp_growth": 4.9,  "inflation": 3.8,  "trade_openness": 55.0, "fdi": 3.0, "export_diversification": 0.48, "import_dependency": 60.0, "commodity_exposure": 0.44},
    "CM": {"gdp_growth": 3.9,  "inflation": 4.1,  "trade_openness": 42.0, "fdi": 1.9, "export_diversification": 0.39, "import_dependency": 64.0, "commodity_exposure": 0.59},
    "ZA": {"gdp_growth": 1.2,  "inflation": 5.5,  "trade_openness": 62.0, "fdi": 1.5, "export_diversification": 0.68, "import_dependency": 42.0, "commodity_exposure": 0.47},
    "EG": {"gdp_growth": 4.2,  "inflation": 14.0, "trade_openness": 45.0, "fdi": 2.9, "export_diversification": 0.55, "import_dependency": 55.0, "commodity_exposure": 0.38},
    "MA": {"gdp_growth": 3.5,  "inflation": 3.2,  "trade_openness": 72.0, "fdi": 3.8, "export_diversification": 0.62, "import_dependency": 52.0, "commodity_exposure": 0.31},
    "BW": {"gdp_growth": 4.5,  "inflation": 4.8,  "trade_openness": 80.0, "fdi": 4.0, "export_diversification": 0.35, "import_dependency": 60.0, "commodity_exposure": 0.72},
    "DZ": {"gdp_growth": 3.8,  "inflation": 9.2,  "trade_openness": 40.0, "fdi": 1.2, "export_diversification": 0.25, "import_dependency": 48.0, "commodity_exposure": 0.82},
    "TN": {"gdp_growth": 2.4,  "inflation": 8.3,  "trade_openness": 88.0, "fdi": 2.5, "export_diversification": 0.60, "import_dependency": 55.0, "commodity_exposure": 0.30},
    "AO": {"gdp_growth": 3.4,  "inflation": 12.0, "trade_openness": 65.0, "fdi": 2.2, "export_diversification": 0.18, "import_dependency": 70.0, "commodity_exposure": 0.88},
    "CI": {"gdp_growth": 6.2,  "inflation": 3.1,  "trade_openness": 68.0, "fdi": 3.3, "export_diversification": 0.44, "import_dependency": 55.0, "commodity_exposure": 0.58},
    "ZM": {"gdp_growth": 4.0,  "inflation": 10.5, "trade_openness": 72.0, "fdi": 2.7, "export_diversification": 0.30, "import_dependency": 62.0, "commodity_exposure": 0.75},
    "SD": {"gdp_growth": 0.5,  "inflation": 138.0,"trade_openness": 18.0, "fdi": 0.5, "export_diversification": 0.12, "import_dependency": 82.0, "commodity_exposure": 0.85},
    "SS": {"gdp_growth": -1.5, "inflation": 45.0, "trade_openness": 55.0, "fdi": 0.8, "export_diversification": 0.08, "import_dependency": 88.0, "commodity_exposure": 0.92},
    "CD": {"gdp_growth": 6.0,  "inflation": 14.0, "trade_openness": 62.0, "fdi": 2.0, "export_diversification": 0.15, "import_dependency": 75.0, "commodity_exposure": 0.78},
    "ZW": {"gdp_growth": 2.8,  "inflation": 98.0, "trade_openness": 58.0, "fdi": 0.6, "export_diversification": 0.28, "import_dependency": 68.0, "commodity_exposure": 0.65},
    "MZ": {"gdp_growth": 4.2,  "inflation": 7.5,  "trade_openness": 70.0, "fdi": 3.8, "export_diversification": 0.18, "import_dependency": 72.0, "commodity_exposure": 0.72},
    "ML": {"gdp_growth": 3.8,  "inflation": 3.9,  "trade_openness": 48.0, "fdi": 1.8, "export_diversification": 0.14, "import_dependency": 62.0, "commodity_exposure": 0.76},
    "BF": {"gdp_growth": 1.5,  "inflation": 4.2,  "trade_openness": 46.0, "fdi": 1.5, "export_diversification": 0.12, "import_dependency": 65.0, "commodity_exposure": 0.80},
    "NE": {"gdp_growth": 7.0,  "inflation": 3.5,  "trade_openness": 44.0, "fdi": 2.2, "export_diversification": 0.10, "import_dependency": 70.0, "commodity_exposure": 0.82},
    "TD": {"gdp_growth": 2.4,  "inflation": 5.8,  "trade_openness": 38.0, "fdi": 1.2, "export_diversification": 0.08, "import_dependency": 75.0, "commodity_exposure": 0.88},
    "MR": {"gdp_growth": 4.8,  "inflation": 4.2,  "trade_openness": 82.0, "fdi": 2.5, "export_diversification": 0.15, "import_dependency": 65.0, "commodity_exposure": 0.78},
    "MG": {"gdp_growth": 4.0,  "inflation": 8.2,  "trade_openness": 52.0, "fdi": 2.8, "export_diversification": 0.32, "import_dependency": 58.0, "commodity_exposure": 0.55},
    "MU": {"gdp_growth": 8.5,  "inflation": 4.8,  "trade_openness": 112.0,"fdi": 5.2, "export_diversification": 0.72, "import_dependency": 45.0, "commodity_exposure": 0.25},
    "NA": {"gdp_growth": 3.2,  "inflation": 5.2,  "trade_openness": 88.0, "fdi": 2.8, "export_diversification": 0.38, "import_dependency": 58.0, "commodity_exposure": 0.65},
    "MW": {"gdp_growth": 1.8,  "inflation": 24.0, "trade_openness": 52.0, "fdi": 1.2, "export_diversification": 0.22, "import_dependency": 68.0, "commodity_exposure": 0.70},
    "LY": {"gdp_growth": 2.5,  "inflation": 5.5,  "trade_openness": 55.0, "fdi": 1.0, "export_diversification": 0.10, "import_dependency": 55.0, "commodity_exposure": 0.90},
    "GA": {"gdp_growth": 2.8,  "inflation": 4.5,  "trade_openness": 72.0, "fdi": 2.5, "export_diversification": 0.22, "import_dependency": 52.0, "commodity_exposure": 0.82},
    "CG": {"gdp_growth": 1.5,  "inflation": 3.5,  "trade_openness": 98.0, "fdi": 3.5, "export_diversification": 0.12, "import_dependency": 55.0, "commodity_exposure": 0.85},
    "CF": {"gdp_growth": 1.0,  "inflation": 4.8,  "trade_openness": 28.0, "fdi": 0.8, "export_diversification": 0.10, "import_dependency": 72.0, "commodity_exposure": 0.80},
    "GN": {"gdp_growth": 5.5,  "inflation": 12.5, "trade_openness": 78.0, "fdi": 3.2, "export_diversification": 0.12, "import_dependency": 62.0, "commodity_exposure": 0.82},
    "BJ": {"gdp_growth": 5.8,  "inflation": 3.2,  "trade_openness": 52.0, "fdi": 1.8, "export_diversification": 0.28, "import_dependency": 55.0, "commodity_exposure": 0.60},
    "TG": {"gdp_growth": 5.5,  "inflation": 4.5,  "trade_openness": 98.0, "fdi": 2.2, "export_diversification": 0.35, "import_dependency": 62.0, "commodity_exposure": 0.55},
    "SO": {"gdp_growth": 2.8,  "inflation": 4.2,  "trade_openness": 82.0, "fdi": 0.5, "export_diversification": 0.08, "import_dependency": 85.0, "commodity_exposure": 0.72},
    "BI": {"gdp_growth": 1.8,  "inflation": 18.5, "trade_openness": 32.0, "fdi": 0.4, "export_diversification": 0.18, "import_dependency": 78.0, "commodity_exposure": 0.72},
    "DJ": {"gdp_growth": 6.5,  "inflation": 3.8,  "trade_openness": 122.0,"fdi": 3.5, "export_diversification": 0.22, "import_dependency": 75.0, "commodity_exposure": 0.45},
    "ER": {"gdp_growth": 2.5,  "inflation": 6.0,  "trade_openness": 35.0, "fdi": 0.3, "export_diversification": 0.15, "import_dependency": 80.0, "commodity_exposure": 0.68},
    "GW": {"gdp_growth": 4.5,  "inflation": 4.2,  "trade_openness": 48.0, "fdi": 1.2, "export_diversification": 0.10, "import_dependency": 68.0, "commodity_exposure": 0.82},
    "LR": {"gdp_growth": 4.8,  "inflation": 7.5,  "trade_openness": 98.0, "fdi": 4.5, "export_diversification": 0.18, "import_dependency": 75.0, "commodity_exposure": 0.78},
    "SL": {"gdp_growth": 3.5,  "inflation": 22.0, "trade_openness": 62.0, "fdi": 2.2, "export_diversification": 0.15, "import_dependency": 72.0, "commodity_exposure": 0.80},
    "LS": {"gdp_growth": 1.5,  "inflation": 7.8,  "trade_openness": 95.0, "fdi": 1.5, "export_diversification": 0.42, "import_dependency": 88.0, "commodity_exposure": 0.55},
    "SZ": {"gdp_growth": 2.8,  "inflation": 4.5,  "trade_openness": 148.0,"fdi": 1.8, "export_diversification": 0.55, "import_dependency": 85.0, "commodity_exposure": 0.40},
    "KM": {"gdp_growth": 3.2,  "inflation": 3.5,  "trade_openness": 58.0, "fdi": 2.5, "export_diversification": 0.22, "import_dependency": 72.0, "commodity_exposure": 0.55},
    "SC": {"gdp_growth": 8.5,  "inflation": 2.8,  "trade_openness": 185.0,"fdi": 8.5, "export_diversification": 0.45, "import_dependency": 88.0, "commodity_exposure": 0.35},
    "ST": {"gdp_growth": 2.5,  "inflation": 7.5,  "trade_openness": 95.0, "fdi": 3.5, "export_diversification": 0.28, "import_dependency": 82.0, "commodity_exposure": 0.45},
    "GQ": {"gdp_growth": -3.5, "inflation": 4.2,  "trade_openness": 88.0, "fdi": 1.5, "export_diversification": 0.08, "import_dependency": 62.0, "commodity_exposure": 0.92},
    "CV": {"gdp_growth": 5.5,  "inflation": 3.8,  "trade_openness": 118.0,"fdi": 5.2, "export_diversification": 0.38, "import_dependency": 78.0, "commodity_exposure": 0.35},
    "GM": {"gdp_growth": 6.5,  "inflation": 14.5, "trade_openness": 72.0, "fdi": 3.2, "export_diversification": 0.22, "import_dependency": 75.0, "commodity_exposure": 0.55},
}

DEFAULT_FALLBACK = {
    "gdp_growth": 3.5, "inflation": 8.0, "trade_openness": 45.0,
    "fdi": 2.0, "export_diversification": 0.35,
    "import_dependency": 60.0, "commodity_exposure": 0.50,
}

# ── In-memory cache ──
_cache: dict = {}


def _fetch_country_bulk(country_code: str) -> dict:
    """
    Single HTTP request to World Bank returning ALL indicators at once.
    Much faster than 7 separate requests per country.
    """
    url = (
        f"{WB_BASE}/country/{country_code}/indicator/{BULK_INDICATORS}"
        f"?format=json&mrv={MRV}&per_page=50"
    )
    r = requests.get(url, timeout=TIMEOUT)
    r.raise_for_status()
    body = r.json()

    if not isinstance(body, list) or len(body) < 2 or not body[1]:
        return {}

    # body[1] is a flat list of records for all indicators, newest first
    # Group by indicator, take first non-null value per indicator
    raw = {}
    for entry in body[1]:
        if not entry:
            continue
        ind_id = entry.get("indicator", {}).get("id")
        field  = WB_FIELD_MAP.get(ind_id)
        if field and field not in raw and entry.get("value") is not None:
            raw[field] = float(entry["value"])

    return raw


def _process_raw(raw: dict) -> dict:
    """Convert raw WB fields into our internal schema."""
    result = {}

    for field in ("gdp_growth", "inflation", "trade_openness", "fdi", "import_dependency"):
        if field in raw:
            result[field] = raw[field]

    # Manufactures share of exports (0–100 %) → diversification index (0–1)
    if "manufactures_exports" in raw:
        result["export_diversification"] = round(raw["manufactures_exports"] / 100, 3)

    # Terms of trade index → commodity exposure (0–1, higher = more exposed)
    if "terms_of_trade" in raw:
        tot = raw["terms_of_trade"]
        exposure = 1 - min(max((tot - 60) / 80, 0), 1)
        result["commodity_exposure"] = round(exposure, 3)

    return result


def fetch_country_data(country_code: str) -> dict:
    """
    Return real World Bank data for one country.
    Uses in-memory cache; falls back to regional baseline on API failure.
    """
    code = country_code.upper()
    if code in _cache:
        return _cache[code]

    fallback = FALLBACK.get(code, DEFAULT_FALLBACK).copy()

    try:
        raw    = _fetch_country_bulk(code)
        live   = _process_raw(raw)
        merged = {**fallback, **live}
        logger.info("WB data for %s: %d indicators live", code, len(live))
    except Exception as e:
        logger.warning("WB fetch failed for %s: %s — using fallback", code, e)
        merged = fallback

    _cache[code] = merged
    return merged


def fetch_all_countries(country_codes: list[str]) -> dict:
    """
    Fetch all countries in parallel — one bulk HTTP request per country.
    50 countries typically completes in 5–8 seconds total.
    """
    results = {}

    def _one(code):
        return code, fetch_country_data(code)

    with ThreadPoolExecutor(max_workers=30) as ex:
        futures = {ex.submit(_one, code): code for code in country_codes}
        for fut in as_completed(futures):
            try:
                code, data = fut.result()
                results[code] = data
            except Exception as e:
                code = futures[fut]
                logger.warning("fetch_all failed for %s: %s", code, e)
                results[code] = FALLBACK.get(code, DEFAULT_FALLBACK).copy()

    return results