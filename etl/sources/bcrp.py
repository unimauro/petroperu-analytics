"""
bcrp.py — Cliente mínimo de la API de estadísticas del BCRP.

API pública (sin token):
  https://estadisticas.bcrp.gob.pe/estadisticas/series/api/{series}/json/{ini}/{fin}/{idioma}

Series usadas (mensuales -> se agregan a promedio anual):
  PN01207PM  Tipo de cambio promedio bancario - venta (S/ por US$)
  PN01764XM  Precio internacional del petróleo WTI (US$/barril)  [aprox]

El módulo está pensado para fallar con elegancia: si no hay red, devuelve
{"status": "offline", ...} y el ETL continúa con el resto del pipeline.
"""

from __future__ import annotations

import json
import urllib.request
from collections import defaultdict

BASE = "https://estadisticas.bcrp.gob.pe/estadisticas/series/api"

SERIES = {
    "fx_sol_usd": "PN01207PM",   # TC promedio venta
    "wti_usd_bbl": "PN01764XM",  # Petróleo WTI (referencial)
}


def _fetch_series(code: str, ini: int, fin: int, timeout: int = 15) -> dict:
    url = f"{BASE}/{code}/json/{ini}/{fin}/esp"
    req = urllib.request.Request(url, headers={"User-Agent": "petroperu-analytics-etl/0.1"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _annual_average(payload: dict) -> dict[int, float]:
    """Agrega los periodos mensuales del BCRP a promedio anual {year: value}."""
    buckets: dict[int, list[float]] = defaultdict(list)
    for period in payload.get("periods", []):
        name = period.get("name", "")            # p.ej. "Ene.2020"
        values = period.get("values", [])
        if not values:
            continue
        try:
            value = float(values[0])
        except (TypeError, ValueError):
            continue
        year = None
        if "." in name:
            try:
                year = int(name.split(".")[-1])
            except ValueError:
                year = None
        if year is None:
            continue
        buckets[year].append(value)
    return {y: round(sum(v) / len(v), 4) for y, v in buckets.items() if v}


def fetch_macro(ini: int = 2005, fin: int = 2024) -> dict:
    """
    Devuelve {"status": ..., "series": {indicador: {year: value}}}.
    `status`: 'verified-live' si descargó algo, 'offline' si falló la red.
    """
    out: dict = {"status": "verified-live", "source": "BCRP", "series": {}}
    any_ok = False
    for key, code in SERIES.items():
        try:
            payload = _fetch_series(code, ini, fin)
            out["series"][key] = _annual_average(payload)
            any_ok = True
        except Exception as exc:  # red caída, timeout, cambio de esquema...
            out["series"][key] = {}
            out.setdefault("errors", {})[key] = str(exc)
    if not any_ok:
        out["status"] = "offline"
    return out


if __name__ == "__main__":
    from pprint import pprint
    pprint(fetch_macro(2020, 2024))
