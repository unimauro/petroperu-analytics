"""
etl_pipeline.py — Pipeline ETL de Petroperú Analytics (Agente 2: Data Engineer).

Flujo:
  1. EXTRACT   Lee el CSV semilla de partidas financieras y el de gobierno corporativo.
               Intenta enriquecer con macro real del BCRP (TC, WTI) — opcional.
  2. TRANSFORM Tipa y valida partidas, verifica que el balance cuadre,
               calcula indicadores con analytics/indicators_engine.py,
               construye nodos/relaciones del grafo de gobierno.
  3. LOAD      Escribe JSON estático en frontend/public/data/ para que el SPA
               (GitHub Pages) lo consuma sin backend.

Uso:
  python etl/etl_pipeline.py            # con ingesta BCRP si hay red
  python etl/etl_pipeline.py --offline  # sin red (solo seed)

Salidas:
  frontend/public/data/financials.json
  frontend/public/data/governance.json
  frontend/public/data/graph.json
  frontend/public/data/meta.json
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "analytics"))
sys.path.insert(0, str(ROOT / "etl"))

from indicators_engine import compute_all  # noqa: E402

SEED_FIN = ROOT / "data" / "seed" / "petroperu_financials_seed.csv"
SEED_GOV = ROOT / "data" / "seed" / "governance_seed.csv"
OUT_DIR = ROOT / "frontend" / "public" / "data"

# Partidas que deben convertirse a número.
NUMERIC_FIELDS = [
    "revenue", "cogs", "opex", "depreciation_amortization", "interest_expense",
    "income_tax", "net_income", "cash", "accounts_receivable", "inventory",
    "current_assets", "total_assets", "current_liabilities", "short_term_debt",
    "long_term_debt", "total_liabilities", "equity",
]

BALANCE_TOLERANCE = 0.01  # 1% de holgura al verificar Activo = Pasivo + Patrimonio


# --- EXTRACT -----------------------------------------------------------------

def read_csv(path: Path) -> list[dict]:
    with path.open(newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


# --- TRANSFORM ---------------------------------------------------------------

def coerce_numeric(rows: list[dict]) -> list[dict]:
    out = []
    for r in rows:
        row = dict(r)
        row["year"] = int(row["year"])
        for f in NUMERIC_FIELDS:
            row[f] = float(row[f]) if row.get(f) not in (None, "") else 0.0
        out.append(row)
    return out


def validate_balance(rows: list[dict]) -> list[dict]:
    """Marca cada ejercicio con balance_ok según Activo ≈ Pasivo + Patrimonio."""
    for r in rows:
        assets = r["total_assets"]
        liab_eq = r["total_liabilities"] + r["equity"]
        diff = abs(assets - liab_eq)
        r["balance_ok"] = diff <= BALANCE_TOLERANCE * max(assets, 1)
        r["balance_diff"] = round(assets - liab_eq, 2)
    return rows


def attach_macro(rows: list[dict], macro: dict) -> list[dict]:
    fx = macro.get("series", {}).get("fx_sol_usd", {})
    wti = macro.get("series", {}).get("wti_usd_bbl", {})
    for r in rows:
        y = r["year"]
        r["fx_sol_usd"] = fx.get(y) or fx.get(str(y))
        r["wti_usd_bbl"] = wti.get(y) or wti.get(str(y))
    return rows


def build_graph(gov_rows: list[dict]) -> dict:
    """
    Construye nodos y relaciones para el modelo de grafo (Agente 6).
    Tipos de nodo derivan de entity_type; las relaciones se infieren de los cargos.
    """
    nodes: dict[str, dict] = {}
    edges: list[dict] = []

    def add_node(name: str, label: str, props: dict | None = None):
        if not name:
            return
        if name not in nodes:
            nodes[name] = {"id": name, "label": label, "props": props or {}}

    label_map = {
        "PRESIDENT_PERU": "PresidentePeru",
        "MINISTER": "Ministro",
        "BOARD_CHAIR": "Directorio",
        "GENERAL_MANAGER": "Gerente",
        "COMPANY": "Empresa",
    }

    for r in gov_rows:
        etype = r["entity_type"]
        label = label_map.get(etype, "Persona")
        add_node(r["person"], label, {
            "role": r.get("role"),
            "organization": r.get("organization"),
            "start_date": r.get("start_date"),
            "end_date": r.get("end_date") or None,
            "data_status": r.get("data_status"),
        })
        appointer = r.get("appointed_by")
        if appointer:
            add_node(appointer, "Persona")
            edges.append({"source": appointer, "target": r["person"], "type": "APPOINTED"})
        # Cargos dentro de Petroperú reportan a la empresa
        if etype in ("BOARD_CHAIR", "GENERAL_MANAGER"):
            add_node("Petroperú", "Empresa")
            edges.append({"source": r["person"], "target": "Petroperú", "type": "MANAGED"})
        if etype == "GENERAL_MANAGER":
            edges.append({"source": r["person"], "target": "Petroperú", "type": "REPORTED_TO"})

    # Relaciones REPLACED por sucesión temporal dentro del mismo rol/organización
    by_role: dict[tuple, list[dict]] = {}
    for r in gov_rows:
        by_role.setdefault((r["entity_type"], r.get("organization")), []).append(r)
    for group in by_role.values():
        ordered = sorted([g for g in group if g.get("start_date")], key=lambda g: g["start_date"])
        for prev, nxt in zip(ordered, ordered[1:]):
            edges.append({"source": nxt["person"], "target": prev["person"], "type": "REPLACED"})

    return {"nodes": list(nodes.values()), "edges": edges}


# --- LOAD --------------------------------------------------------------------

def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  → {path.relative_to(ROOT)}")


def run(offline: bool = False) -> None:
    print("EXTRACT")
    fin_raw = read_csv(SEED_FIN)
    gov_rows = read_csv(SEED_GOV)

    macro = {"status": "skipped", "series": {}}
    if not offline:
        try:
            from sources.bcrp import fetch_macro
            years = [int(r["year"]) for r in fin_raw]
            macro = fetch_macro(min(years), max(years))
            print(f"  BCRP: {macro['status']}")
        except Exception as exc:
            print(f"  BCRP: error ({exc}) — continúo sin macro")
            macro = {"status": "offline", "series": {}}

    print("TRANSFORM")
    rows = coerce_numeric(fin_raw)
    rows = validate_balance(rows)
    rows = attach_macro(rows, macro)
    rows = compute_all(rows)
    bad = [r["year"] for r in rows if not r["balance_ok"]]
    print(f"  ejercicios: {len(rows)} | balance_ok: {len(rows) - len(bad)}/{len(rows)}"
          + (f" | revisar: {bad}" if bad else ""))

    graph = build_graph(gov_rows)
    print(f"  grafo: {len(graph['nodes'])} nodos, {len(graph['edges'])} relaciones")

    data_status = sorted({r.get("data_status", "unknown") for r in fin_raw})

    print("LOAD")
    write_json(OUT_DIR / "financials.json", {
        "entity": "Petroperú S.A.",
        "currency": "USD",
        "unit": "thousands",
        "data_status": data_status,
        "rows": rows,
    })
    write_json(OUT_DIR / "governance.json", {"rows": gov_rows})
    write_json(OUT_DIR / "graph.json", graph)
    write_json(OUT_DIR / "meta.json", {
        "generated_by": "etl_pipeline.py",
        "macro_status": macro.get("status"),
        "years": [min(r["year"] for r in rows), max(r["year"] for r in rows)],
        "n_indicators": 16,
        "disclaimer": "Cifras financieras marcadas 'illustrative' son de demostración. "
                      "Ver data/PROVENANCE.md.",
    })
    print("OK")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ETL Petroperú Analytics")
    parser.add_argument("--offline", action="store_true", help="No consultar la API del BCRP")
    args = parser.parse_args()
    run(offline=args.offline)
