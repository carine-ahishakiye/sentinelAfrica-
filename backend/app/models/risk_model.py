def compute_risk_scores(data: dict) -> tuple[float, dict]:
    """
    Computes a supply chain risk score (0–100) from economic indicators.
    Higher score = more vulnerable to external shocks.

    In production: replace with trained XGBoost/LSTM model loaded from disk.
    """

    # Extract indicators with safe defaults
    inflation = data.get("inflation", 5.0)
    import_dependency = data.get("import_dependency", 60.0)
    commodity_exposure = data.get("commodity_exposure", 0.5)
    export_diversification = data.get("export_diversification", 0.5)
    gdp_growth = data.get("gdp_growth", 3.0)
    fdi = data.get("fdi", 2.0)
    trade_openness = data.get("trade_openness", 50.0)

    # Individual factor scores (all normalized to 0–100, higher = more risk)
    inflation_risk = min(100, (inflation / 40) * 100)
    import_risk = min(100, import_dependency)
    commodity_risk = min(100, commodity_exposure * 100)
    diversification_risk = min(100, (1 - export_diversification) * 100)
    growth_risk = min(100, max(0, (8 - gdp_growth) / 8 * 100))
    fdi_risk = min(100, max(0, (5 - fdi) / 5 * 100))

    # Weighted composite (weights sum to 1.0)
    weights = {
        "inflation": 0.20,
        "import_dependency": 0.25,
        "commodity_exposure": 0.20,
        "export_diversification": 0.15,
        "gdp_growth": 0.12,
        "fdi": 0.08,
    }

    composite = (
        inflation_risk * weights["inflation"] +
        import_risk * weights["import_dependency"] +
        commodity_risk * weights["commodity_exposure"] +
        diversification_risk * weights["export_diversification"] +
        growth_risk * weights["gdp_growth"] +
        fdi_risk * weights["fdi"]
    )

    factors = {
        "inflation": {"score": round(inflation_risk, 1), "value": inflation, "unit": "%", "weight": weights["inflation"]},
        "import_dependency": {"score": round(import_risk, 1), "value": import_dependency, "unit": "% of GDP", "weight": weights["import_dependency"]},
        "commodity_exposure": {"score": round(commodity_risk, 1), "value": round(commodity_exposure * 100, 1), "unit": "% of exports", "weight": weights["commodity_exposure"]},
        "export_diversification": {"score": round(diversification_risk, 1), "value": round(export_diversification, 2), "unit": "index", "weight": weights["export_diversification"]},
        "gdp_growth": {"score": round(growth_risk, 1), "value": gdp_growth, "unit": "%", "weight": weights["gdp_growth"]},
        "fdi": {"score": round(fdi_risk, 1), "value": fdi, "unit": "% of GDP", "weight": weights["fdi"]},
    }

    return min(100, max(0, composite)), factors