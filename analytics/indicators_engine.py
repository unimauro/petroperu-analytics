"""
indicators_engine.py — Motor de indicadores financieros (Agente 3: Financial Analyst).

Funciones puras que calculan, a partir de las partidas crudas de un ejercicio
(estado de resultados + balance), los indicadores definidos en docs/formulas.md.

Diseño:
- Sin dependencias externas (solo stdlib) para que corra en cualquier CI.
- Cada función recibe un dict `row` con las partidas crudas y devuelve un float o None.
- `compute_all(rows)` enriquece una lista de ejercicios con todos los indicadores.

Convención de partidas crudas (ver data/seed/petroperu_financials_seed.csv):
  revenue, cogs, opex, depreciation_amortization, interest_expense, income_tax,
  net_income, cash, accounts_receivable, inventory, current_assets, total_assets,
  current_liabilities, short_term_debt, long_term_debt, total_liabilities, equity
"""

from __future__ import annotations

from typing import Optional


Number = Optional[float]


def _safe_div(numerator: Number, denominator: Number) -> Number:
    """División protegida: devuelve None si el denominador es 0 o falta un dato."""
    if numerator is None or denominator is None:
        return None
    if denominator == 0:
        return None
    return numerator / denominator


# --- Magnitudes derivadas del estado de resultados ---------------------------

def gross_profit(row: dict) -> Number:
    """Utilidad bruta = Ingresos - Costo de ventas."""
    return row["revenue"] - row["cogs"]


def ebit(row: dict) -> Number:
    """
    EBIT (utilidad operativa) = Ingresos - COGS - OPEX - D&A.
    Aquí OPEX se entiende SIN depreciación/amortización (se resta aparte).
    """
    return row["revenue"] - row["cogs"] - row["opex"] - row["depreciation_amortization"]


def ebitda(row: dict) -> Number:
    """EBITDA = EBIT + Depreciación y amortización."""
    e = ebit(row)
    return None if e is None else e + row["depreciation_amortization"]


def total_debt(row: dict) -> Number:
    """Deuda financiera total = deuda de corto plazo + deuda de largo plazo."""
    return row["short_term_debt"] + row["long_term_debt"]


def working_capital(row: dict) -> Number:
    """Capital de trabajo = Activo corriente - Pasivo corriente."""
    return row["current_assets"] - row["current_liabilities"]


# --- Rentabilidad ------------------------------------------------------------

def roa(row: dict) -> Number:
    """ROA = Utilidad neta / Activo total."""
    return _safe_div(row["net_income"], row["total_assets"])


def roe(row: dict) -> Number:
    """
    ROE = Utilidad neta / Patrimonio.
    Nota: con patrimonio negativo el ratio pierde sentido económico;
    se devuelve igualmente para señalar la situación (ver flag en compute_all).
    """
    return _safe_div(row["net_income"], row["equity"])


def ebitda_margin(row: dict) -> Number:
    """Margen EBITDA = EBITDA / Ingresos."""
    return _safe_div(ebitda(row), row["revenue"])


def net_margin(row: dict) -> Number:
    """Margen neto = Utilidad neta / Ingresos."""
    return _safe_div(row["net_income"], row["revenue"])


# --- Liquidez ----------------------------------------------------------------

def current_ratio(row: dict) -> Number:
    """Liquidez corriente = Activo corriente / Pasivo corriente."""
    return _safe_div(row["current_assets"], row["current_liabilities"])


def acid_test(row: dict) -> Number:
    """Prueba ácida = (Activo corriente - Inventario) / Pasivo corriente."""
    return _safe_div(row["current_assets"] - row["inventory"], row["current_liabilities"])


# --- Apalancamiento / solvencia ---------------------------------------------

def debt_ratio(row: dict) -> Number:
    """Razón de endeudamiento = Pasivo total / Activo total."""
    return _safe_div(row["total_liabilities"], row["total_assets"])


def debt_to_equity(row: dict) -> Number:
    """Deuda/Patrimonio = Pasivo total / Patrimonio."""
    return _safe_div(row["total_liabilities"], row["equity"])


def net_debt_to_ebitda(row: dict) -> Number:
    """(Deuda total - Caja) / EBITDA — apalancamiento financiero relativo a la caja generada."""
    td = total_debt(row)
    e = ebitda(row)
    if td is None or e is None:
        return None
    return _safe_div(td - row["cash"], e)


def interest_coverage(row: dict) -> Number:
    """Cobertura de intereses = EBIT / Gasto financiero."""
    return _safe_div(ebit(row), row["interest_expense"])


# --- Flujo de caja (aproximación) -------------------------------------------

def operating_cash_flow_proxy(row: dict) -> Number:
    """
    Proxy de flujo de caja operativo = Utilidad neta + D&A.
    Aproximación simple (no sustituye el Estado de Flujos de Efectivo auditado).
    Cuando se carguen EE.FF. reales, usar la cifra directa de FFO.
    """
    return row["net_income"] + row["depreciation_amortization"]


INDICATORS = {
    "gross_profit": gross_profit,
    "ebit": ebit,
    "ebitda": ebitda,
    "ebitda_margin": ebitda_margin,
    "net_margin": net_margin,
    "total_debt": total_debt,
    "working_capital": working_capital,
    "roa": roa,
    "roe": roe,
    "current_ratio": current_ratio,
    "acid_test": acid_test,
    "debt_ratio": debt_ratio,
    "debt_to_equity": debt_to_equity,
    "net_debt_to_ebitda": net_debt_to_ebitda,
    "interest_coverage": interest_coverage,
    "operating_cash_flow_proxy": operating_cash_flow_proxy,
}


def compute_row(row: dict) -> dict:
    """Devuelve un dict con todos los indicadores calculados para un ejercicio."""
    out = {name: fn(row) for name, fn in INDICATORS.items()}
    # Banderas de calidad/interpretación
    out["flag_negative_equity"] = row.get("equity", 0) is not None and row["equity"] < 0
    return out


def compute_all(rows: list[dict]) -> list[dict]:
    """
    Enriqute cada ejercicio con sus indicadores.
    `rows` debe venir con las partidas crudas ya tipadas a número.
    """
    enriched = []
    for row in rows:
        merged = dict(row)
        merged.update(compute_row(row))
        enriched.append(merged)
    return enriched


if __name__ == "__main__":
    # Demostración rápida con un ejercicio de ejemplo.
    sample = {
        "revenue": 5040000, "cogs": 4870000, "opex": 358000,
        "depreciation_amortization": 196000, "interest_expense": 438000,
        "income_tax": 4000, "net_income": -368000, "cash": 260000,
        "accounts_receivable": 520000, "inventory": 690000,
        "current_assets": 1610000, "total_assets": 8680000,
        "current_liabilities": 3980000, "short_term_debt": 2940000,
        "long_term_debt": 4760000, "total_liabilities": 9300000, "equity": -620000,
    }
    from pprint import pprint
    pprint(compute_row(sample))
