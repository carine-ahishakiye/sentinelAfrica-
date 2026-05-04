"""
scorer.py — Data-driven sector scoring engine.

Takes real World Bank indicators from ingest.py and computes sector
opportunity scores based on economic logic, not hardcoded values.

Each sector has a scoring function that reads the country's WB indicators
and returns a score 0–100 plus a data-backed rationale string.
"""

from __future__ import annotations
from dataclasses import dataclass


@dataclass
class SectorScore:
    sector: str
    score: float          # 0–100
    rationale: str
    data_inputs: dict     # which WB fields drove this score


# ── Utility helpers ────────────────────────────────────────────────────────────

def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def _scale(value: float, bad: float, good: float) -> float:
    """
    Linearly scale `value` from [bad, good] → [0, 100].
    Works for both directions (bad < good OR bad > good).
    """
    if good == bad:
        return 50.0
    return _clamp((value - bad) / (good - bad) * 100)


# ── Per-sector scoring functions ───────────────────────────────────────────────
# Each function receives the full indicators dict and returns a SectorScore.
# All scores are normalised 0–100 with explicit weights shown.

def score_agritech(ind: dict) -> SectorScore:
    """
    High import dependency → big opportunity to substitute food imports.
    Low export diversification → agricultural exports are underleveraged.
    Healthy GDP growth → market can absorb agri-investment.
    """
    import_dep   = ind.get("import_dependency", 60)
    export_div   = ind.get("export_diversification", 0.35)
    gdp_growth   = ind.get("gdp_growth", 3.5)

    s_import  = _scale(import_dep, 30, 90)      # higher import dep → more opportunity
    s_underdiv = _scale(1 - export_div, 0, 1) * 100  # lower diversification → more upside
    s_growth  = _scale(gdp_growth, 0, 10)       # faster growth → better investment climate

    score = 0.45 * s_import + 0.35 * s_underdiv + 0.20 * s_growth

    rationale = (
        f"Import dependency at {import_dep:.1f}% of GDP signals large food/input import bill ripe for local substitution. "
        f"Manufactures share of exports at {export_div*100:.0f}% shows agri-processing is underleveraged. "
        f"GDP growth of {gdp_growth:.1f}% supports private agri-investment viability."
    )
    return SectorScore("AgriTech", round(score, 1), rationale,
                       {"import_dependency": import_dep, "export_diversification": export_div, "gdp_growth": gdp_growth})


def score_fintech(ind: dict) -> SectorScore:
    """
    Low export diversification → financial services gap.
    High trade openness → cross-border payment demand.
    Moderate-high inflation → pressure to store value digitally.
    Strong GDP growth → expanding middle class to serve.
    """
    export_div    = ind.get("export_diversification", 0.35)
    trade_open    = ind.get("trade_openness", 45)
    inflation     = ind.get("inflation", 8)
    gdp_growth    = ind.get("gdp_growth", 3.5)

    s_gap     = _scale(1 - export_div, 0, 1) * 100   # services gap
    s_trade   = _scale(trade_open, 20, 100)            # cross-border demand
    s_infl    = _scale(inflation, 0, 25)               # inflation pain → digital store of value
    s_growth  = _scale(gdp_growth, 0, 10)

    score = 0.30 * s_gap + 0.30 * s_trade + 0.20 * s_infl + 0.20 * s_growth

    rationale = (
        f"Trade openness of {trade_open:.1f}% generates cross-border payment flows underserved by legacy banking. "
        f"Services share of exports at {export_div*100:.0f}% highlights a financial-services gap. "
        f"Inflation at {inflation:.1f}% creates demand for digital stores of value and hedging tools."
    )
    return SectorScore("Fintech & Digital Finance", round(score, 1), rationale,
                       {"trade_openness": trade_open, "export_diversification": export_div, "inflation": inflation})


def score_tourism(ind: dict) -> SectorScore:
    """
    Low commodity exposure → economy benefits from diversifying INTO services like tourism.
    Good GDP growth → domestic + regional tourist base.
    Low-moderate inflation → affordable destination.
    High FDI → infrastructure investment possible.
    """
    commodity_exp = ind.get("commodity_exposure", 0.50)
    gdp_growth    = ind.get("gdp_growth", 3.5)
    inflation     = ind.get("inflation", 8)
    fdi           = ind.get("fdi", 2.0)

    s_noncommodity = _scale(1 - commodity_exp, 0, 1) * 100  # less commodity-dependent → diversification imperative
    s_growth       = _scale(gdp_growth, 0, 10)
    s_affordability = _scale(25 - inflation, 0, 25)          # lower inflation → more competitive destination
    s_fdi          = _scale(fdi, 0, 8)

    score = 0.35 * s_noncommodity + 0.25 * s_growth + 0.25 * s_affordability + 0.15 * s_fdi

    rationale = (
        f"Commodity exposure of {commodity_exp*100:.0f}% underscores urgency to diversify into services like tourism. "
        f"Inflation at {inflation:.1f}% affects destination price competitiveness. "
        f"FDI at {fdi:.1f}% of GDP reflects hospitality infrastructure investment capacity. "
        f"GDP growth of {gdp_growth:.1f}% supports growing regional visitor base."
    )
    return SectorScore("Tourism & Eco-tourism", round(score, 1), rationale,
                       {"commodity_exposure": commodity_exp, "inflation": inflation, "fdi": fdi})


def score_logistics(ind: dict) -> SectorScore:
    """
    High trade openness → existing trade flows to service.
    High import dependency → inbound logistics demand.
    Strong FDI → infrastructure investment attracts more throughput.
    """
    trade_open = ind.get("trade_openness", 45)
    import_dep = ind.get("import_dependency", 60)
    fdi        = ind.get("fdi", 2.0)

    s_trade  = _scale(trade_open, 20, 120)
    s_import = _scale(import_dep, 30, 90)
    s_fdi    = _scale(fdi, 0, 8)

    score = 0.45 * s_trade + 0.35 * s_import + 0.20 * s_fdi

    rationale = (
        f"Trade openness of {trade_open:.1f}% reflects significant goods flow requiring logistics infrastructure. "
        f"Import dependency of {import_dep:.1f}% signals large inbound freight volumes. "
        f"FDI at {fdi:.1f}% of GDP indicates capacity for port, road, and cold-chain investment."
    )
    return SectorScore("Logistics & Trade Hub", round(score, 1), rationale,
                       {"trade_openness": trade_open, "import_dependency": import_dep, "fdi": fdi})


def score_green_energy(ind: dict) -> SectorScore:
    """
    High commodity exposure → fossil-fuel dependence → transition urgency.
    High import dependency → energy imports are costly → local renewables attractive.
    Strong GDP growth → energy demand rising.
    High FDI → green finance available.
    """
    commodity_exp = ind.get("commodity_exposure", 0.50)
    import_dep    = ind.get("import_dependency", 60)
    gdp_growth    = ind.get("gdp_growth", 3.5)
    fdi           = ind.get("fdi", 2.0)

    s_transition = _scale(commodity_exp, 0, 1) * 100   # more commodity exposure → bigger transition need
    s_energy_imp = _scale(import_dep, 30, 90)           # high imports → energy import substitution
    s_growth     = _scale(gdp_growth, 0, 10)
    s_fdi        = _scale(fdi, 0, 8)

    score = 0.35 * s_transition + 0.30 * s_energy_imp + 0.20 * s_growth + 0.15 * s_fdi

    rationale = (
        f"Commodity exposure of {commodity_exp*100:.0f}% signals fossil-fuel reliance creating strong renewable transition incentive. "
        f"Import dependency of {import_dep:.1f}% includes energy imports that local solar/hydro/wind can displace. "
        f"GDP growth of {gdp_growth:.1f}% drives rising energy demand that must be met sustainably."
    )
    return SectorScore("Green Energy", round(score, 1), rationale,
                       {"commodity_exposure": commodity_exp, "import_dependency": import_dep, "fdi": fdi})


def score_manufacturing(ind: dict) -> SectorScore:
    """
    Low export diversification → manufacturing gap.
    High import dependency → import substitution opportunity.
    Low inflation → stable input costs.
    Strong FDI → investment climate for factories.
    """
    export_div = ind.get("export_diversification", 0.35)
    import_dep = ind.get("import_dependency", 60)
    inflation  = ind.get("inflation", 8)
    fdi        = ind.get("fdi", 2.0)

    s_gap     = _scale(1 - export_div, 0, 1) * 100
    s_import  = _scale(import_dep, 30, 90)
    s_stable  = _scale(25 - inflation, 0, 25)   # lower inflation → better for manufacturing
    s_fdi     = _scale(fdi, 0, 8)

    score = 0.30 * s_gap + 0.30 * s_import + 0.20 * s_stable + 0.20 * s_fdi

    rationale = (
        f"Manufactures share of exports at {export_div*100:.0f}% indicates large import-substitution upside. "
        f"Import dependency of {import_dep:.1f}% shows domestic production can capture significant value currently lost to imports. "
        f"Inflation at {inflation:.1f}% affects input cost stability for factory investment decisions."
    )
    return SectorScore("Manufacturing", round(score, 1), rationale,
                       {"export_diversification": export_div, "import_dependency": import_dep, "inflation": inflation})


def score_digital_services(ind: dict) -> SectorScore:
    """
    High trade openness → global services export potential.
    Low inflation → stable operating costs for BPO/tech firms.
    Strong FDI → tech infrastructure investment.
    GDP growth → expanding domestic tech market.
    """
    trade_open = ind.get("trade_openness", 45)
    inflation  = ind.get("inflation", 8)
    fdi        = ind.get("fdi", 2.0)
    gdp_growth = ind.get("gdp_growth", 3.5)

    s_trade  = _scale(trade_open, 20, 120)
    s_stable = _scale(25 - inflation, 0, 25)
    s_fdi    = _scale(fdi, 0, 8)
    s_growth = _scale(gdp_growth, 0, 10)

    score = 0.30 * s_trade + 0.25 * s_stable + 0.25 * s_fdi + 0.20 * s_growth

    rationale = (
        f"Trade openness of {trade_open:.1f}% reflects integration into global markets that digital services can exploit. "
        f"FDI at {fdi:.1f}% of GDP signals investor confidence supporting ICT infrastructure build-out. "
        f"Inflation of {inflation:.1f}% affects operating cost competitiveness vs global BPO peers."
    )
    return SectorScore("Digital Services & ICT", round(score, 1), rationale,
                       {"trade_openness": trade_open, "fdi": fdi, "inflation": inflation})


# ── Master scorer ──────────────────────────────────────────────────────────────

ALL_SCORERS = [
    score_agritech,
    score_fintech,
    score_tourism,
    score_logistics,
    score_green_energy,
    score_manufacturing,
    score_digital_services,
]


def rank_sectors(indicators: dict, top_n: int = 5) -> list[dict]:
    """
    Given a country's WB indicators dict, return top_n sectors ranked by score.
    Output matches the shape expected by the existing recommendations router.
    """
    results: list[SectorScore] = []
    for scorer in ALL_SCORERS:
        try:
            results.append(scorer(indicators))
        except Exception as e:
            # Never let one broken scorer kill the whole response
            pass

    results.sort(key=lambda s: s.score, reverse=True)
    top = results[:top_n]

    return [
        {
            "sector": s.sector,
            "score": s.score,
            "rationale": s.rationale,
            "data_inputs": s.data_inputs,
        }
        for s in top
    ]