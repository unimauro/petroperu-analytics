"""
analysis.py — Análisis exploratorio (Agente 5: Data Scientist).

Versión en script (no-notebook) para que corra en cualquier entorno/CI sin Jupyter.
Hace, solo con stdlib:
  - Tendencias (CAGR de ingresos, activo, deuda)
  - Correlación de Pearson entre pares de series (p.ej. ingresos vs WTI)
  - Detección de anomalías por z-score sobre la variación interanual

Para versión notebook: `jupyter nbconvert --to notebook --execute` o pegar estas
funciones en celdas. El pronóstico vive en analytics/forecasting.py.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FIN = ROOT / "frontend" / "public" / "data" / "financials.json"


def col(rows, key):
    return [(int(r["year"]), r[key]) for r in rows if isinstance(r.get(key), (int, float))]


def cagr(series):
    if len(series) < 2:
        return None
    first, last = series[0][1], series[-1][1]
    n = series[-1][0] - series[0][0]
    if first <= 0 or n <= 0:
        return None
    return (last / first) ** (1 / n) - 1


def pearson(xs, ys):
    pairs = {y: v for y, v in xs}
    common = [(pairs[y], v) for y, v in ys if y in pairs]
    if len(common) < 3:
        return None
    n = len(common)
    sx = sum(a for a, _ in common); sy = sum(b for _, b in common)
    sxx = sum(a * a for a, _ in common); syy = sum(b * b for _, b in common)
    sxy = sum(a * b for a, b in common)
    den = ((n * sxx - sx * sx) * (n * syy - sy * sy)) ** 0.5
    return (n * sxy - sx * sy) / den if den else None


def zscore_anomalies(series, threshold=1.8):
    deltas = [(series[i][0], series[i][1] - series[i - 1][1]) for i in range(1, len(series))]
    vals = [d for _, d in deltas]
    if len(vals) < 3:
        return []
    mu = sum(vals) / len(vals)
    sd = (sum((v - mu) ** 2 for v in vals) / len(vals)) ** 0.5 or 1.0
    return [(y, round((d - mu) / sd, 2)) for y, d in deltas if abs((d - mu) / sd) >= threshold]


def main():
    rows = json.loads(FIN.read_text(encoding="utf-8"))["rows"]
    rev, assets, debt = col(rows, "revenue"), col(rows, "total_assets"), col(rows, "total_debt")
    wti = [(y, v) for y, v in col(rows, "wti_usd_bbl")]

    print("== Tendencias (CAGR) ==")
    for name, s in [("Ingresos", rev), ("Activo total", assets), ("Deuda total", debt)]:
        c = cagr(s)
        print(f"  {name:14s}: {c*100:6.2f}%/año" if c is not None else f"  {name}: n/d")

    print("\n== Correlaciones (Pearson) ==")
    r_wti = pearson(rev, wti)
    print(f"  Ingresos ~ WTI: {r_wti:.2f}" if r_wti is not None else "  Ingresos ~ WTI: sin datos macro suficientes")
    print(f"  Activo ~ Deuda: {pearson(assets, debt):.2f}")

    print("\n== Anomalías (z-score de Δ a/a, |z|>=1.8) ==")
    for name, s in [("Ingresos", rev), ("Resultado neto", col(rows, "net_income")), ("Deuda total", debt)]:
        anos = zscore_anomalies(s)
        print(f"  {name}: " + (", ".join(f"{y}(z={z})" for y, z in anos) if anos else "sin anomalías"))


if __name__ == "__main__":
    main()
