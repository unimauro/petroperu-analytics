"""
forecasting.py — Tendencias y pronóstico (Agente 5: Data Scientist).

Pronostica una serie financiera (por defecto, ingresos) usando, por orden de
preferencia, los modelos disponibles en el entorno:

  1. Prophet   (si está instalado)
  2. XGBoost   (regresión con rezagos, si está instalado)
  3. Fallback  Regresión lineal por mínimos cuadrados (solo stdlib) — SIEMPRE disponible

Así el script corre en cualquier entorno (incluido el CI de Pages, donde no se
instalan dependencias científicas), y aprovecha Prophet/XGBoost si existen.

Uso:
  python analytics/forecasting.py --metric revenue --horizon 3
  python analytics/forecasting.py --metric total_debt --horizon 5 --out frontend/public/data/forecast.json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIN_JSON = ROOT / "frontend" / "public" / "data" / "financials.json"


def load_series(metric: str) -> tuple[list[int], list[float]]:
    data = json.loads(FIN_JSON.read_text(encoding="utf-8"))
    years, values = [], []
    for r in data["rows"]:
        v = r.get(metric)
        if isinstance(v, (int, float)):
            years.append(int(r["year"]))
            values.append(float(v))
    if not years:
        raise SystemExit(f"Métrica '{metric}' no encontrada o sin valores numéricos.")
    return years, values


# --- Fallback: regresión lineal OLS (sin dependencias) -----------------------

def _ols_forecast(years: list[int], values: list[float], horizon: int) -> dict:
    n = len(years)
    mx = sum(years) / n
    my = sum(values) / n
    sxx = sum((x - mx) ** 2 for x in years)
    sxy = sum((x - mx) * (y - my) for x, y in zip(years, values))
    slope = sxy / sxx if sxx else 0.0
    intercept = my - slope * mx
    future = list(range(years[-1] + 1, years[-1] + 1 + horizon))
    preds = [round(intercept + slope * x, 1) for x in future]
    # Banda simple a partir del error estándar residual
    resid = [y - (intercept + slope * x) for x, y in zip(years, values)]
    sigma = (sum(e * e for e in resid) / max(n - 2, 1)) ** 0.5
    return {
        "model": "ols_linear_fallback",
        "future_years": future,
        "forecast": preds,
        "lower": [round(p - 1.96 * sigma, 1) for p in preds],
        "upper": [round(p + 1.96 * sigma, 1) for p in preds],
    }


def _prophet_forecast(years, values, horizon):
    from prophet import Prophet  # type: ignore
    import pandas as pd  # type: ignore
    df = pd.DataFrame({"ds": pd.to_datetime([f"{y}-12-31" for y in years]), "y": values})
    m = Prophet(yearly_seasonality=False, weekly_seasonality=False, daily_seasonality=False)
    m.fit(df)
    fut = m.make_future_dataframe(periods=horizon, freq="YE")
    fc = m.predict(fut).tail(horizon)
    return {
        "model": "prophet",
        "future_years": [int(d.year) for d in fc["ds"]],
        "forecast": [round(v, 1) for v in fc["yhat"]],
        "lower": [round(v, 1) for v in fc["yhat_lower"]],
        "upper": [round(v, 1) for v in fc["yhat_upper"]],
    }


def _xgboost_forecast(years, values, horizon, lags=2):
    import numpy as np  # type: ignore
    from xgboost import XGBRegressor  # type: ignore
    X, y = [], []
    for i in range(lags, len(values)):
        X.append(values[i - lags:i])
        y.append(values[i])
    model = XGBRegressor(n_estimators=200, max_depth=3, learning_rate=0.1)
    model.fit(np.array(X), np.array(y))
    window = list(values[-lags:])
    preds = []
    for _ in range(horizon):
        p = float(model.predict(np.array([window]))[0])
        preds.append(round(p, 1))
        window = window[1:] + [p]
    future = list(range(years[-1] + 1, years[-1] + 1 + horizon))
    return {"model": "xgboost", "future_years": future, "forecast": preds, "lower": preds, "upper": preds}


def forecast(metric: str, horizon: int) -> dict:
    years, values = load_series(metric)
    for fn, name in [(_prophet_forecast, "prophet"), (_xgboost_forecast, "xgboost")]:
        try:
            out = fn(years, values, horizon)
            out["metric"] = metric
            out["history"] = {"years": years, "values": values}
            return out
        except Exception:
            continue  # librería ausente o error -> probar el siguiente
    out = _ols_forecast(years, values, horizon)
    out["metric"] = metric
    out["history"] = {"years": years, "values": values}
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Pronóstico de series financieras de Petroperú")
    ap.add_argument("--metric", default="revenue")
    ap.add_argument("--horizon", type=int, default=3)
    ap.add_argument("--out", default=None, help="Ruta JSON de salida (opcional)")
    args = ap.parse_args()

    result = forecast(args.metric, args.horizon)
    print(f"Modelo usado: {result['model']}  ·  métrica: {result['metric']}")
    for y, f in zip(result["future_years"], result["forecast"]):
        print(f"  {y}: {f}")
    if args.out:
        Path(args.out).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"→ {args.out}")
